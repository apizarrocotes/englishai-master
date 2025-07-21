# 🚀 EnglishAI Master

> **AI-Powered English Learning Platform** - Master English through intelligent conversations with adaptive AI tutors that provide real-time feedback and personalized learning paths.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)](https://openai.com)

---

## ✨ Features

### 🎯 **Core Learning Features**
- **🤖 AI Conversation Practice** - Interactive dialogues with GPT-4 powered tutors
- **🗣️ Real-world Scenarios** - Job interviews, business meetings, travel, and social conversations
- **📊 Real-time Feedback** - Instant grammar, vocabulary, and pronunciation corrections
- **🎮 Gamified Learning** - Progress tracking, streaks, achievements, and skill assessments
- **📈 Adaptive Curriculum** - Personalized learning paths based on your level and goals

### 🛠️ **Technical Features**
- **🌐 Multi-user Support** - Individual, team, and enterprise accounts
- **🔐 OAuth Authentication** - Sign in with Google, Microsoft, Apple
- **💬 Real-time Chat** - Socket.IO powered conversation engine
- **📱 Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **🌍 Multi-language Support** - Built-in internationalization ready

### 🎨 **User Experience**
- **Modern UI/UX** - Clean, intuitive interface with Tailwind CSS
- **Dark/Light Mode** - User preference themes
- **Voice Integration** - Speech-to-text and text-to-speech capabilities
- **Progress Analytics** - Detailed learning insights and reports

---

## 🏗️ Architecture

### **Frontend Stack**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: Zustand + TanStack Query
- **Authentication**: NextAuth.js v4
- **Real-time**: Socket.IO client
- **Animations**: Framer Motion

### **Backend Stack**
- **Runtime**: Node.js 20 + Express
- **Language**: TypeScript
- **Database**: PostgreSQL 15 + Prisma ORM
- **Cache**: Redis 7
- **AI**: OpenAI GPT-4 + Whisper + TTS
- **Real-time**: Socket.IO server
- **File Storage**: AWS S3 (configurable)

### **Infrastructure**
- **Monorepo**: Turborepo for efficient builds
- **Containerization**: Docker + Docker Compose
- **Database Migrations**: Prisma migrations
- **Deployment**: Ready for AWS, Vercel, Railway
- **CI/CD**: GitHub Actions ready

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL (or use Docker)
- OpenAI API key (for AI features)

### 1. Clone and Install
```bash
git clone https://github.com/your-username/englishai-master.git
cd englishai-master
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

**Required environment variables:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/englishai_master"
NEXTAUTH_SECRET="your-secret-key"
OPENAI_API_KEY="your-openai-api-key"
GOOGLE_CLIENT_ID="your-google-oauth-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
```

### 3. Start Database Services
```bash
docker compose up -d postgres redis
```

### 4. Database Setup
```bash
npm run db:push    # Create database schema
npm run db:seed    # Add sample data
```

### 5. Start Development
```bash
npm run dev
```

**🎉 Your app is now running:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Database Admin**: http://localhost:8080

---

## 📚 API Documentation

### Authentication Endpoints
```bash
POST /api/auth/callback/google     # Google OAuth
POST /api/auth/callback/microsoft  # Microsoft OAuth  
POST /api/auth/refresh            # Refresh JWT token
GET  /api/auth/me                 # Get current user
```

### Learning Endpoints
```bash
GET  /api/learning/paths          # Get learning paths
GET  /api/learning/lessons/:id    # Get lessons for path
POST /api/learning/progress       # Update user progress
```

### Conversation Endpoints
```bash
POST /api/conversations/start     # Start new conversation
POST /api/conversations/:id/message  # Send message
GET  /api/conversations/:id       # Get conversation history
```

### Analytics Endpoints
```bash
GET /api/analytics/dashboard      # User dashboard data
GET /api/analytics/progress       # Learning progress stats
```

---

## 🗄️ Database Schema

### Core Tables
- **`users`** - User accounts and profiles
- **`learning_profiles`** - Learning preferences and goals
- **`learning_paths`** - Structured curriculum paths
- **`lessons`** - Individual learning units
- **`conversation_scenarios`** - AI chat scenarios
- **`conversation_sessions`** - User chat sessions
- **`conversation_messages`** - Chat message history
- **`user_progress`** - Learning progress tracking
- **`learning_analytics`** - Performance metrics

### Relationships
```
Users → Learning Profiles (1:1)
Users → Conversation Sessions (1:many)
Users → Progress Records (1:many)
Learning Paths → Lessons (1:many)
Lessons → Scenarios (1:many)
Sessions → Messages (1:many)
```

---

## 🧪 Development

### Available Scripts
```bash
# Development
npm run dev          # Start all apps in development
npm run build        # Build all apps for production
npm run lint         # Lint all code
npm run test         # Run all tests

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create and run migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio

# Utilities
npm run format       # Format code with Prettier
npm run clean        # Clean all build artifacts
npm run type-check   # Run TypeScript checks
```

### Project Structure
```
englishai-master/
├── apps/
│   ├── web/                 # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/         # App Router pages
│   │   │   ├── components/  # React components
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   ├── lib/         # Utilities and helpers
│   │   │   └── stores/      # State management
│   │   └── package.json
│   └── api/                 # Express backend
│       ├── src/
│       │   ├── controllers/ # Route handlers
│       │   ├── services/    # Business logic
│       │   ├── middleware/  # Express middleware
│       │   ├── routes/      # API route definitions
│       │   └── utils/       # Utility functions
│       ├── prisma/          # Database schema
│       └── package.json
├── packages/
│   ├── types/              # Shared TypeScript types
│   ├── ui/                 # Shared UI components (future)
│   └── config/             # Shared configuration
├── docker-compose.yml      # Local development services
├── turbo.json             # Turborepo configuration
└── package.json           # Workspace root
```

---

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Docker Deployment
```bash
docker build -t englishai-web ./apps/web
docker build -t englishai-api ./apps/api
docker compose -f docker-compose.prod.yml up -d
```

### Platform Deployments

#### **Vercel (Frontend)**
```bash
# Deploy to Vercel
vercel --prod

# Environment variables needed:
# NEXTAUTH_URL, NEXTAUTH_SECRET, API_URL
```

#### **Railway (Backend + Database)**
```bash
# Connect to Railway
railway login
railway init
railway up

# Add environment variables via Railway dashboard
```

#### **AWS (Full Stack)**
- **Frontend**: CloudFront + S3 or Amplify
- **Backend**: ECS or Elastic Beanstalk
- **Database**: RDS PostgreSQL
- **Cache**: ElastiCache Redis
- **Storage**: S3 for file uploads

### Environment Variables for Production
```bash
# Security
NODE_ENV=production
NEXTAUTH_SECRET="super-secure-secret-key"
JWT_SECRET="jwt-secret-key"

# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# OpenAI
OPENAI_API_KEY="your-production-api-key"

# OAuth (Production credentials)
GOOGLE_CLIENT_ID="prod-google-client-id"
GOOGLE_CLIENT_SECRET="prod-google-secret"

# AWS (if using file storage)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"
```

---

## 🧪 Testing

### Unit Tests
```bash
npm run test              # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
```

### E2E Tests
```bash
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Run E2E tests with UI
```

### API Testing
```bash
# Using curl
curl http://localhost:3001/health

# Using httpie
http GET localhost:3001/api/learning/paths Authorization:"Bearer YOUR_JWT"
```

---

## 📈 Performance

### Current Benchmarks
- **Frontend Load Time**: < 2s on 3G
- **API Response Time**: < 200ms average
- **Database Query Time**: < 50ms average
- **Bundle Size**: < 500KB initial load

### Optimization Features
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **Caching**: Redis for API responses
- **Database**: Optimized queries with indexes
- **CDN**: Static asset delivery optimization

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Automatic code formatting
- **Husky**: Pre-commit hooks
- **Conventional Commits**: Commit message standards

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎯 Roadmap

### v1.0 (Current)
- [x] Core conversation engine
- [x] User authentication
- [x] Basic learning paths
- [x] Progress tracking

### v1.1 (Next Release)
- [ ] Voice recording and playback
- [ ] Advanced AI tutoring scenarios
- [ ] Group learning features
- [ ] Mobile app (React Native)

### v1.2 (Future)
- [ ] Offline mode capabilities
- [ ] Advanced analytics dashboard
- [ ] LMS integrations
- [ ] Multi-language interface
- [ ] Enterprise SSO support

---

## 📞 Support & Community

- **📧 Email**: support@englishai-master.com
- **💬 Discord**: [Join our community](https://discord.gg/englishai)
- **📚 Documentation**: [Full Documentation](https://docs.englishai-master.com)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/your-username/englishai-master/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/your-username/englishai-master/discussions)

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 API
- **Vercel** for Next.js framework
- **Prisma** for database toolkit
- **Tailwind CSS** for styling system
- **All contributors** who have helped shape this project

---

## 📊 Stats

![GitHub Stars](https://img.shields.io/github/stars/your-username/englishai-master?style=social)
![GitHub Forks](https://img.shields.io/github/forks/your-username/englishai-master?style=social)
![GitHub Issues](https://img.shields.io/github/issues/your-username/englishai-master)
![GitHub Pull Requests](https://img.shields.io/github/issues-pr/your-username/englishai-master)

---

<div align="center">

**Built with ❤️ by developers who believe in the power of AI-enhanced education**

[⭐ Star this project](https://github.com/your-username/englishai-master) • [🐛 Report Bug](https://github.com/your-username/englishai-master/issues) • [💡 Request Feature](https://github.com/your-username/englishai-master/issues)

</div>
