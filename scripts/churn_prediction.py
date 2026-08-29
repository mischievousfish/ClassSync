from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Sequence

try:
    from sklearn.linear_model import LogisticRegression
except ModuleNotFoundError:  # pragma: no cover - fallback for minimal Python environments
    LogisticRegression = None


@dataclass(frozen=True)
class StudentRiskFeatureVector:
    student_id: str
    homework_velocity_trend: float
    consecutive_unexcused_absences: int
    engagement_drop: float
    tuition_payment_delay_days: float
    risk_score: float
    risk_level: str


class ChurnPredictionModel:
    """Rolling 14-day dropout risk model for ClassSync students."""

    def __init__(self, model: Any | None = None, version: str = "v1.0") -> None:
        self.model_version = version
        self.model = model or (LogisticRegression(max_iter=1000, class_weight="balanced") if LogisticRegression is not None else None)

    def compute_features(
        self,
        student_id: str,
        assignments: Sequence[dict[str, Any]],
        attendance: Sequence[dict[str, Any]],
        app_sessions: Sequence[dict[str, Any]],
        payments: Sequence[dict[str, Any]],
        window_days: int = 14,
    ) -> StudentRiskFeatureVector:
        cutoff = datetime.now(timezone.utc) - timedelta(days=window_days)

        recent_assignments = [item for item in assignments if self._as_dt(item.get("submittedAt")) and self._as_dt(item.get("submittedAt")) >= cutoff]
        recent_attendance = [item for item in attendance if self._as_dt(item.get("sessionDate")) and self._as_dt(item.get("sessionDate")) >= cutoff]
        recent_sessions = [item for item in app_sessions if self._as_dt(item.get("openedAt")) and self._as_dt(item.get("openedAt")) >= cutoff]
        recent_payments = [item for item in payments if self._as_dt(item.get("paidAt")) and self._as_dt(item.get("paidAt")) >= cutoff]

        homework_velocity = self._homework_velocity_trend(recent_assignments)
        unexcused_absences = self._consecutive_unexcused_absences(recent_attendance)
        engagement_drop = self._engagement_drop(recent_sessions)
        payment_delay = self._tuition_payment_delay_days(recent_payments)

        feature_vector = [homework_velocity, unexcused_absences, engagement_drop, payment_delay]
        score = self._sigmoid(self._score_from_features(feature_vector))
        level = self._risk_level(score)
        return StudentRiskFeatureVector(
            student_id=student_id,
            homework_velocity_trend=homework_velocity,
            consecutive_unexcused_absences=unexcused_absences,
            engagement_drop=engagement_drop,
            tuition_payment_delay_days=payment_delay,
            risk_score=score,
            risk_level=level,
        )

    def fit(self, X: Sequence[Sequence[float]], y: Sequence[int]) -> "ChurnPredictionModel":
        self.model.fit(X, y)
        return self

    def predict_proba(self, feature_vector: Sequence[float]) -> float:
        if self.model is not None and hasattr(self.model, "predict_proba"):
            probability = self.model.predict_proba([list(feature_vector)])[0][1]
            return float(max(0.0, min(1.0, probability)))
        return self._heuristic_probability(feature_vector)

    def risk_level_for(self, score: float) -> str:
        return self._risk_level(score)

    def intervention_trigger(self, risk_score: float) -> dict[str, Any]:
        return {
            "triggered": risk_score >= 0.75,
            "risk_score": round(risk_score, 4),
            "risk_level": self._risk_level(risk_score),
            "action": "notify_teacher_and_counselor" if risk_score >= 0.75 else "monitor_only",
        }

    def _score_from_features(self, features: Sequence[float]) -> float:
        homework_velocity, absences, engagement_drop, payment_delay = features
        return (
            max(0.0, -homework_velocity * 0.8)
            + absences * 0.22
            + max(0.0, engagement_drop) * 0.9
            + max(0.0, payment_delay) * 0.12
        )

    def _heuristic_probability(self, feature_vector: Sequence[float]) -> float:
        signal = sum(float(value) for value in feature_vector)
        return max(0.0, min(1.0, 1.0 / (1.0 + math.exp(-(signal - 0.8)))))

    def _sigmoid(self, value: float) -> float:
        return 1.0 / (1.0 + math.exp(-max(-20.0, min(20.0, value))))

    def _risk_level(self, score: float) -> str:
        if score >= 0.75:
            return "HIGH_RISK"
        if score >= 0.4:
            return "MEDIUM"
        return "LOW"

    def _homework_velocity_trend(self, assignments: Sequence[dict[str, Any]]) -> float:
        if len(assignments) < 2:
            return 0.0
        times = sorted(self._as_dt(item.get("submittedAt")) for item in assignments if self._as_dt(item.get("submittedAt")) is not None)
        if len(times) < 2:
            return 0.0
        completion_counts = [1 for _ in times]
        slope = self._linear_slope(times, completion_counts)
        return float(slope)

    def _consecutive_unexcused_absences(self, attendance: Sequence[dict[str, Any]]) -> int:
        values = [item for item in attendance if str(item.get("status", "")).upper() in {"ABSENT_UNEXCUSED", "ABSENT_EXCUSED"}]
        count = 0
        for item in reversed(values):
            if str(item.get("status", "")).upper() == "ABSENT_UNEXCUSED":
                count += 1
            else:
                break
        return count

    def _engagement_drop(self, app_sessions: Sequence[dict[str, Any]]) -> float:
        if not app_sessions:
            return 1.0
        return max(0.0, 1.0 - (len(app_sessions) / max(1, len(app_sessions) + 2)))

    def _tuition_payment_delay_days(self, payments: Sequence[dict[str, Any]]) -> float:
        if not payments:
            return 0.0
        delays = []
        for item in payments:
            due = self._as_dt(item.get("dueDate"))
            paid = self._as_dt(item.get("paidAt"))
            if due and paid:
                delays.append((paid - due).days)
        return float(max(delays, default=0))

    def _linear_slope(self, x_values: Sequence[datetime], y_values: Sequence[int]) -> float:
        if len(x_values) < 2 or len(y_values) < 2:
            return 0.0
        xs = [value.timestamp() for value in x_values]
        mean_x = sum(xs) / len(xs)
        mean_y = sum(y_values) / len(y_values)
        numerator = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, y_values))
        denominator = sum((x - mean_x) ** 2 for x in xs)
        return 0.0 if denominator == 0 else numerator / denominator

    def _as_dt(self, value: Any) -> datetime | None:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.astimezone(timezone.utc) if value.tzinfo else value.replace(tzinfo=timezone.utc)
        if isinstance(value, str):
            try:
                parsed = datetime.fromisoformat(value)
                return parsed.astimezone(timezone.utc) if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
            except ValueError:
                return None
        return None


if __name__ == "__main__":
    model = ChurnPredictionModel()
    risk = model.compute_features(
        student_id="s-001",
        assignments=[{"submittedAt": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()}],
        attendance=[{"status": "ABSENT_UNEXCUSED", "sessionDate": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()}],
        app_sessions=[{"openedAt": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()}],
        payments=[{"paidAt": (datetime.now(timezone.utc) - timedelta(days=15)).isoformat(), "dueDate": (datetime.now(timezone.utc) - timedelta(days=2)).isoformat()}],
    )
    print(risk)
