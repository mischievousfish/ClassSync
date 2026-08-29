#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT_ID:?Set GCP_PROJECT_ID}"
: "${BACKUP_BUCKET:?Set BACKUP_BUCKET, for example gs://classsync-firestore-backups}"
LOCATION="${FIRESTORE_LOCATION:-asia-southeast1}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

gcloud firestore export "${BACKUP_BUCKET}/firestore/${STAMP}" \
  --project="${GCP_PROJECT_ID}" --database="(default)" --async
echo "Started Firestore export ${STAMP}; PITR remains enabled as the primary <15 minute recovery mechanism."