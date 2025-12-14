#!/bin/bash
# =============================================================================
# Auth Flow E2E Test Script
# =============================================================================
# This script tests the complete authentication flow against a running server.
#
# Usage:
#   ./scripts/test-auth.sh              # Start server, run tests, stop server
#   ./scripts/test-auth.sh --no-server  # Run tests against already running server
#
# Requirements:
#   - Valid .env file with DATABASE_URL and NEXTAUTH_SECRET
#   - curl and jq installed
#
# =============================================================================

# Don't use set -e as arithmetic operations can return non-zero

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${TEST_BASE_URL:-http://localhost:3000}"
COOKIE_JAR="/tmp/auth-test-cookies.txt"
MANAGE_SERVER=true
SERVER_PID=""

# Parse arguments
for arg in "$@"; do
  case $arg in
    --no-server)
      MANAGE_SERVER=false
      shift
      ;;
  esac
done

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[PASS]${NC} $1"
  ((TESTS_PASSED++))
  ((TESTS_TOTAL++))
}

log_fail() {
  echo -e "${RED}[FAIL]${NC} $1"
  ((TESTS_FAILED++))
  ((TESTS_TOTAL++))
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

cleanup() {
  if [ "$MANAGE_SERVER" = true ] && [ -n "$SERVER_PID" ]; then
    log_info "Stopping server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
  fi
  rm -f "$COOKIE_JAR"
}

trap cleanup EXIT

wait_for_server() {
  local max_attempts=30
  local attempt=0

  log_info "Waiting for server at $BASE_URL..."

  while [ $attempt -lt $max_attempts ]; do
    if curl -s "$BASE_URL" > /dev/null 2>&1; then
      log_info "Server is ready!"
      return 0
    fi
    sleep 1
    ((attempt++))
  done

  log_fail "Server failed to start after $max_attempts seconds"
  exit 1
}

# =============================================================================
# Test Functions
# =============================================================================

test_database_connection() {
  log_info "Testing database connection..."

  local response=$(curl -s "$BASE_URL/api/db-test")
  local success=$(echo "$response" | jq -r '.success')
  local message=$(echo "$response" | jq -r '.message')
  local user_count=$(echo "$response" | jq -r '.data.userCount')

  if [ "$success" = "true" ]; then
    log_success "Database connection: $message (Users: $user_count)"
  else
    log_fail "Database connection failed: $(echo "$response" | jq -r '.error')"
  fi
}

test_csrf_token() {
  log_info "Testing CSRF token endpoint..."

  local response=$(curl -s -c "$COOKIE_JAR" "$BASE_URL/api/auth/csrf")
  local csrf_token=$(echo "$response" | jq -r '.csrfToken')

  if [ -n "$csrf_token" ] && [ "$csrf_token" != "null" ]; then
    log_success "CSRF token received (length: ${#csrf_token})"
    echo "$csrf_token"
  else
    log_fail "CSRF token not received"
    echo ""
  fi
}

test_auth_providers() {
  log_info "Testing auth providers endpoint..."

  local response=$(curl -s "$BASE_URL/api/auth/providers")
  local has_credentials=$(echo "$response" | jq -r '.credentials.id')

  if [ "$has_credentials" = "credentials" ]; then
    log_success "Auth providers: credentials provider available"
  else
    log_fail "Credentials provider not found"
  fi
}

test_signup() {
  local email="$1"
  local password="$2"
  local name="$3"

  log_info "Testing signup with $email..."

  local response=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"name\":\"$name\"}")

  local success=$(echo "$response" | jq -r '.success')
  local message=$(echo "$response" | jq -r '.message')
  local error=$(echo "$response" | jq -r '.error')

  if [ "$success" = "true" ]; then
    log_success "Signup successful: $message"
    return 0
  else
    log_fail "Signup failed: $error"
    return 1
  fi
}

test_signup_duplicate() {
  local email="$1"
  local password="$2"

  log_info "Testing duplicate email rejection..."

  local response=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$email\",\"password\":\"$password\",\"name\":\"Duplicate\"}")

  local error=$(echo "$response" | jq -r '.error')

  if [[ "$error" == *"already exists"* ]]; then
    log_success "Duplicate email rejected correctly"
  else
    log_fail "Duplicate email not rejected properly: $error"
  fi
}

test_signup_short_password() {
  log_info "Testing short password rejection..."

  local response=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d '{"email":"short@example.com","password":"123","name":"Short"}')

  local error=$(echo "$response" | jq -r '.error')

  if [[ "$error" == *"8 characters"* ]]; then
    log_success "Short password rejected correctly"
  else
    log_fail "Short password not rejected properly: $error"
  fi
}

