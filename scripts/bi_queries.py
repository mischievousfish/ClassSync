from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class BIQueryResult:
    name: str
    sql: str


class BIQueryRepository:
    """BigQuery / Postgres repository for operational and commercial analytics."""

    def __init__(self, dataset: str = "classsync_analytics") -> None:
        self.dataset = dataset

    def monthly_recurring_revenue(self) -> BIQueryResult:
        sql = f"""
        WITH revenue AS (
          SELECT
            DATE_TRUNC(PAID_AT, MONTH) AS month_start,
            SUM(AMOUNT) AS mrr,
            SUM(CASE WHEN status = 'PAID' THEN AMOUNT ELSE 0 END) AS paid_revenue,
            SUM(CASE WHEN status = 'PENDING' THEN AMOUNT ELSE 0 END) AS pending_revenue
          FROM `{self.dataset}.fact_tuition_payments`
          WHERE status IN ('PAID', 'PENDING')
          GROUP BY 1
        )
        SELECT
          month_start,
          mrr,
          paid_revenue,
          pending_revenue,
          mrr * 12 AS arr_estimate
        FROM revenue
        ORDER BY month_start DESC;
        """
        return BIQueryResult("monthly_recurring_revenue", sql)

    def expansion_revenue(self) -> BIQueryResult:
        sql = f"""
        SELECT
          DATE_TRUNC(paid_at, MONTH) AS month_start,
          SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS expansion_revenue,
          COUNT(*) AS expansion_events
        FROM `{self.dataset}.fact_tuition_payments`
        WHERE status = 'PAID'
          AND amount > 0
        GROUP BY 1
        ORDER BY 1 DESC;
        """
        return BIQueryResult("expansion_revenue", sql)

    def churn_rate_by_tier(self) -> BIQueryResult:
        sql = f"""
        SELECT
          o.tier,
          COUNT(DISTINCT s.student_id) AS active_students,
          AVG(CASE WHEN sr.risk_level = 'HIGH_RISK' THEN 1 ELSE 0 END) AS churn_risk_ratio,
          SAFE_DIVIDE(
            COUNT(CASE WHEN sr.risk_level = 'HIGH_RISK' THEN 1 END),
            COUNT(DISTINCT s.student_id)
          ) AS churn_rate_estimate
        FROM `{self.dataset}.dim_students` s
        JOIN `{self.dataset}.dim_organizations` o ON o.organization_id = s.org_id
        LEFT JOIN `{self.dataset}.student_risk_scores` sr ON sr.student_id = s.student_id
        GROUP BY o.tier
        ORDER BY churn_rate_estimate DESC;
        """
        return BIQueryResult("churn_rate_by_tier", sql)

    def teacher_ai_efficiency_index(self) -> BIQueryResult:
        sql = f"""
        WITH ai_events AS (
          SELECT
            teacher_id,
            DATE_TRUNC(used_at, WEEK) AS week_start,
            SUM(total_tokens) AS total_tokens,
            COUNT(*) AS generation_events
          FROM `{self.dataset}.fact_ai_token_usage`
          GROUP BY teacher_id, DATE_TRUNC(used_at, WEEK)
        )
        SELECT
          teacher_id,
          week_start,
          generation_events,
          SAFE_DIVIDE(total_tokens, generation_events) AS tokens_per_action,
          generation_events * 0.4 AS estimated_hours_saved_per_week
        FROM ai_events
        ORDER BY week_start DESC;
        """
        return BIQueryResult("teacher_ai_efficiency_index", sql)

    def cac_ltv_ratio(self) -> BIQueryResult:
        sql = f"""
        WITH marketing AS (
          SELECT
            marketing_channel,
            SUM(spend_usd) AS total_cac,
            COUNT(*) AS customers_acquired
          FROM `{self.dataset}.marketing_channel_costs`
          GROUP BY marketing_channel
        ),
        lifetime AS (
          SELECT
            marketing_channel,
            AVG(ltv_usd) AS avg_ltv
          FROM `{self.dataset}.customer_lifetime_value`
          GROUP BY marketing_channel
        )
        SELECT
          m.marketing_channel,
          m.total_cac / NULLIF(m.customers_acquired, 0) AS cac_per_customer,
          l.avg_ltv,
          SAFE_DIVIDE(l.avg_ltv, m.total_cac / NULLIF(m.customers_acquired, 0)) AS ltv_cac_ratio
        FROM marketing m
        JOIN lifetime l USING (marketing_channel)
        ORDER BY ltv_cac_ratio DESC;
        """
        return BIQueryResult("cac_ltv_ratio", sql)

    def all_queries(self) -> list[BIQueryResult]:
        return [
            self.monthly_recurring_revenue(),
            self.expansion_revenue(),
            self.churn_rate_by_tier(),
            self.teacher_ai_efficiency_index(),
            self.cac_ltv_ratio(),
        ]


if __name__ == "__main__":
    repo = BIQueryRepository()
    for item in repo.all_queries():
        print(f"-- {item.name}\n{item.sql}\n")
