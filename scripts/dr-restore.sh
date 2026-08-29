#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${BACKUP_URI:?Set BACKUP_URI, for example gs://.../firestore/20260828T000000Z}"
: "${PRIMARY_RUN_SERVICE:?Set PRIMARY_RUN_SERVICE}"

gcloud firestore import "${BACKUP_URI}" --project="${GCP_PROJECT_ID}" --database="(default)" --async
gcloud run services update-traffic "${PRIMARY_RUN_SERVICE}" --region=asia-southeast1 --to-latest --project="${GCP_PROJECT_ID}"
echo "Restore started asynchronously. Validate document counts, consent/erasure queues, and synthetic API checks before failback."