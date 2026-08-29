# ClassSync DR and Privacy Runbook

## Recovery targets

- API availability target: 99.9% monthly.
- RTO: less than 1 hour.
- RPO: less than 15 minutes through Firestore PITR; six-hour exports are the portable backup layer.
- Primary: `asia-southeast1`; secondary Cloud Run deployment: `asia-east1`.

## Provisioning

1. Apply `infra/dr/main.tf` with a dedicated service account that can export Firestore and write the backup bucket:

```bash
terraform -chdir=infra/dr init
terraform -chdir=infra/dr apply \
  -var="project_id=$GCP_PROJECT_ID" \
  -var="backup_bucket_name=$BACKUP_BUCKET_NAME" \
  -var="backup_endpoint=$BACKUP_ENDPOINT" \
  -var="scheduler_service_account=$SCHEDULER_SERVICE_ACCOUNT"
```

2. Deploy the same immutable image to both Cloud Run regions behind a global HTTPS load balancer with health checks. Keep the secondary at zero or low traffic until failover validation is complete.
3. Enable Cloud DNS health-checked routing or the global load balancer; do not use client-side DNS switching as the only failover mechanism.
4. Set `FIRESTORE_EMULATOR_HOST` only in development. Production uses the multi-region Firestore database and `GCLOUD_STORAGE_BUCKET` for OCR retention cleanup.

## Scheduled backup and retention

```bash
GCP_PROJECT_ID=classsync-prod BACKUP_BUCKET=gs://classsync-firestore-backups \
  ./scripts/backup-firestore.sh

GCLOUD_STORAGE_BUCKET=classsync-prod-media npm run retention:sweep
```

Cloud Scheduler runs the export every six hours. The bucket lifecycle rule deletes objects older than 30 days. The retention sweeper removes `application_logs`, `ocr_uploads`, and `ocr/` objects older than 30 days.

## Incident failover

```bash
GCP_PROJECT_ID=classsync-prod \
GLOBAL_BACKEND_SERVICE=classsync-global \
PRIMARY_RUN_SERVICE=classsync-api-primary \
SECONDARY_RUN_SERVICE=classsync-api-secondary \
./scripts/dr-failover.sh
```

After failover, run `/health`, an authenticated synthetic API check, Firestore read/write checks, and payment webhook signature checks. Restore primary data only after the incident is contained.

## Restore and failback

```bash
GCP_PROJECT_ID=classsync-prod \
BACKUP_URI=gs://classsync-firestore-backups/firestore/20260828T000000Z \
PRIMARY_RUN_SERVICE=classsync-api-primary \
./scripts/dr-restore.sh
```

Firestore import is asynchronous. Confirm document counts, consent/erasure queues, billing statuses, and notification dedupe events before returning traffic to primary.

## Zero-downtime migrations

```bash
gcloud auth application-default login
npm run migrate
```

Migration files are ordered by semantic version under `migrations/`. The runner records completed files and uses a Firestore lock. New code should use `dualWrite` from `apps/backend/src/shared/dual-write.ts` during a compatibility window, backfill, then remove the legacy write in a later migration.

## Privacy operations

- Consent: `POST /api/v1/privacy/consent` stores type, terms version, timestamp and request IP.
- Access/export: `GET /api/v1/privacy/export-data` returns a ZIP of the authenticated user's structured records.
- Erasure: `POST /api/v1/privacy/delete-account` purges linked records, FCM tokens, schedules, classes and Firebase Auth identity; the response exposes a seven-day completion SLA for asynchronous operational follow-up.
- Keep audit evidence for consent and erasure requests in a restricted compliance project, with access limited to authorized operators.
- Review cross-border processing, processor contracts, parental consent for minors, breach notification and data-subject request handling with Vietnamese counsel before production launch. This implementation aligns controls with PDPD/GDPR principles but is not a legal certification.