from __future__ import annotations

import json
import logging
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Sequence

try:
    from google.cloud import bigquery
except ModuleNotFoundError:  # pragma: no cover - fallback for minimal Python environments
    bigquery = None

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class SyncWatermark:
    table: str
    last_synced_at: str


class ETLPipelineScript:
    """Incremental Firestore/Postgres -> BigQuery ELT for ClassSync analytics."""

    def __init__(
        self,
        project_id: str | None = None,
        dataset_id: str | None = None,
        watermark_table: str = "etl_watermarks",
        firestore_client: Any | None = None,
        bq_client: Any | None = None,
    ) -> None:
        self.project_id = project_id or os.getenv("GOOGLE_CLOUD_PROJECT", "classsync-prod")
        self.dataset_id = dataset_id or os.getenv("ANALYTICS_DATASET", "classsync_analytics")
        self.watermark_table = watermark_table
        self.firestore_client = firestore_client
        self.bq_client = bq_client or (bigquery.Client(project=self.project_id) if bigquery is not None else None)

    def _now_utc(self) -> datetime:
        return datetime.now(timezone.utc)

    def _watermark_key(self, table_name: str) -> str:
        return f"{self.dataset_id}.{self.watermark_table}"

    def read_watermark(self, table_name: str) -> datetime | None:
        if self.bq_client is None:
            return None
        query = f"""
            SELECT last_synced_at
            FROM `{self._watermark_key(table_name)}`
            WHERE table_name = @table_name
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("table_name", "STRING", table_name),
            ]
        )
        result = self.bq_client.query(query, job_config=job_config)
        rows = list(result.result())
        if not rows:
            return None
        return datetime.fromisoformat(rows[0]["last_synced_at"]) if isinstance(rows[0]["last_synced_at"], str) else rows[0]["last_synced_at"]

    def write_watermark(self, table_name: str, last_synced_at: datetime) -> None:
        if self.bq_client is None:
            return
        table_ref = self.bq_client.dataset(self.dataset_id).table(self.watermark_table)
        payload = {
            "table_name": table_name,
            "last_synced_at": last_synced_at.isoformat(),
            "updated_at": self._now_utc().isoformat(),
        }
        self.bq_client.insert_rows_json(table_ref, [payload])

    def extract_modified_records(self, collection_name: str, since: datetime | None = None) -> list[dict[str, Any]]:
        if self.firestore_client is None:
            return []
        query = self.firestore_client.collection(collection_name)
        if since is not None:
            query = query.where("updatedAt", ">=", since)
        return [doc.to_dict() | {"_id": doc.id} for doc in query.stream()]

    def transform_student(self, raw: dict[str, Any]) -> dict[str, Any]:
        return {
            "student_id": str(raw.get("id") or raw.get("studentId") or raw.get("_id")),
            "org_id": raw.get("orgId"),
            "teacher_id": raw.get("teacherId"),
            "full_name": raw.get("name") or raw.get("fullName"),
            "email": raw.get("email"),
            "status": raw.get("status") or "ACTIVE",
            "created_at": self._to_iso(raw.get("createdAt")),
            "updated_at": self._to_iso(raw.get("updatedAt")),
        }

    def transform_teacher(self, raw: dict[str, Any]) -> dict[str, Any]:
        return {
            "teacher_id": str(raw.get("id") or raw.get("teacherId") or raw.get("_id")),
            "org_id": raw.get("orgId"),
            "email": raw.get("email"),
            "name": raw.get("name") or raw.get("fullName"),
            "role": raw.get("role"),
            "created_at": self._to_iso(raw.get("createdAt")),
            "updated_at": self._to_iso(raw.get("updatedAt")),
        }

    def transform_class(self, raw: dict[str, Any]) -> dict[str, Any]:
        return {
            "class_id": str(raw.get("id") or raw.get("classId") or raw.get("_id")),
            "org_id": raw.get("orgId"),
            "teacher_id": raw.get("teacherId"),
            "subject": raw.get("subject"),
            "class_name": raw.get("className"),
            "class_code": raw.get("classCode"),
            "created_at": self._to_iso(raw.get("createdAt")),
            "updated_at": self._to_iso(raw.get("updatedAt")),
        }

    def transform_attendance(self, raw: dict[str, Any]) -> dict[str, Any]:
        return {
            "attendance_id": str(raw.get("id") or raw.get("_id")),
            "student_id": raw.get("studentId"),
            "class_id": raw.get("classId"),
            "org_id": raw.get("orgId"),
            "session_date": raw.get("sessionDate"),
            "status": raw.get("status"),
            "recorded_by_user_id": raw.get("recordedByUserId"),
            "created_at": self._to_iso(raw.get("createdAt")),
        }

    def transform_submission(self, raw: dict[str, Any]) -> dict[str, Any]:
        return {
            "submission_id": str(raw.get("id") or raw.get("_id")),
            "student_id": raw.get("studentId"),
            "teacher_id": raw.get("teacherId"),
            "class_id": raw.get("classId"),
            "assignment_id": raw.get("assignmentId"),
            "submitted_at": self._to_iso(raw.get("submittedAt") or raw.get("createdAt")),
            "due_at": self._to_iso(raw.get("dueDate")),
            "is_timely": bool(raw.get("isTimely") or False),
            "score": float(raw.get("score") or 0.0),
        }

    def transform_ai_usage(self, raw: dict[str, Any]) -> dict[str, Any]:
        return {
            "usage_id": str(raw.get("id") or raw.get("_id")),
            "student_id": raw.get("studentId"),
            "teacher_id": raw.get("teacherId"),
            "org_id": raw.get("orgId"),
            "model_name": raw.get("modelName") or raw.get("model"),
            "prompt_tokens": int(raw.get("promptTokens") or 0),
            "completion_tokens": int(raw.get("completionTokens") or 0),
            "total_tokens": int(raw.get("totalTokens") or raw.get("promptTokens") or 0),
            "cost_usd": float(raw.get("costUsd") or 0.0),
            "used_at": self._to_iso(raw.get("usedAt") or raw.get("createdAt")),
        }

    def transform_payment(self, raw: dict[str, Any]) -> dict[str, Any]:
        return {
            "payment_id": str(raw.get("id") or raw.get("_id")),
            "org_id": raw.get("orgId"),
            "student_id": raw.get("studentId"),
            "teacher_id": raw.get("teacherId"),
            "amount": float(raw.get("amount") or 0.0),
            "currency": raw.get("currency") or "VND",
            "status": raw.get("status") or "PAID",
            "paid_at": self._to_iso(raw.get("paidAt") or raw.get("createdAt")),
            "due_date": self._to_iso(raw.get("dueDate")),
        }

    def _to_iso(self, value: Any) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value).isoformat()
            except ValueError:
                return value
        if hasattr(value, "isoformat"):
            return value.isoformat()
        return str(value)

    def load_rows(self, table_name: str, rows: Sequence[dict[str, Any]]) -> None:
        if not rows or self.bq_client is None:
            return
        table_ref = self.bq_client.dataset(self.dataset_id).table(table_name)
        self.bq_client.insert_rows_json(table_ref, list(rows), ignore_unknown_values=False)

    def sync(self) -> dict[str, int]:
        """Sync all canonical tables in a single nightly run."""
        sync_counts: dict[str, int] = {}
        for collection_name, transform in {
            "users": self.transform_student,
            "classes": self.transform_class,
            "attendance_records": self.transform_attendance,
            "assignmentSubmissions": self.transform_submission,
            "ai_usage": self.transform_ai_usage,
            "tuition_bills": self.transform_payment,
        }.items():
            last_sync = self.read_watermark(collection_name)
            records = self.extract_modified_records(collection_name, last_sync)
            if not records:
                sync_counts[collection_name] = 0
                continue
            cleaned_rows = [transform(record) for record in records]
            target_table = self._table_for_collection(collection_name)
            self.load_rows(target_table, cleaned_rows)
            self.write_watermark(collection_name, self._now_utc())
            sync_counts[collection_name] = len(cleaned_rows)
        return sync_counts

    def _table_for_collection(self, collection_name: str) -> str:
        mapping = {
            "users": "dim_students",
            "classes": "dim_classes",
            "attendance_records": "fact_class_attendance",
            "assignmentSubmissions": "fact_homework_submissions",
            "ai_usage": "fact_ai_token_usage",
            "tuition_bills": "fact_tuition_payments",
        }
        return mapping.get(collection_name, collection_name)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    pipeline = ETLPipelineScript()
    result = pipeline.sync()
    logger.info("etl sync complete: %s", json.dumps(result, sort_keys=True))
