#!/bin/bash
# =============================================================================
# Payment & Module Integration E2E Test Script
# =============================================================================
# This script tests the payment system and module unlock flow.
#
# Usage:
#   ./scripts/test-payments.sh              # Start server, run tests, stop server
#   ./scripts/test-payments.sh --no-server  # Run tests against already running server
#
# Requirements:
#   - Valid .env file with DATABASE_URL and NEXTAUTH_SECRET
#   - curl and jq installed
#
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${TEST_BASE_URL:-http://localhost:3000}"
COOKIE_JAR="/tmp/payment-test-cookies.txt"
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

# Test user credentials
TEST_EMAIL=""
TEST_PASSWORD="testpassword123"
TEST_NAME="Payment Test User"

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

log_section() {
  echo ""
  echo -e "${CYAN}--- $1 ---${NC}"
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

test_page_routes() {
  log_section "Page Route Tests"

  # Home page
  local home_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
  if [ "$home_status" = "200" ]; then
    log_success "Home page renders (HTTP 200)"
  else
    log_fail "Home page failed (HTTP $home_status)"
  fi

  # Payment success page
  local success_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/payment/success")
  if [ "$success_status" = "200" ]; then
    log_success "Payment success page renders (HTTP 200)"
  else
    log_fail "Payment success page failed (HTTP $success_status)"
  fi

  # Payment cancel page
  local cancel_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/payment/cancel")
  if [ "$cancel_status" = "200" ]; then
    log_success "Payment cancel page renders (HTTP 200)"
  else
    log_fail "Payment cancel page failed (HTTP $cancel_status)"
  fi

  # Payment success with tokens param
  local success_tokens_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/payment/success?tokens=150")
  if [ "$success_tokens_status" = "200" ]; then
    log_success "Payment success with tokens param (HTTP 200)"
  else
    log_fail "Payment success with tokens param failed (HTTP $success_tokens_status)"
  fi
}

test_unauthenticated_apis() {
  log_section "Unauthenticated API Tests"

  # User API should return 401
  local user_response=$(curl -s "$BASE_URL/api/user")
  local user_error=$(echo "$user_response" | jq -r '.error')
  if [ "$user_error" = "Unauthorized" ]; then
    log_success "User API returns 401 for unauthenticated requests"
  else
    log_fail "User API did not return Unauthorized: $user_error"
  fi

  # Modules API should return defaults
  local modules_response=$(curl -s "$BASE_URL/api/user/modules")
  local is_auth=$(echo "$modules_response" | jq -r '.isAuthenticated')
  local modules=$(echo "$modules_response" | jq -r '.unlockedModules | join(",")')
  if [ "$is_auth" = "false" ] && [ "$modules" = "trains,scenery" ]; then
    log_success "Modules API returns defaults for unauthenticated users"
  else
    log_fail "Modules API did not return expected defaults"
  fi

  # Transactions API should return 401
  local tx_response=$(curl -s "$BASE_URL/api/user/transactions")
  local tx_error=$(echo "$tx_response" | jq -r '.error')
  if [ "$tx_error" = "Unauthorized" ]; then
    log_success "Transactions API returns 401 for unauthenticated requests"
  else
    log_fail "Transactions API did not return Unauthorized"
  fi

  # Payment APIs should return 401
  local stripe_response=$(curl -s -X POST "$BASE_URL/api/payments/stripe" -H "Content-Type: application/json" -d '{"packageId":"starter"}')
  local stripe_error=$(echo "$stripe_response" | jq -r '.error')
  if [ "$stripe_error" = "Unauthorized" ]; then
    log_success "Stripe API returns 401 for unauthenticated requests"
  else
    log_fail "Stripe API did not return Unauthorized"
  fi

  local paypal_response=$(curl -s -X POST "$BASE_URL/api/payments/paypal" -H "Content-Type: application/json" -d '{"packageId":"starter"}')
  local paypal_error=$(echo "$paypal_response" | jq -r '.error')
  if [ "$paypal_error" = "Unauthorized" ]; then
    log_success "PayPal API returns 401 for unauthenticated requests"
  else
    log_fail "PayPal API did not return Unauthorized"
  fi

  local coinbase_response=$(curl -s -X POST "$BASE_URL/api/payments/coinbase" -H "Content-Type: application/json" -d '{"packageId":"starter"}')
  local coinbase_error=$(echo "$coinbase_response" | jq -r '.error')
  if [ "$coinbase_error" = "Unauthorized" ]; then
    log_success "Coinbase API returns 401 for unauthenticated requests"
  else
    log_fail "Coinbase API did not return Unauthorized"
  fi

  local sessions_response=$(curl -s -X POST "$BASE_URL/api/sessions" -H "Content-Type: application/json" -d '{"duration":120,"tokenCost":10}')
  local sessions_error=$(echo "$sessions_response" | jq -r '.error')
  if [ "$sessions_error" = "Unauthorized" ]; then
    log_success "Sessions API returns 401 for unauthenticated requests"
  else
    log_fail "Sessions API did not return Unauthorized"
  fi
}

create_test_user() {
  log_section "User Setup"

  TEST_EMAIL="payment-test-$(date +%s)@example.com"

  log_info "Creating test user: $TEST_EMAIL"

  local response=$(curl -s -X POST "$BASE_URL/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}")

  local success=$(echo "$response" | jq -r '.success')
  local message=$(echo "$response" | jq -r '.message')

  if [ "$success" = "true" ]; then
    log_success "Created test user with 100 welcome tokens"
  else
    log_fail "Failed to create test user: $(echo "$response" | jq -r '.error')"
    exit 1
  fi
}

login_test_user() {
  log_info "Logging in as test user..."

  rm -f "$COOKIE_JAR"

  # Get CSRF token
  local csrf_response=$(curl -s -c "$COOKIE_JAR" "$BASE_URL/api/auth/csrf")
  local csrf_token=$(echo "$csrf_response" | jq -r '.csrfToken')

  if [ -z "$csrf_token" ] || [ "$csrf_token" = "null" ]; then
    log_fail "Could not get CSRF token"
    exit 1
  fi

  # Login
  local http_code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$BASE_URL/api/auth/callback/credentials" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -b "$COOKIE_JAR" \
    -c "$COOKIE_JAR" \
    -d "csrfToken=$csrf_token&email=$TEST_EMAIL&password=$TEST_PASSWORD" \
    -L)

  if [ "$http_code" = "200" ] || [ "$http_code" = "302" ]; then
    log_success "Logged in successfully"
  else
    log_fail "Login failed (HTTP $http_code)"
    exit 1
  fi
}

test_user_profile() {
  log_section "User Profile Tests"

  local response=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/user")
  local token_balance=$(echo "$response" | jq -r '.tokenBalance')
  local email=$(echo "$response" | jq -r '.email')
  local modules=$(echo "$response" | jq -r '.unlockedModules | join(",")')

  if [ "$email" = "$TEST_EMAIL" ]; then
    log_success "User profile returns correct email"
  else
    log_fail "User profile email mismatch: $email"
  fi

  if [ "$token_balance" = "100" ]; then
    log_success "User has 100 welcome tokens"
  else
    log_fail "User token balance incorrect: $token_balance"
  fi

  if [[ "$modules" == *"trains"* ]] && [[ "$modules" == *"scenery"* ]]; then
    log_success "User has default modules unlocked"
  else
    log_fail "User missing default modules: $modules"
  fi
}

test_module_unlock() {
  log_section "Module Unlock Tests"

  # Unlock cafe module (15 tokens)
  local response=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/user/modules" \
    -H "Content-Type: application/json" \
    -d '{"moduleId":"cafe","cost":15}')

  local success=$(echo "$response" | jq -r '.success')
  local module_id=$(echo "$response" | jq -r '.moduleId')
  local token_balance=$(echo "$response" | jq -r '.tokenBalance')
  local modules=$(echo "$response" | jq -r '.unlockedModules | join(",")')

  if [ "$success" = "true" ] && [ "$module_id" = "cafe" ]; then
    log_success "Cafe module unlocked successfully"
  else
    log_fail "Failed to unlock cafe module: $(echo "$response" | jq -r '.error')"
  fi

  if [ "$token_balance" = "85" ]; then
    log_success "Token balance updated: 100 - 15 = 85"
  else
    log_fail "Token balance incorrect after unlock: $token_balance (expected 85)"
  fi

  if [[ "$modules" == *"cafe"* ]]; then
    log_success "Cafe added to unlocked modules"
  else
    log_fail "Cafe not in unlocked modules: $modules"
  fi

  # Test duplicate unlock rejection
  local dup_response=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/user/modules" \
    -H "Content-Type: application/json" \
    -d '{"moduleId":"cafe","cost":15}')
  local dup_error=$(echo "$dup_response" | jq -r '.error')

  if [[ "$dup_error" == *"already unlocked"* ]]; then
    log_success "Duplicate unlock correctly rejected"
  else
    log_fail "Duplicate unlock not rejected: $dup_error"
  fi

  # Test invalid module
  local invalid_response=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/user/modules" \
    -H "Content-Type: application/json" \
    -d '{"moduleId":"invalid-module","cost":10}')
  local invalid_error=$(echo "$invalid_response" | jq -r '.error')

  if [[ "$invalid_error" == *"Unknown module"* ]]; then
    log_success "Invalid module correctly rejected"
  else
    log_fail "Invalid module not rejected: $invalid_error"
  fi

  # Test incorrect cost
  local cost_response=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/user/modules" \
    -H "Content-Type: application/json" \
    -d '{"moduleId":"police","cost":10}')
  local cost_error=$(echo "$cost_response" | jq -r '.error')

  if [[ "$cost_error" == *"Invalid cost"* ]]; then
    log_success "Incorrect cost correctly rejected"
  else
    log_fail "Incorrect cost not rejected: $cost_error"
  fi
}

test_session_start() {
  log_section "Session Start Tests"

  # Start a session (10 tokens, 120 seconds)
  local response=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/sessions" \
    -H "Content-Type: application/json" \
    -d '{"duration":120,"tokenCost":10}')

  local session_id=$(echo "$response" | jq -r '.sessionId')
  local expires_at=$(echo "$response" | jq -r '.expiresAt')
  local token_balance=$(echo "$response" | jq -r '.tokenBalance')

  if [ -n "$session_id" ] && [ "$session_id" != "null" ]; then
    log_success "Session started successfully (ID: ${session_id:0:8}...)"
  else
    log_fail "Failed to start session: $(echo "$response" | jq -r '.error')"
  fi

  if [ -n "$expires_at" ] && [ "$expires_at" != "null" ]; then
    log_success "Session has expiration time"
  else
    log_fail "Session missing expiration time"
  fi

  if [ "$token_balance" = "75" ]; then
    log_success "Token balance updated: 85 - 10 = 75"
  else
    log_fail "Token balance incorrect after session: $token_balance (expected 75)"
  fi

  # Test duplicate session rejection
  local dup_response=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/sessions" \
    -H "Content-Type: application/json" \
    -d '{"duration":120,"tokenCost":10}')
  local dup_error=$(echo "$dup_response" | jq -r '.error')

  if [[ "$dup_error" == *"already have an active session"* ]]; then
    log_success "Duplicate session correctly rejected"
  else
    log_fail "Duplicate session not rejected: $dup_error"
  fi
}

test_transaction_history() {
  log_section "Transaction History Tests"

  local response=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/user/transactions")
  local tx_count=$(echo "$response" | jq -r '.transactions | length')
  local total=$(echo "$response" | jq -r '.total')

  if [ "$tx_count" -ge 2 ]; then
    log_success "Transaction history has $tx_count transactions"
  else
    log_fail "Transaction history missing expected transactions: $tx_count"
  fi

  # Check for module unlock transaction
  local module_tx=$(echo "$response" | jq -r '.transactions[] | select(.metadata.reason == "module_unlock") | .amount')
  if [ "$module_tx" = "-15" ]; then
    log_success "Module unlock transaction recorded (-15 tokens)"
  else
    log_fail "Module unlock transaction not found or incorrect: $module_tx"
  fi

  # Check for session start transaction
  local session_tx=$(echo "$response" | jq -r '.transactions[] | select(.metadata.reason == "session_start") | .amount')
  if [ "$session_tx" = "-10" ]; then
    log_success "Session start transaction recorded (-10 tokens)"
  else
    log_fail "Session start transaction not found or incorrect: $session_tx"
  fi
}

test_modules_api_authenticated() {
  log_section "Authenticated Modules API Tests"

  local response=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/user/modules")
  local is_auth=$(echo "$response" | jq -r '.isAuthenticated')
  local modules=$(echo "$response" | jq -r '.unlockedModules | join(",")')

  if [ "$is_auth" = "true" ]; then
    log_success "Modules API recognizes authenticated user"
  else
    log_fail "Modules API did not recognize authentication"
  fi

  if [[ "$modules" == *"trains"* ]] && [[ "$modules" == *"scenery"* ]] && [[ "$modules" == *"cafe"* ]]; then
    log_success "Modules API returns all unlocked modules"
  else
    log_fail "Modules API missing some modules: $modules"
  fi
}

# =============================================================================
# Main Test Runner
# =============================================================================

main() {
  echo ""
  echo "============================================="
  echo "  Railroad Arcade - Payment & Module Tests"
  echo "============================================="
  echo ""

  # Start server if needed
  if [ "$MANAGE_SERVER" = true ]; then
    log_info "Cleaning up any existing processes on port 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2

    log_info "Starting development server..."
    cd "$(dirname "$0")/.."
    npm run dev &
    SERVER_PID=$!
    wait_for_server
  fi

  # Run tests
  test_page_routes
  test_unauthenticated_apis
  create_test_user
  login_test_user
  test_user_profile
  test_module_unlock
  test_session_start
  test_transaction_history
  test_modules_api_authenticated

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
