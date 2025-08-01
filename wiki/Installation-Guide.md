# Installation Guide

This guide provides step-by-step instructions for setting up the EnglishAI Master development environment on your local machine.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js** 18+ and npm (recommended: Node.js 20 LTS)
- **Docker** and Docker Compose
- **Git** for version control
- **PostgreSQL** (or use Docker container)
- **Redis** (or use Docker container)

### Optional Tools
- **VS Code** with recommended extensions
- **Postman** or similar API testing tool
- **pgAdmin** or similar database management tool

### API Keys & Services
- **OpenAI API Key** (required for AI features)
- **Google OAuth credentials** (optional, for social login)
- **Microsoft OAuth credentials** (optional, for social login)

## 🚀 Quick Installation

For the fastest setup, follow these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/englishai-master.git
cd englishai-master
```

### 2. Install Dependencies
```bash
# Install all dependencies for the monorepo
npm install
```

### 3. Environment Setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file with your configuration
nano .env  # or use your preferred editor
```

### 4. Start Database Services
```bash
# Start PostgreSQL and Redis using Docker
docker compose up -d postgres redis
```

### 5. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed database with sample data
npm run db:seed
```

### 6. Start Development Servers
```bash
# Start both frontend and backend in development mode
npm run dev
```

🎉 **Your application is now running:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database**: PostgreSQL on localhost:5432
- **Cache**: Redis on localhost:6379

## 📝 Detailed Installation Steps

### Step 1: System Prerequisites

#### Install Node.js
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Or download from nodejs.org
# https://nodejs.org/en/download/
```

#### Install Docker
```bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# On macOS (using Homebrew)
brew install docker docker-compose

# On Windows, download Docker Desktop
# https://www.docker.com/products/docker-desktop
```

#### Verify Installations
```bash
node --version    # Should be 18+ 
npm --version     # Should be 8+
docker --version  # Should be 20+
docker compose version
```

### Step 2: Project Setup

#### Clone and Navigate
```bash
git clone https://github.com/yourusername/englishai-master.git
cd englishai-master

# Check the project structure
ls -la
```

#### Install All Dependencies
```bash
# This installs dependencies for all apps and packages
npm install

# Verify installation
npm run --workspaces run build:check
```

### Step 3: Environment Configuration

#### Create Environment File
```bash
cp .env.example .env
```

#### Edit Environment Variables
```bash
# Open with your preferred editor
nano .env
# or
code .env
# or
vim .env
```

#### Required Environment Variables
```bash
# Database Configuration
DATABASE_URL="postgresql://englishai_user:englishai_password@localhost:5432/englishai_master"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-nextauth-secret-key"
JWT_SECRET="your-jwt-secret-key"

# OpenAI Configuration (required for AI features)
OPENAI_API_KEY="your-openai-api-key"
OPENAI_CHAT_MODEL="gpt-4.1-2025-04-14"
OPENAI_SIMPLE_MODEL="gpt-4.1-mini-2025-04-14"
OPENAI_TTS_MODEL="tts-1-hd"
OPENAI_TTS_VOICE="nova"

# API Configuration
API_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# Optional: OAuth Configuration
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-oauth-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-oauth-client-secret"

# Optional: Development Configuration
NODE_ENV="development"
LOG_LEVEL="debug"
```

### Step 4: Database Setup

#### Start Database Services
```bash
# Start PostgreSQL and Redis containers
docker compose up -d postgres redis

# Verify containers are running
docker compose ps
```

#### Alternative: Local Database Installation
If you prefer to install databases locally instead of using Docker:

```bash
# On Ubuntu/Debian
sudo apt-get install postgresql redis-server

# On macOS
brew install postgresql redis

# Start services
sudo systemctl start postgresql redis
# or on macOS
brew services start postgresql redis
```

#### Generate Prisma Client
```bash
npm run db:generate
```

#### Create Database Schema
```bash
# Push schema to database (development)
npm run db:push

# Or create and run migrations (production-like)
npm run db:migrate
```

#### Seed Sample Data
```bash
npm run db:seed
```

#### Verify Database Setup
```bash
# Open Prisma Studio to view your data
npm run db:studio
# Opens http://localhost:5555
```

### Step 5: Application Startup

