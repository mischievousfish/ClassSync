CREATE SCHEMA IF NOT EXISTS `classsync_analytics`;

CREATE OR REPLACE TABLE `classsync_analytics.dim_organizations` (
  organization_id STRING NOT NULL,
  organization_name STRING,
  tier STRING,
  country STRING,
  created_at TIMESTAMP,
  PRIMARY KEY (organization_id) NOT ENFORCED
);

CREATE OR REPLACE TABLE `classsync_analytics.dim_students` (
  student_id STRING NOT NULL,
  org_id STRING,
  teacher_id STRING,
  full_name STRING,
  email STRING,
  status STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  PRIMARY KEY (student_id) NOT ENFORCED
);

CREATE OR REPLACE TABLE `classsync_analytics.dim_teachers` (
  teacher_id STRING NOT NULL,
  org_id STRING,
  email STRING,
  name STRING,
  role STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  PRIMARY KEY (teacher_id) NOT ENFORCED
);

CREATE OR REPLACE TABLE `classsync_analytics.dim_classes` (
  class_id STRING NOT NULL,
  org_id STRING,
  teacher_id STRING,
  subject STRING,
  class_name STRING,
  class_code STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  PRIMARY KEY (class_id) NOT ENFORCED
);

CREATE OR REPLACE TABLE `classsync_analytics.dim_date` (
  date_id DATE NOT NULL,
  year INT64,
  month INT64,
  month_name STRING,
  quarter INT64,
  week_of_year INT64,
  day_of_week INT64,
  is_weekend BOOL,
  PRIMARY KEY (date_id) NOT ENFORCED
);

CREATE OR REPLACE TABLE `classsync_analytics.dim_ai_models` (
  model_id STRING NOT NULL,
  model_name STRING,
  provider STRING,
  version STRING,
  status STRING,
  PRIMARY KEY (model_id) NOT ENFORCED
);

CREATE OR REPLACE TABLE `classsync_analytics.fact_homework_submissions` (
  submission_id STRING NOT NULL,
  student_id STRING,
  teacher_id STRING,
  class_id STRING,
  assignment_id STRING,
  submitted_at TIMESTAMP,
  due_at TIMESTAMP,
  is_timely BOOL,
  score FLOAT64,
  PRIMARY KEY (submission_id) NOT ENFORCED
);

CREATE OR REPLACE TABLE `classsync_analytics.fact_class_attendance` (
  attendance_id STRING NOT NULL,
  student_id STRING,
  class_id STRING,
  org_id STRING,
  session_date DATE,
  status STRING,
  recorded_by_user_id STRING,
  created_at TIMESTAMP,
  PRIMARY KEY (attendance_id) NOT ENFORCED
);

CREATE OR REPLACE TABLE `classsync_analytics.fact_ai_token_usage` (
  usage_id STRING NOT NULL,
  student_id STRING,
  teacher_id STRING,
  org_id STRING,
  model_name STRING,
  prompt_tokens INT64,
  completion_tokens INT64,
  total_tokens INT64,
  cost_usd FLOAT64,
  used_at TIMESTAMP,
  PRIMARY KEY (usage_id) NOT ENFORCED
);

CREATE OR REPLACE TABLE `classsync_analytics.fact_tuition_payments` (
  payment_id STRING NOT NULL,
  org_id STRING,
  student_id STRING,
  teacher_id STRING,
  amount NUMERIC,
  currency STRING,
  status STRING,
  paid_at TIMESTAMP,
  due_date TIMESTAMP,
  PRIMARY KEY (payment_id) NOT ENFORCED
);

CREATE OR REPLACE TABLE `classsync_analytics.etl_watermarks` (
  table_name STRING NOT NULL,
  last_synced_at TIMESTAMP,
  updated_at TIMESTAMP,
  PRIMARY KEY (table_name) NOT ENFORCED
);

CREATE OR REPLACE TABLE `classsync_analytics.student_risk_scores` (
  student_id STRING NOT NULL,
  risk_score FLOAT64,
  risk_level STRING,
  rolling_window_days INT64,
  model_version STRING,
  computed_at TIMESTAMP,
  PRIMARY KEY (student_id) NOT ENFORCED
);

CREATE OR REPLACE MATERIALIZED VIEW `classsync_analytics.mv_student_dropout_signal` AS
SELECT
  s.student_id,
  COUNT(CASE WHEN a.status IN ('ABSENT_UNEXCUSED', 'ABSENT_EXCUSED') THEN 1 END) AS absences,
  AVG(CASE WHEN f.is_timely THEN 1 ELSE 0 END) AS timely_ratio,
  SUM(CASE WHEN f.score > 0 THEN 1 ELSE 0 END) AS scored_assignments,
  MAX(f.submitted_at) AS last_submission_at,
FROM `classsync_analytics.dim_students` s
LEFT JOIN `classsync_analytics.fact_class_attendance` a ON a.student_id = s.student_id
LEFT JOIN `classsync_analytics.fact_homework_submissions` f ON f.student_id = s.student_id
GROUP BY s.student_id;
