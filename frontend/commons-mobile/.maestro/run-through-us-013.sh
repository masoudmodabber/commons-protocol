#!/usr/bin/env bash

set -uo pipefail

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd "$script_directory/../../.." && pwd)"
compose_file="$repository_root/docker-compose.yml"
cleanup_sql="$script_directory/cleanup-maestro-data.sql"
flow_file="$script_directory/flows/commons-market-through-us-013.yaml"
application_id="com.example.commonsmarket.dev"
acceptance_run_id="$(date +%s%N)"
device_id=""

if [[ ! "$acceptance_run_id" =~ ^[0-9]+$ ]]; then
  echo "Could not generate a numeric Maestro acceptance run identifier." >&2
  exit 1
fi

cleanup_database() {
  local run_id="$1"

  docker compose \
    --project-directory "$repository_root" \
    -f "$compose_file" \
    exec -T database \
    psql -X -U commons -d commons \
    -v ON_ERROR_STOP=1 \
    -v "acceptance_run_id=$run_id" \
    -f - < "$cleanup_sql"
}

clear_application_state() {
  local output

  if ! output="$(adb -s "$device_id" shell pm clear "$application_id" 2>&1)"; then
    echo "$output" >&2
    return 1
  fi

  if [[ "$output" != *"Success"* ]]; then
    echo "$output" >&2
    return 1
  fi
}

teardown() {
  local scenario_status=$?
  local database_cleanup_status=0
  local application_cleanup_status=0

  trap - EXIT INT TERM HUP
  set +e

  echo "Cleaning database records for Maestro run $acceptance_run_id..."
  cleanup_database "$acceptance_run_id"
  database_cleanup_status=$?

  if [[ -n "$device_id" ]]; then
    echo "Clearing Android application state on $device_id..."
    clear_application_state
    application_cleanup_status=$?
  else
    echo "The Android device was not resolved; application state could not be cleared." >&2
    application_cleanup_status=1
  fi

  if (( scenario_status != 0 )); then
    exit "$scenario_status"
  fi

  if (( database_cleanup_status != 0 || application_cleanup_status != 0 )); then
    exit 1
  fi

  exit 0
}

trap teardown EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

mapfile -t connected_devices < <(
  adb devices | awk 'NR > 1 && $2 == "device" { print $1 }'
)

if (( ${#connected_devices[@]} != 1 )); then
  echo "Expected exactly one connected Android device, found ${#connected_devices[@]}." >&2
  exit 1
fi

device_id="${connected_devices[0]}"

echo "Removing stale Maestro acceptance records from earlier abandoned runs..."
if ! cleanup_database ""; then
  echo "Pre-run Maestro database cleanup failed." >&2
  exit 1
fi

echo "Running Maestro acceptance scenario with run identifier $acceptance_run_id..."
maestro test \
  --device "$device_id" \
  -e "RUN_ID=$acceptance_run_id" \
  "$flow_file"

exit $?
