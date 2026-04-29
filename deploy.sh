#!/usr/bin/env bash
# =============================================================
#  Iron Addicts Gym Management — VPS Deployment Script
#
#  Performs a full deploy cycle:
#    1. Pre-flight checks (docker, compose, git, curl, .env)
#    2. git fetch + fast-forward pull of origin/main
#    3. docker compose build (backend + frontend)
#    4. Bring services up in order (postgres -> backend -> frontend)
#    5. Wait for each service to become healthy
#    6. Surface Flyway migration output from backend logs
#    7. HTTP / TCP health checks on backend + frontend + db
#    8. Print a neatly formatted summary; tail logs of any failed
#       service into the deploy log.
#
#  Logs everything to gym-management/logs/deploy-<timestamp>.log
#  while still printing colored output to the terminal.
#
#  Usage:    ./deploy.sh
#  Exit 0   when every service is UP, non-zero otherwise.
# =============================================================

set -Eeuo pipefail

# ---- Paths ----
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$REPO_DIR/gym-management"
LOG_DIR="$APP_DIR/logs"
LOG_RETENTION_DAYS="${LOG_RETENTION_DAYS:-30}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$LOG_DIR/deploy-$TIMESTAMP.log"

mkdir -p "$LOG_DIR"
find "$LOG_DIR" -maxdepth 1 -type f -name 'deploy-*.log' -mtime +"$LOG_RETENTION_DAYS" -delete 2>/dev/null || true
: > "$LOG_FILE"

# ---- Colors (terminal only; stripped from log file) ----
if [[ -t 1 ]]; then
    C_RESET=$'\033[0m'
    C_DIM=$'\033[2m'
    C_RED=$'\033[0;31m'
    C_GREEN=$'\033[0;32m'
    C_YELLOW=$'\033[1;33m'
    C_BLUE=$'\033[0;34m'
    C_BOLD=$'\033[1m'
else
    C_RESET=""; C_DIM=""; C_RED=""; C_GREEN=""; C_YELLOW=""; C_BLUE=""; C_BOLD=""
fi

# ---- Logging helpers ----
ts() { date -u +'%Y-%m-%dT%H:%M:%SZ'; }

# Strip ANSI escapes for the log file copy.
_log_to_file() {
    printf '%s\n' "$1" | sed -E 's/\x1B\[[0-9;]*[A-Za-z]//g' >> "$LOG_FILE"
}

log_info() {
    local msg="[$(ts)] [INFO ] $*"
    printf '%s\n' "$msg"
    _log_to_file "$msg"
}
log_warn() {
    local msg="[$(ts)] [WARN ] $*"
    printf '%b%s%b\n' "$C_YELLOW" "$msg" "$C_RESET"
    _log_to_file "$msg"
}
log_error() {
    local msg="[$(ts)] [ERROR] $*"
    printf '%b%s%b\n' "$C_RED" "$msg" "$C_RESET" >&2
    _log_to_file "$msg"
}
log_ok() {
    local msg="[$(ts)] [ OK  ] $*"
    printf '%b%s%b\n' "$C_GREEN" "$msg" "$C_RESET"
    _log_to_file "$msg"
}
log_section() {
    local title="$*"
    local bar="============================================================"
    printf '\n%b%s%b\n' "$C_BLUE" "$bar" "$C_RESET"
    printf '%b== %s%b\n'  "$C_BLUE$C_BOLD" "$title" "$C_RESET"
    printf '%b%s%b\n\n'   "$C_BLUE" "$bar" "$C_RESET"
    {
        printf '\n%s\n' "$bar"
        printf '== %s\n' "$title"
        printf '%s\n\n' "$bar"
    } >> "$LOG_FILE"
}

# Run a command, mirror its stdout+stderr into the log file with timestamps.
run_logged() {
    log_info "\$ $*"
    # shellcheck disable=SC2069
    if "$@" > >(while IFS= read -r line; do
                    printf '          %s\n' "$line"
                    _log_to_file "          $line"
                done) 2>&1; then
        return 0
    else
        return $?
    fi
}

