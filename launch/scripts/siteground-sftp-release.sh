#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 backup|deploy|restore <payload-dir> <backup-dir>" >&2
  exit 64
}

[[ $# -eq 3 ]] || usage

mode="$1"
payload_dir="$(realpath -m "$2")"
backup_dir="$(realpath -m "$3")"

case "$mode" in
  backup|deploy|restore) ;;
  *) usage ;;
esac

: "${SITEGROUND_SFTP_HOST:?SITEGROUND_SFTP_HOST is required}"
: "${SITEGROUND_SFTP_USERNAME:?SITEGROUND_SFTP_USERNAME is required}"
: "${SITEGROUND_SFTP_PASSWORD:?SITEGROUND_SFTP_PASSWORD is required}"
: "${SITEGROUND_REMOTE_DIR:?SITEGROUND_REMOTE_DIR is required}"

SITEGROUND_SFTP_PORT="${SITEGROUND_SFTP_PORT:-22}"
[[ "$SITEGROUND_SFTP_PORT" =~ ^[0-9]+$ ]] || {
  echo "SITEGROUND_SFTP_PORT must be numeric." >&2
  exit 65
}

remote_root="${SITEGROUND_REMOTE_DIR%/}"
[[ -n "$remote_root" ]] || remote_root="/"

lftp_run() {
  local commands="$1"
  lftp \
    -u "$SITEGROUND_SFTP_USERNAME","$SITEGROUND_SFTP_PASSWORD" \
    -p "$SITEGROUND_SFTP_PORT" \
    "sftp://$SITEGROUND_SFTP_HOST" \
    -e "set cmd:fail-exit yes; set net:max-retries 2; set net:timeout 20; set sftp:auto-confirm yes; ${commands}; bye"
}

remote_path() {
  local relative="$1"
  if [[ "$remote_root" == "/" ]]; then
    printf '/%s' "$relative"
  else
    printf '%s/%s' "$remote_root" "$relative"
  fi
}

