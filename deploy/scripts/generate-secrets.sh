#!/usr/bin/env bash

################################################################################
# Secret Generation Script for AIFAM Kubernetes Deployment
#
# Purpose: Generate random secrets and create Kubernetes Secret objects
# idempotently (refuses to overwrite existing secrets).
#
# Usage:
#   ./generate-secrets.sh [options]
#
# Options:
#   -n, --namespace NAMESPACE    Kubernetes namespace (default: thunderbolt)
#   -f, --force                  Overwrite existing secrets (use with caution)
#   -d, --dry-run                Print secrets without creating them
#   -v, --verbose                Enable verbose output
#   -h, --help                   Show this help message
#
# Environment:
#   KUBECONFIG                   Path to kubeconfig (uses current context if unset)
#
# Requirements:
#   - kubectl configured and authenticated
#   - openssl for random secret generation
#   - Kubernetes cluster with write permissions in the target namespace
#
# Example:
#   # Generate secrets in 'thunderbolt' namespace (idempotent)
#   ./generate-secrets.sh -n thunderbolt
#
#   # Preview without creating
#   ./generate-secrets.sh -n thunderbolt --dry-run
#
#   # Force regenerate (⚠️  this will break running pods)
#   ./generate-secrets.sh -n thunderbolt --force
#
################################################################################

set -euo pipefail

# Configuration
NAMESPACE="thunderbolt"
FORCE=false
DRY_RUN=false
VERBOSE=false
SECRET_NAME="thunderbolt-secrets"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_verbose() {
  if [[ "$VERBOSE" == "true" ]]; then
    echo -e "${GREEN}[DEBUG]${NC} $1"
  fi
}

show_help() {
  head -n 36 "$0" | tail -n +2 | sed 's/^# //'
}

# Generate a random base64 string (for regular secrets)
generate_secret() {
  local length="${1:-32}"
  openssl rand -base64 "$length" | tr -d '\n'
}

# Generate base64url-encoded secret (for JWT — RFC 7518)
# This is required for PowerSync JWT secrets (JWK format requires base64url)
generate_jwt_secret() {
  local length="${1:-32}"
  # Generate random bytes, encode to base64, then convert to base64url
  # (base64url: replace + with -, / with _, remove padding =)
  openssl rand "$length" | base64 | tr '+/' '-_' | tr -d '='
}

# Check if secret already exists
secret_exists() {
  kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" &>/dev/null
}

# Check if a specific key exists in the secret
secret_key_exists() {
  local key="$1"
  kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" -o jsonpath="{.data.$key}" &>/dev/null
}

# Create or update the Kubernetes secret
create_secret() {
  local -n secret_data=$1

  if [[ "$DRY_RUN" == "true" ]]; then
    log_info "DRY RUN: Would create/update Secret '$SECRET_NAME' in namespace '$NAMESPACE'"
    log_info "Secret keys: ${!secret_data[@]}"
    for key in "${!secret_data[@]}"; do
      echo "  $key: $(echo -n "${secret_data[$key]}" | wc -c) bytes"
    done
    return 0
  fi

  # Build kubectl command with --from-literal for each secret
  local kubectl_args=("create" "secret" "generic" "$SECRET_NAME" "-n" "$NAMESPACE")

  # Check if secret exists
  if secret_exists; then
    if [[ "$FORCE" == "false" ]]; then
      log_warn "Secret '$SECRET_NAME' already exists in namespace '$NAMESPACE'"
      log_info "Use --force to regenerate (⚠️  this will break running pods)"
      return 0
    else
      log_warn "Force flag set; deleting existing secret '$SECRET_NAME'"
      kubectl delete secret "$SECRET_NAME" -n "$NAMESPACE" --wait=false || true
    fi
  fi

  # Add all secret data
  for key in "${!secret_data[@]}"; do
    kubectl_args+=("--from-literal=${key}=${secret_data[$key]}")
  done

  # Dry run validation first
  kubectl "${kubectl_args[@]}" --dry-run=client -o yaml > /dev/null
  log_verbose "Secret YAML validation passed"

  # Create the secret
  kubectl "${kubectl_args[@]}" --overwrite 2>/dev/null || \
    kubectl "${kubectl_args[@]}"

  log_info "✓ Secret '$SECRET_NAME' created in namespace '$NAMESPACE'"
}