# ---- Failure / exit traps ----
DEPLOY_OK=0
on_err() {
    local exit_code=$?
    local line_no=$1
    log_error "deploy.sh failed at line $line_no (exit $exit_code): ${BASH_COMMAND}"
}
on_exit() {
    local exit_code=$?
    if [[ $exit_code -eq 0 && $DEPLOY_OK -eq 1 ]]; then
        printf '\n%b== Deployment complete ==%b\n' "$C_GREEN$C_BOLD" "$C_RESET"
    else
        printf '\n%b== Deployment FAILED (exit %d) ==%b\n' "$C_RED$C_BOLD" "$exit_code" "$C_RESET" >&2
    fi
    printf 'Full log: %s\n' "$LOG_FILE"
    _log_to_file "Deploy script exiting with code $exit_code"
}
trap 'on_err $LINENO' ERR
trap on_exit EXIT

# ---- Helpers ----
require_cmd() {
    local cmd=$1
    if ! command -v "$cmd" >/dev/null 2>&1; then
        log_error "Required command '$cmd' not found on PATH."
        exit 1
    fi
    log_ok "found: $cmd ($(command -v "$cmd"))"
}

# Wait for a docker container to report healthy.  Args: container, timeout-seconds.
wait_for_healthy() {
    local container=$1
    local timeout=${2:-120}
    local elapsed=0
    local status="starting"
    log_info "waiting for '$container' to become healthy (timeout ${timeout}s)..."
    while [[ $elapsed -lt $timeout ]]; do
        status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}no-healthcheck{{end}}' \
                    "$container" 2>/dev/null || echo "missing")
        case "$status" in
            healthy)
                log_ok "$container is healthy (after ${elapsed}s)"
                return 0
                ;;
            unhealthy)
                log_error "$container reported UNHEALTHY after ${elapsed}s"
                return 1
                ;;
            no-healthcheck)
                log_warn "$container has no healthcheck defined; skipping wait."
                return 0
                ;;
            missing)
                log_error "$container does not exist."
                return 1
                ;;
        esac
        sleep 3
        elapsed=$((elapsed + 3))
        printf '.'
    done
    printf '\n'
    log_error "$container did not become healthy within ${timeout}s (last status: $status)"
    return 1
}

# Wait for a TCP port to accept connections (used for frontend which has no compose healthcheck).
wait_for_http_200() {
    local url=$1
    local timeout=${2:-60}
    local elapsed=0
    log_info "waiting for HTTP 200 from $url (timeout ${timeout}s)..."
    while [[ $elapsed -lt $timeout ]]; do
        local code
        code=$(curl -fsS --max-time 5 -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo "000")
        if [[ "$code" == "200" ]]; then
            log_ok "$url -> 200 (after ${elapsed}s)"
            return 0
        fi
        sleep 3
        elapsed=$((elapsed + 3))
        printf '.'
    done
    printf '\n'
    log_error "$url did not return 200 within ${timeout}s"
    return 1
}

# Dump the last N lines of a container's log into the deploy log on failure.
dump_container_tail() {
    local container=$1
    local lines=${2:-50}
    log_section "Last $lines log lines from $container"
    if docker ps -a --format '{{.Names}}' | grep -qx "$container"; then
        docker logs --tail "$lines" "$container" 2>&1 \
            | while IFS= read -r line; do _log_to_file "  $line"; printf '  %s\n' "$line"; done
    else
        log_warn "$container does not exist; nothing to dump."
    fi
}

# ---- Banner ----
log_section "Iron Addicts Gym :: Deployment $TIMESTAMP"
log_info "repo dir : $REPO_DIR"
log_info "app dir  : $APP_DIR"
log_info "log file : $LOG_FILE"

# ---- Step 1: Pre-flight ----
log_section "Pre-flight checks"

require_cmd docker
require_cmd git
require_cmd curl
require_cmd sed
require_cmd grep
require_cmd tee
require_cmd head

if ! docker compose version >/dev/null 2>&1; then
    log_error "'docker compose' plugin is not available. Install Docker Compose v2."
    exit 1
fi
log_ok "docker compose v2 available: $(docker compose version --short 2>/dev/null || docker compose version | head -n1)"

if ! docker info >/dev/null 2>&1; then
    log_error "Docker daemon is not running or current user lacks permission."
    exit 1
fi
log_ok "docker daemon reachable"

if [[ ! -f "$APP_DIR/.env" ]]; then
    log_error ".env not found at $APP_DIR/.env. Refusing to deploy with missing or placeholder credentials."
    if [[ -f "$APP_DIR/.env.example" ]]; then
        log_error "A template is available at $APP_DIR/.env.example -- copy it, fill in real values, then re-run."
    fi
    exit 1
