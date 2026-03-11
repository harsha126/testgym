#!/bin/bash
# gym-management-backup.sh
# Daily database backup to Google Drive using pg_dump + rclone
# Setup: Configure rclone with a Google Drive remote named "gdrive"
# Cron: 0 2 * * * /path/to/gym-management-backup.sh >> /var/log/gym-backup.log 2>&1

set -e

# Configuration
DB_NAME="gymdb"
DB_USER="gymuser"
DB_HOST="localhost"
DB_PORT="5432"
BACKUP_DIR="/tmp/gym-backups"
RCLONE_REMOTE="gdrive:gym-backups"
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamped filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/gymdb_backup_$TIMESTAMP.sql.gz"

echo "[$(date)] Starting database backup..."

# Dump and compress
PGPASSWORD="gympass" pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[$(date)] Backup created: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"

# Upload to Google Drive
echo "[$(date)] Uploading to Google Drive..."
rclone copy "$BACKUP_FILE" "$RCLONE_REMOTE/" --progress

echo "[$(date)] Upload complete."

# Cleanup old local backups
echo "[$(date)] Cleaning up local backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "gymdb_backup_*.sql.gz" -mtime "+$RETENTION_DAYS" -delete

# Cleanup old remote backups
echo "[$(date)] Cleaning up remote backups older than $RETENTION_DAYS days..."
rclone delete "$RCLONE_REMOTE/" --min-age "${RETENTION_DAYS}d"

echo "[$(date)] Backup process completed successfully."
