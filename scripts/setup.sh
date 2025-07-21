#!/bin/bash

# EnglishAI Master - Development Setup Script
set -e

echo "🚀 Setting up EnglishAI Master development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. You'll need to set up PostgreSQL and Redis manually."
        return 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_warning "Docker Compose is not installed. You'll need to set up PostgreSQL and Redis manually."
        return 1
    fi
    
    print_success "Docker and Docker Compose are installed"
    return 0
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_success "Dependencies installed"
}

# Setup environment file
setup_env() {
    if [ ! -f .env ]; then
        print_status "Creating .env file from example..."
        cp .env.example .env
        print_warning "Please edit .env file with your configuration before running the application"
    else
        print_success ".env file already exists"
    fi
}

# Start database services
start_services() {
    if check_docker; then
        print_status "Starting PostgreSQL and Redis with Docker..."
        docker-compose up -d postgres redis
        
        # Wait for services to be ready
        print_status "Waiting for services to be ready..."
        sleep 10
        
        # Check if PostgreSQL is ready
        if docker-compose exec postgres pg_isready -U englishai -d englishai_master >/dev/null 2>&1; then
            print_success "PostgreSQL is ready"
        else
            print_error "PostgreSQL failed to start"
            exit 1
        fi
        
        # Check if Redis is ready
        if docker-compose exec redis redis-cli ping >/dev/null 2>&1; then
            print_success "Redis is ready"
        else
            print_error "Redis failed to start"
            exit 1
        fi
    else
        print_warning "Skipping Docker services setup"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up database..."
    
    # Generate Prisma client
    npm run db:generate
    
    # Push database schema
    if npm run db:push 2>/dev/null; then
        print_success "Database schema updated"
    else
        print_warning "Database schema update failed. Make sure DATABASE_URL is configured correctly in .env"
        return 1
    fi
    
    # Seed database
    if npm run db:seed 2>/dev/null; then
        print_success "Database seeded with sample data"
    else
        print_warning "Database seeding failed"
        return 1
    fi
}

# Build packages
build_packages() {
    print_status "Building shared packages..."
    npm run build --filter=@englishai/types
    npm run build --filter=@englishai/config
    print_success "Shared packages built"
}

# Main setup function
main() {
    print_status "Starting EnglishAI Master setup..."
    
    # Check prerequisites
    check_node
    
    # Install dependencies
    install_dependencies
    
    # Setup environment
    setup_env
    
    # Start services
    start_services
    
    # Build packages
    build_packages
    
    # Setup database
    setup_database
    
    echo ""
    print_success "🎉 Setup completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Edit .env file with your configuration (API keys, etc.)"
    echo "2. Run 'npm run dev' to start the development server"
    echo ""
    print_status "Access points:"
    echo "- Frontend: http://localhost:3000"
    echo "- Backend API: http://localhost:3001"
    echo "- Database Admin: http://localhost:8080"
    echo ""
    print_status "Happy coding! 🚀"
}

# Run main function
main "$@"