else
    log_ok ".env present at $APP_DIR/.env"
fi

# Safely load .env (KEY=VALUE only) so we know which ports to probe,
# without executing arbitrary shell from the file.
load_dotenv_safely() {
    local file="$1" line key value n=0
    while IFS= read -r line || [[ -n "$line" ]]; do
        n=$((n + 1))
        [[ "$line" =~ ^[[:space:]]*$ ]] && continue
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        if [[ "$line" =~ ^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
            key="${BASH_REMATCH[2]}"
            value="${BASH_REMATCH[3]}"
            value="${value#"${value%%[![:space:]]*}"}"
            value="${value%"${value##*[![:space:]]}"}"
            if [[ "$value" =~ ^\"(.*)\"$ ]]; then
                value="${BASH_REMATCH[1]}"
            elif [[ "$value" =~ ^\'(.*)\'$ ]]; then
                value="${BASH_REMATCH[1]}"
            fi
            export "$key=$value"
        else
            log_error "Invalid line in $file at $n: $line"
            exit 1
        fi
    done < "$file"
}
load_dotenv_safely "$APP_DIR/.env"
: "${BACKEND_PORT:=8080}"
: "${FRONTEND_PORT:=80}"
: "${POSTGRES_USER:=gymuser}"
log_info "ports -> backend=$BACKEND_PORT, frontend=$FRONTEND_PORT"

# Refuse to deploy with a dirty working tree (apart from this log dir, which is gitignored).
cd "$REPO_DIR"
if [[ -n "$(git status --porcelain)" ]]; then
    log_error "Working tree is dirty. Commit or stash local changes before deploying:"
    git status --short | while IFS= read -r line; do _log_to_file "  $line"; printf '  %s\n' "$line"; done
    exit 1
fi
log_ok "working tree clean"

# ---- Step 2: Update source ----
log_section "Updating source from origin/main"

BEFORE_SHA=$(git rev-parse HEAD)
log_info "current HEAD: $BEFORE_SHA ($(git rev-parse --abbrev-ref HEAD))"

git_with_retry() {
    local attempt=1
    local delay=2
    while (( attempt <= 4 )); do
        if "$@"; then
            return 0
        fi
        log_warn "git command failed (attempt $attempt): $* -- retrying in ${delay}s"
        sleep "$delay"
        attempt=$((attempt + 1))
        delay=$((delay * 2))
    done
    log_error "git command failed after 4 attempts: $*"
    return 1
}

run_logged git_with_retry git fetch --prune origin main
run_logged git checkout main
run_logged git_with_retry git pull --ff-only origin main

AFTER_SHA=$(git rev-parse HEAD)
if [[ "$BEFORE_SHA" == "$AFTER_SHA" ]]; then
    log_info "no new commits on origin/main (HEAD still $AFTER_SHA)"
else
    log_ok "advanced HEAD: $BEFORE_SHA -> $AFTER_SHA"
    log_info "new commits being deployed:"
    git log --oneline "$BEFORE_SHA..$AFTER_SHA" \
        | while IFS= read -r line; do _log_to_file "  $line"; printf '  %s\n' "$line"; done
fi

# ---- Step 3: Build images ----
log_section "Building Docker images"

cd "$APP_DIR"
run_logged docker compose build --pull backend frontend

# ---- Step 4: Bring services up in order ----
log_section "Starting services"

# Postgres first.
run_logged docker compose up -d postgres
wait_for_healthy gym-postgres 60 || { dump_container_tail gym-postgres; exit 1; }

# Backend (Flyway runs here).
run_logged docker compose up -d backend
if ! wait_for_healthy gym-backend 180; then
    log_warn "backend container is not reporting healthy via /actuator/health."
    log_warn "Will continue and rely on direct health-check probes below."
fi

# Frontend.
run_logged docker compose up -d frontend
wait_for_http_200 "http://localhost:${FRONTEND_PORT}/" 60 \
    || { dump_container_tail gym-frontend; exit 1; }

# ---- Step 5: Surface Flyway migration output ----
log_section "Flyway migration output (from backend logs)"

FLYWAY_LINES=$(docker compose logs --no-color backend 2>/dev/null \
    | grep -E 'Flyway|Migrating schema|Successfully applied|Schema .* is up to date|Current version of schema|Validated [0-9]+ migration' \
    || true)
if [[ -z "$FLYWAY_LINES" ]]; then
    log_warn "No Flyway lines found in backend logs (already up-to-date, or backend hasn't logged yet)."
else
    printf '%s\n' "$FLYWAY_LINES" \
        | while IFS= read -r line; do _log_to_file "  $line"; printf '  %s\n' "$line"; done
fi

# ---- Step 6: Health checks ----
log_section "Health checks"

BACKEND_OK=0
FRONTEND_OK=0
DB_OK=0

# --- Backend ---
log_info "probing backend  -> http://localhost:${BACKEND_PORT}/actuator/health"
if BACKEND_BODY=$(curl -fsS --max-time 10 "http://localhost:${BACKEND_PORT}/actuator/health" 2>&1); then
    log_ok  "backend /actuator/health responded: $BACKEND_BODY"
    BACKEND_OK=1
else
    log_warn "backend /actuator/health probe failed: $BACKEND_BODY"
    # Fallback 1: docker compose ps health field.
    PS_HEALTH=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}n/a{{end}}' gym-backend 2>/dev/null || echo "missing")
    log_info "fallback: docker health status for gym-backend = $PS_HEALTH"
    if [[ "$PS_HEALTH" == "healthy" ]]; then
        BACKEND_OK=1
    else
        # Fallback 2: TCP probe.
        if (exec 3<>"/dev/tcp/localhost/${BACKEND_PORT}") 2>/dev/null; then
            log_warn "fallback TCP probe to localhost:${BACKEND_PORT} succeeded -- treating backend as UP."
            BACKEND_OK=1
            exec 3<&- || true
            exec 3>&- || true
        else
            log_error "backend TCP probe to localhost:${BACKEND_PORT} failed."
        fi
    fi
fi

# --- Frontend ---
log_info "probing frontend -> http://localhost:${FRONTEND_PORT}/"
FRONTEND_CODE=$(curl -fsS --max-time 10 -o /dev/null -w '%{http_code}' "http://localhost:${FRONTEND_PORT}/" 2>/dev/null || echo "000")
if [[ "$FRONTEND_CODE" == "200" ]]; then
    log_ok "frontend responded HTTP 200"
    FRONTEND_OK=1
else
    log_error "frontend returned HTTP $FRONTEND_CODE (expected 200)"
fi

# --- DB ---
log_info "probing postgres via pg_isready inside gym-postgres"
if docker compose exec -T postgres pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
    log_ok "postgres is accepting connections"
    DB_OK=1
else
    log_error "pg_isready failed against gym-postgres"
fi

# ---- Step 7: Summary ----
log_section "Summary"

print_row() {
    printf '  %-10s %-15s %-7s %-10s %s\n' "$@"
}

format_row() {
    local svc=$1 cname=$2 port=$3 ok=$4
    local img status
    img=$(docker inspect --format='{{.Config.Image}}' "$cname" 2>/dev/null | head -c 40 || echo "-")
    if [[ "$ok" -eq 1 ]]; then status="UP"; else status="DOWN"; fi
    print_row "$svc" "$cname" "$port" "$status" "$img"
}

{
    print_row "SERVICE" "CONTAINER" "PORT" "STATUS" "IMAGE"
    print_row "-------" "---------" "----" "------" "-----"
    format_row "postgres"  "gym-postgres" "5432"             "$DB_OK"
    format_row "backend"   "gym-backend"  "$BACKEND_PORT"    "$BACKEND_OK"
    format_row "frontend"  "gym-frontend" "$FRONTEND_PORT"   "$FRONTEND_OK"
} | tee -a "$LOG_FILE"

# Tail logs for any service that's down.
ALL_OK=1
[[ $DB_OK       -eq 1 ]] || { ALL_OK=0; dump_container_tail gym-postgres 50; }
[[ $BACKEND_OK  -eq 1 ]] || { ALL_OK=0; dump_container_tail gym-backend  80; }
[[ $FRONTEND_OK -eq 1 ]] || { ALL_OK=0; dump_container_tail gym-frontend 50; }

if [[ $ALL_OK -eq 1 ]]; then
    log_ok "All services UP."
    log_info "Frontend  -> http://localhost:${FRONTEND_PORT}/"
    log_info "Backend   -> http://localhost:${BACKEND_PORT}/"
    log_info "Database  -> localhost:5432"
    DEPLOY_OK=1
    exit 0
else
    log_error "One or more services failed health checks. See tail logs above and the full log at $LOG_FILE."
    exit 2
fi
