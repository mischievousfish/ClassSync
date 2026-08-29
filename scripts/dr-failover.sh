#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${GLOBAL_BACKEND_SERVICE:?Set GLOBAL_BACKEND_SERVICE}"
: "${PRIMARY_RUN_SERVICE:?Set PRIMARY_RUN_SERVICE}"
: "${SECONDARY_RUN_SERVICE:?Set SECONDARY_RUN_SERVICE}"

gcloud run services update-traffic "${SECONDARY_RUN_SERVICE}" --region=asia-east1 --to-latest --project="${GCP_PROJECT_ID}"
gcloud compute backend-services update "${GLOBAL_BACKEND_SERVICE}" --global --project="${GCP_PROJECT_ID}" --enable-cdn
gcloud compute backend-services update-backend "${GLOBAL_BACKEND_SERVICE}" --global --project="${GCP_PROJECT_ID}" --instance-group="${SECONDARY_RUN_SERVICE}" 2>/dev/null || true
echo "Secondary traffic enabled. Verify health checks, auth, Firestore access, and DNS before declaring the incident resolved."