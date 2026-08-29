terraform {
  required_providers {
    google = { source = "hashicorp/google", version = "~> 6.0" }
  }
}

variable "project_id" { type = string }
variable "backup_bucket_name" { type = string }
variable "backup_endpoint" { type = string }
variable "scheduler_service_account" { type = string }

provider "google" { project = var.project_id }

resource "google_firestore_database" "default" {
  project                 = var.project_id
  name                    = "(default)"
  location_id             = "asia-southeast1"
  type                    = "FIRESTORE_NATIVE"
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY"
  deletion_policy         = "DELETE"
}

resource "google_storage_bucket" "firestore_backups" {
  name                        = var.backup_bucket_name
  location                    = "ASIA"
  uniform_bucket_level_access = true
  versioning { enabled = true }
  lifecycle_rule {
    condition { age = 30 }
    action { type = "Delete" }
  }
}

resource "google_cloud_scheduler_job" "firestore_export" {
  name      = "classsync-firestore-export"
  schedule  = "0 */6 * * *"
  time_zone = "Etc/UTC"
  http_target {
    uri         = var.backup_endpoint
    http_method = "POST"
    oidc_token { service_account_email = var.scheduler_service_account }
    body = base64encode("{}")
  }
}

output "backup_bucket" { value = google_storage_bucket.firestore_backups.url }