#### Start Development Mode
```bash
# Start all services (recommended)
npm run dev

# Or start services individually
npm run dev:web    # Frontend only (port 3000)
npm run dev:api    # Backend only (port 3001)
```

#### Verify Application is Running
1. **Frontend**: Open http://localhost:3000
2. **Backend API**: Check http://localhost:3001/health
3. **Database**: Access Prisma Studio at http://localhost:5555

## 🔧 Development Tools Setup

### VS Code Extensions (Recommended)
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json"
  ]
}
```

### Git Hooks Setup
```bash
# Install Husky for pre-commit hooks
npx husky install

# Set up pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"
```

## 🐳 Docker Development Setup (Alternative)

If you prefer to run everything in Docker:

### Full Docker Compose Setup
```bash
# Build and start all services
docker compose up --build

# Run in background
docker compose up -d --build
```

### Docker Compose Configuration
The `docker-compose.yml` includes:
- **PostgreSQL**: Database service
- **Redis**: Cache service
- **Web App**: Next.js frontend (port 3000)
- **API**: Express.js backend (port 3001)
- **pgAdmin**: Database administration (port 8080)

### Docker Commands
```bash
# View logs
docker compose logs -f

# Stop all services
docker compose down

# Rebuild specific service
docker compose up --build web

# Execute commands in container
docker compose exec api npm run db:seed
```

## 🧪 Testing Installation

### Run Health Checks
```bash
# Check API health
curl http://localhost:3001/health

# Check database connection
npm run db:check

# Run basic tests
npm run test
```

### Test API Endpoints
```bash
# Get learning paths (no auth required)
curl http://localhost:3001/api/learning/paths

# Test authentication endpoint
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword"}'
```

### Test Frontend
1. Navigate to http://localhost:3000
2. Try creating an account
3. Test the voice demo feature
4. Browse learning paths

## 🔧 Available Scripts

### Development Scripts
```bash
npm run dev          # Start all apps in development mode
npm run dev:web      # Start frontend only
npm run dev:api      # Start backend only
npm run build        # Build all apps for production
npm run start        # Start all apps in production mode
```

### Database Scripts
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
npm run db:migrate   # Create and run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database (destructive)
```

### Quality Scripts
```bash
npm run lint         # Lint all code
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
npm run type-check   # Run TypeScript type checking
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
```

### Utility Scripts
```bash
npm run clean        # Clean all build artifacts
npm run reset        # Clean and reinstall dependencies
npm run check        # Run all quality checks
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000 or 3001
lsof -i :3000
lsof -i :3001

# Kill process
kill -9 <PID>

# Or use different ports
PORT=3002 npm run dev:web
API_PORT=3003 npm run dev:api
```

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres

# Reset database connection
docker compose restart postgres
npm run db:push
```

#### Node Modules Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Reset entire monorepo
npm run reset
```

#### Prisma Issues
```bash
# Regenerate Prisma client
npm run db:generate

# Reset database
npm run db:reset

# Check database connection
npm run db:studio
```

#### OpenAI API Issues
```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Use mock mode for development
OPENAI_API_KEY="test-key" npm run dev
```

### Environment Debugging
```bash
# Check environment variables
npm run env:check

# View current configuration
npm run config:show

# Test API connectivity
npm run health:check
```

### Getting Help
If you encounter issues:

1. Check the [Troubleshooting Guide](./Troubleshooting-Guide)
2. Review the logs: `docker compose logs` or `npm run logs`
3. Search existing [GitHub Issues](https://github.com/yourusername/englishai-master/issues)
4. Create a new issue with detailed error information

## ✅ Next Steps

After successful installation:

1. **Read the [Development Workflow](./Development-Workflow)** guide
2. **Explore the [API Documentation](./API-Documentation)**
3. **Check out the [Frontend Components](./Frontend-Components)** guide
4. **Set up your [Testing Environment](./Testing-Guide)**
5. **Configure your [IDE and Tools](./Development-Workflow#ide-setup)**

## 🎯 Production Deployment

For production deployment, see the [Deployment Guide](./Deployment-Guide) which covers:
- Production environment configuration
- Docker deployment
- Cloud platform deployment (AWS, Vercel, Railway)
- SSL/HTTPS setup
- Performance optimization
- Monitoring and logging

Congratulations! 🎉 You now have a fully functional EnglishAI Master development environment.