test_login() {
  local email="$1"
  local password="$2"

  log_info "Testing login with $email..."

  # Get fresh CSRF token
  rm -f "$COOKIE_JAR"
  local csrf_response=$(curl -s -c "$COOKIE_JAR" "$BASE_URL/api/auth/csrf")
  local csrf_token=$(echo "$csrf_response" | jq -r '.csrfToken')

  if [ -z "$csrf_token" ] || [ "$csrf_token" = "null" ]; then
    log_fail "Could not get CSRF token for login"
    return 1
  fi

  # Attempt login
  local http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL/api/auth/callback/credentials" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -b "$COOKIE_JAR" \
    -c "$COOKIE_JAR" \
    -d "csrfToken=$csrf_token&email=$email&password=$password" \
    -L)

  if [ "$http_code" = "200" ] || [ "$http_code" = "302" ]; then
    log_success "Login successful (HTTP $http_code)"
    return 0
  else
    log_fail "Login failed (HTTP $http_code)"
    return 1
  fi
}

test_session() {
  log_info "Testing session endpoint..."

  local response=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/auth/session")
  local user_email=$(echo "$response" | jq -r '.user.email // empty')

  if [ -n "$user_email" ]; then
    log_success "Session active for: $user_email"
  else
    log_fail "No active session found"
  fi
}

test_protected_route() {
  log_info "Testing protected route without auth..."

  local response=$(curl -s "$BASE_URL/api/user")
  local error=$(echo "$response" | jq -r '.error')

  if [ "$error" = "Unauthorized" ]; then
    log_success "Protected route returns 401 correctly"
  else
    log_fail "Protected route did not return Unauthorized"
  fi
}

test_page_routes() {
  log_info "Testing page routes..."

  # Login page
  local login_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/login")
  if [ "$login_status" = "200" ]; then
    log_success "Login page renders (HTTP 200)"
  else
    log_fail "Login page failed (HTTP $login_status)"
  fi

  # Signup page
  local signup_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/signup")
  if [ "$signup_status" = "200" ]; then
    log_success "Signup page renders (HTTP 200)"
  else
    log_fail "Signup page failed (HTTP $signup_status)"
  fi

  # Main page
  local main_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
  if [ "$main_status" = "200" ]; then
    log_success "Main page renders (HTTP 200)"
  else
    log_fail "Main page failed (HTTP $main_status)"
  fi
}

# =============================================================================
# Main Test Runner
# =============================================================================

main() {
  echo ""
  echo "============================================="
  echo "  Railroad Arcade - Auth Flow Tests"
  echo "============================================="
  echo ""

  # Start server if needed
  if [ "$MANAGE_SERVER" = true ]; then
    log_info "Cleaning up any existing processes on port 3000..."
    # Kill any process using port 3000
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2

    log_info "Starting development server..."
    cd "$(dirname "$0")/.."
    npm run dev &
    SERVER_PID=$!
    wait_for_server
  fi

  # Generate unique test email
  TEST_EMAIL="test-$(date +%s)@example.com"
  TEST_PASSWORD="testpassword123"
  TEST_NAME="Auth Test User"

  echo ""
  echo "--- Database Tests ---"
  test_database_connection

  echo ""
  echo "--- Auth Endpoint Tests ---"
  test_csrf_token > /dev/null
  test_auth_providers

  echo ""
  echo "--- Signup Tests ---"
  test_signup "$TEST_EMAIL" "$TEST_PASSWORD" "$TEST_NAME"
  test_signup_duplicate "$TEST_EMAIL" "$TEST_PASSWORD"
  test_signup_short_password

  echo ""
  echo "--- Login Tests ---"
  test_login "$TEST_EMAIL" "$TEST_PASSWORD"
  test_session

  echo ""
  echo "--- Protected Route Tests ---"
  test_protected_route

  echo ""
  echo "--- Page Route Tests ---"
  test_page_routes

  # Summary
  echo ""
  echo "============================================="
  echo "  Test Summary"
  echo "============================================="
  echo -e "  ${GREEN}Passed:${NC} $TESTS_PASSED"
  echo -e "  ${RED}Failed:${NC} $TESTS_FAILED"
  echo -e "  Total:  $TESTS_TOTAL"
  echo "============================================="
  echo ""

  if [ $TESTS_FAILED -gt 0 ]; then
    exit 1
  fi
}

main "$@"
