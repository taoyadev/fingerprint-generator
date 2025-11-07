#!/bin/bash

# Statistical Browser Fingerprint Generator Deployment Script
# This script handles deployment to various environments

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
VERSION="latest"
BACKUP=true
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -v|--version)
      VERSION="$2"
      shift 2
      ;;
    --no-backup)
      BACKUP=false
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo "Options:"
      echo "  -e, --environment   Environment (development|staging|production)"
      echo "  -v, --version       Version to deploy"
      echo "      --no-backup     Skip database backup"
      echo "      --dry-run       Show what would be done without executing"
      echo "  -h, --help          Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Function to print colored output
print_status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
  print_status "Checking prerequisites..."

  # Check if Docker is installed
  if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed or not in PATH"
    exit 1
  fi

  # Check if Docker Compose is installed
  if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed or not in PATH"
    exit 1
  fi

  # Check if .env file exists
  if [[ ! -f ".env" ]]; then
    print_warning ".env file not found, creating from example"
    cp .env.example .env
    print_status "Please edit .env file with your configuration"
  fi

  print_success "Prerequisites check passed"
}

# Function to backup data
backup_data() {
  if [[ "$BACKUP" == "true" ]]; then
    print_status "Creating database backup..."

    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Backup PostgreSQL
    if docker-compose ps postgres | grep -q "Up"; then
      print_status "Backing up PostgreSQL..."
      docker-compose exec -T postgres pg_dump -U fingerprint_user fingerprint_db > "$BACKUP_DIR/postgres_backup.sql"
    fi

    # Backup Redis
    if docker-compose ps redis | grep -q "Up"; then
      print_status "Backing up Redis..."
      docker-compose exec -T redis redis-cli --rdb /tmp/dump.rdb
      docker cp "$(docker-compose ps -q redis):/tmp/dump.rdb" "$BACKUP_DIR/redis_backup.rdb"
    fi

    print_success "Backup created in $BACKUP_DIR"
  fi
}

# Function to build Docker images
build_images() {
  print_status "Building Docker images..."

  if [[ "$DRY_RUN" == "true" ]]; then
    print_status "DRY RUN: Would build Docker image with tag $VERSION"
    return
  fi

  docker build -t fingerprint-generator:"$VERSION" .
  docker tag fingerprint-generator:"$VERSION" fingerprint-generator:latest

  print_success "Docker images built successfully"
}

# Function to deploy services
deploy_services() {
  print_status "Deploying services to $ENVIRONMENT environment..."

  if [[ "$DRY_RUN" == "true" ]]; then
    print_status "DRY RUN: Would deploy services with docker-compose"
    return
  fi

  # Stop existing services
  print_status "Stopping existing services..."
  docker-compose down

  # Pull latest images
  print_status "Pulling latest images..."
  docker-compose pull

  # Start services
  print_status "Starting services..."
  docker-compose up -d

  # Wait for services to be healthy
  print_status "Waiting for services to be healthy..."
  sleep 30

  # Check service health
  if docker-compose ps | grep -q "Up (healthy)"; then
    print_success "Services deployed successfully"
  else
    print_error "Some services are not healthy"
    docker-compose ps
    exit 1
  fi
}

# Function to run health checks
run_health_checks() {
  print_status "Running health checks..."

  # Check main service
  if curl -f http://localhost:3000/health &> /dev/null; then
    print_success "Main service is responding"
  else
    print_error "Main service is not responding"
  fi

  # Check database connection
  if docker-compose exec -T postgres pg_isready -U fingerprint_user -d fingerprint_db &> /dev/null; then
    print_success "Database connection is working"
  else
    print_error "Database connection failed"
  fi

  # Check Redis connection
  if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
    print_success "Redis connection is working"
  else
    print_error "Redis connection failed"
  fi
}

# Function to run tests
run_tests() {
  if [[ "$ENVIRONMENT" != "production" ]]; then
    print_status "Running deployment tests..."

    if [[ "$DRY_RUN" == "true" ]]; then
      print_status "DRY RUN: Would run deployment tests"
      return
    fi

    # Run basic functionality tests
    npm test -- --testPathPattern=deployment --passWithNoTests

    print_success "Deployment tests passed"
  else
    print_status "Skipping tests in production environment"
  fi
}

# Function to update configuration
update_configuration() {
  print_status "Updating configuration for $ENVIRONMENT environment..."

  case "$ENVIRONMENT" in
    "development")
      # Development specific configuration
      sed -i 's/NODE_ENV=production/NODE_ENV=development/' .env
      sed -i 's/LOG_LEVEL=info/LOG_LEVEL=debug/' .env
      ;;
    "staging")
      # Staging specific configuration
      sed -i 's/NODE_ENV=development/NODE_ENV=staging/' .env
      sed -i 's/LOG_LEVEL=debug/LOG_LEVEL=warn/' .env
      ;;
    "production")
      # Production specific configuration
      sed -i 's/NODE_ENV=staging/NODE_ENV=production/' .env
      sed -i 's/LOG_LEVEL=warn/LOG_LEVEL=error/' .env
      ;;
  esac

  print_success "Configuration updated for $ENVIRONMENT"
}

# Function to show deployment summary
show_summary() {
  print_status "Deployment Summary:"
  echo "Environment: $ENVIRONMENT"
  echo "Version: $VERSION"
  echo "Backup: $BACKUP"
  echo "Dry Run: $DRY_RUN"
  echo ""

  if [[ "$DRY_RUN" == "false" ]]; then
    print_status "Service Status:"
    docker-compose ps
    echo ""

    print_status "Resource Usage:"
    docker stats --no-stream
  fi
}

# Main deployment flow
main() {
  print_status "Starting Statistical Browser Fingerprint Generator deployment..."
  echo ""

  check_prerequisites
  update_configuration

  if [[ "$DRY_RUN" == "false" ]]; then
    backup_data
  fi

  build_images
  deploy_services
  run_health_checks
  run_tests
  show_summary

  print_success "Deployment completed successfully!"

  if [[ "$DRY_RUN" == "false" ]]; then
    print_status "Service is available at: http://localhost:3000"
    print_status "API documentation at: http://localhost:3000/docs"
    print_status "Health check at: http://localhost:3000/health"
  fi
}

# Trap for cleanup
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main