# Validate secret was created successfully
validate_secret() {
  if ! secret_exists; then
    log_error "Secret '$SECRET_NAME' not found after creation!"
    return 1
  fi

  local keys_expected=(
    "better-auth-secret"
    "keycloak-admin-password"
    "oidc-client-secret"
    "postgres-password"
    "powersync-jwt-secret"
    "powersync-jwt-secret-b64"
    "powersync-db-password"
  )

  local missing_keys=()
  for key in "${keys_expected[@]}"; do
    if ! secret_key_exists "$key"; then
      missing_keys+=("$key")
    fi
  done

  if [[ ${#missing_keys[@]} -gt 0 ]]; then
    log_warn "Missing secret keys: ${missing_keys[*]}"
    return 1
  fi

  log_info "✓ All required secret keys present"
  return 0
}

# Main logic
main() {
  log_info "AIFAM Secret Generation Script"
  log_info "Namespace: $NAMESPACE"
  log_verbose "Force: $FORCE, Dry-run: $DRY_RUN"

  # Verify kubectl connectivity
  if ! kubectl cluster-info &>/dev/null; then
    log_error "Failed to connect to Kubernetes cluster. Is kubectl configured?"
    return 1
  fi

  log_verbose "Kubernetes cluster connected"

  # Verify namespace exists
  if ! kubectl get namespace "$NAMESPACE" &>/dev/null; then
    log_info "Creating namespace '$NAMESPACE'..."
    if [[ "$DRY_RUN" != "true" ]]; then
      kubectl create namespace "$NAMESPACE"
    fi
  fi

  log_verbose "Namespace '$NAMESPACE' ready"

  # Generate secrets
  declare -A secrets

  log_info "Generating secrets..."

  # Better Auth: 32+ bytes, base64 (used in BETTER_AUTH_SECRET env var)
  if [[ "$FORCE" == "true" ]] || ! secret_key_exists "better-auth-secret"; then
    log_verbose "Generating better-auth-secret..."
    secrets["better-auth-secret"]=$(generate_secret 32)
  else
    log_verbose "better-auth-secret exists, skipping"
  fi

  # Keycloak Admin Password: 16+ bytes, base64
  if [[ "$FORCE" == "true" ]] || ! secret_key_exists "keycloak-admin-password"; then
    log_verbose "Generating keycloak-admin-password..."
    secrets["keycloak-admin-password"]=$(generate_secret 16)
  else
    log_verbose "keycloak-admin-password exists, skipping"
  fi

  # OIDC Client Secret: 24+ bytes, base64 (shared between Backend and Keycloak)
  if [[ "$FORCE" == "true" ]] || ! secret_key_exists "oidc-client-secret"; then
    log_verbose "Generating oidc-client-secret..."
    secrets["oidc-client-secret"]=$(generate_secret 24)
  else
    log_verbose "oidc-client-secret exists, skipping"
  fi

  # PostgreSQL Password: 24+ bytes, base64
  if [[ "$FORCE" == "true" ]] || ! secret_key_exists "postgres-password"; then
    log_verbose "Generating postgres-password..."
    secrets["postgres-password"]=$(generate_secret 24)
  else
    log_verbose "postgres-password exists, skipping"
  fi

  # PowerSync JWT Secret: 32 bytes, base64 (decoded and used in JWK)
  # Must be base64url (RFC 7518) with decoded length >= 32 chars
  if [[ "$FORCE" == "true" ]] || ! secret_key_exists "powersync-jwt-secret"; then
    log_verbose "Generating powersync-jwt-secret..."
    secrets["powersync-jwt-secret"]=$(generate_jwt_secret 32)
  else
    log_verbose "powersync-jwt-secret exists, skipping"
  fi

  # PowerSync JWT Secret B64: Same as above but as base64 string
  # (PowerSync consumes this as POWERSYNC_JWT_SECRET_B64 and places it in JWK `k` field)
  if [[ "$FORCE" == "true" ]] || ! secret_key_exists "powersync-jwt-secret-b64"; then
    log_verbose "Generating powersync-jwt-secret-b64..."
    if [[ -v secrets["powersync-jwt-secret"] ]]; then
      secrets["powersync-jwt-secret-b64"]="${secrets["powersync-jwt-secret"]}"
    else
      secrets["powersync-jwt-secret-b64"]=$(generate_jwt_secret 32)
    fi
  else
    log_verbose "powersync-jwt-secret-b64 exists, skipping"
  fi

  # PowerSync Database Password: 24+ bytes, base64
  if [[ "$FORCE" == "true" ]] || ! secret_key_exists "powersync-db-password"; then
    log_verbose "Generating powersync-db-password..."
    secrets["powersync-db-password"]=$(generate_secret 24)
  else
    log_verbose "powersync-db-password exists, skipping"
  fi

  # Create the secret
  if [[ ${#secrets[@]} -gt 0 ]]; then
    create_secret secrets
  else
    log_info "All secrets already exist (use --force to regenerate)"
  fi

  # Validate
  if [[ "$DRY_RUN" != "true" ]]; then
    log_info "Validating secret..."
    validate_secret
    log_info "✓ Secret generation complete"
  fi
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -n|--namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    -f|--force)
      FORCE=true
      shift
      ;;
    -d|--dry-run)
      DRY_RUN=true
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      log_error "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Run main
main "$@"