assert_relative_path() {
  local relative="$1"
  [[ -n "$relative" && "$relative" != /* && "$relative" != *".."* ]] || {
    echo "Refusing unsafe managed path: $relative" >&2
    exit 66
  }
  [[ "$relative" =~ ^[A-Za-z0-9._/-]+/?$ ]] || {
    echo "Refusing unsupported managed path: $relative" >&2
    exit 66
  }
}

write_managed_entries() {
  local source_root="$1"
  local destination="$2"

  [[ -d "$source_root" ]] || {
    echo "Payload directory is missing: $source_root" >&2
    exit 66
  }

  : > "$destination"

  while IFS= read -r name; do
    printf 'dir\t%s/\n' "$name" >> "$destination"
  done < <(find "$source_root" -mindepth 1 -maxdepth 1 -type d ! -name wp -printf '%f\n' | LC_ALL=C sort)

  while IFS= read -r name; do
    printf 'file\t%s\n' "$name" >> "$destination"
  done < <(find "$source_root" -mindepth 1 -maxdepth 1 -type f -printf '%f\n' | LC_ALL=C sort)

  for relative in wp/.htaccess wp/index.php; do
    [[ -f "$source_root/$relative" ]] && printf 'file\t%s\n' "$relative" >> "$destination"
  done

  for relative in wp/wp-content/mu-plugins wp/wp-content/themes; do
    [[ -d "$source_root/$relative" ]] && printf 'dir\t%s/\n' "$relative" >> "$destination"
  done
}

verify_connection() {
  lftp_run "cls -1 \"$remote_root\"" >/dev/null
}

backup_managed_payload() {
  local entries="$backup_dir/managed-entries.tsv"
  local absent="$backup_dir/absent-entries.tsv"

  if [[ "$backup_dir" == "/" || "$backup_dir" == "$payload_dir" ]]; then
    echo "Refusing unsafe backup directory: $backup_dir" >&2
    exit 66
  fi
  if [[ -e "$backup_dir" ]] && [[ -n "$(find "$backup_dir" -mindepth 1 -print -quit 2>/dev/null)" ]]; then
    echo "Backup directory must be empty: $backup_dir" >&2
    exit 66
  fi
  mkdir -p "$backup_dir/files"
  write_managed_entries "$payload_dir" "$entries"
  : > "$absent"

  while IFS=$'\t' read -r type relative; do
    assert_relative_path "$relative"
    local normalized="${relative%/}"
    local remote
    remote="$(remote_path "$normalized")"
    local destination="$backup_dir/files/$normalized"

    local probe="cls -1 \"$remote\""
    [[ "$type" == "dir" ]] && probe="cls -d \"$remote\""
    if ! lftp_run "$probe" >/dev/null 2>&1; then
      printf '%s\t%s\n' "$type" "$relative" >> "$absent"
      continue
    fi

    if [[ "$type" == "dir" ]]; then
      mkdir -p "$destination"
      lftp_run "mirror --parallel=4 --no-perms \"$remote\" \"$destination\""
    else
      mkdir -p "$(dirname "$destination")"
      lftp_run "get \"$remote\" -o \"$destination\""
    fi
  done < "$entries"

  {
    printf 'source_run_id=%s\n' "${GITHUB_RUN_ID:-local}"
    printf 'source_sha=%s\n' "${GITHUB_SHA:-unknown}"
    printf 'remote_host=%s\n' "$SITEGROUND_SFTP_HOST"
    printf 'remote_root=%s\n' "$remote_root"
    date -u '+created_utc=%Y-%m-%dT%H:%M:%SZ'
  } > "$backup_dir/metadata.txt"
}

upload_managed_payload() {
  local source_root="$1"
  local entries_file="$2"

  while IFS=$'\t' read -r type relative; do
    assert_relative_path "$relative"
    local normalized="${relative%/}"
    local source="$source_root/$normalized"
    local remote
    remote="$(remote_path "$normalized")"

    if [[ "$type" == "dir" ]]; then
      [[ -d "$source" ]] || {
        echo "Managed directory is missing: $source" >&2
        exit 67
      }
      lftp_run "mkdir -p \"$remote\"; mirror --reverse --delete --parallel=4 --no-perms \"$source\" \"$remote\""
    else
      [[ -f "$source" ]] || {
        echo "Managed file is missing: $source" >&2
        exit 67
      }
      local remote_parent
      remote_parent="$(dirname "$remote")"
      lftp_run "mkdir -p \"$remote_parent\"; put \"$source\" -o \"$remote\""
    fi
  done < "$entries_file"
}

remove_previously_absent_entries() {
  local absent_file="$backup_dir/absent-entries.tsv"
  [[ -f "$absent_file" ]] || return 0

  while IFS=$'\t' read -r type relative; do
    [[ -n "$relative" ]] || continue
    assert_relative_path "$relative"
    local normalized="${relative%/}"
    local remote
    remote="$(remote_path "$normalized")"

    if [[ "$type" == "dir" ]]; then
      lftp_run "rm -r \"$remote\"" >/dev/null 2>&1 || true
    else
      lftp_run "rm \"$remote\"" >/dev/null 2>&1 || true
    fi
  done < "$absent_file"
}

restore_backup() {
  local entries="$backup_dir/managed-entries.tsv"
  [[ -f "$entries" && -d "$backup_dir/files" ]] || {
    echo "Backup contract is incomplete: $backup_dir" >&2
    exit 68
  }

  local present_entries="$backup_dir/present-entries.tsv"
  : > "$present_entries"
  while IFS=$'\t' read -r type relative; do
    local normalized="${relative%/}"
    if [[ ( "$type" == "dir" && -d "$backup_dir/files/$normalized" ) || ( "$type" == "file" && -f "$backup_dir/files/$normalized" ) ]]; then
      printf '%s\t%s\n' "$type" "$relative" >> "$present_entries"
    fi
  done < "$entries"

  upload_managed_payload "$backup_dir/files" "$present_entries"
  remove_previously_absent_entries
}

verify_connection

case "$mode" in
  backup)
    backup_managed_payload
    ;;
  deploy)
    entries_file="$(mktemp)"
    trap 'rm -f "$entries_file"' EXIT
    write_managed_entries "$payload_dir" "$entries_file"
    upload_managed_payload "$payload_dir" "$entries_file"
    ;;
  restore)
    restore_backup
    ;;
esac
