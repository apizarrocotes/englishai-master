# EnglishAI Master - GitHub Wiki

Welcome to the comprehensive documentation for **EnglishAI Master**, an AI-powered English learning platform that provides intelligent conversation practice with adaptive tutors, real-time voice synthesis, and personalized learning paths.

## 📚 Documentation Sections

### 🏗️ **Architecture & Technical Documentation**
- **[Project Architecture](./Project-Architecture)** - Complete system overview and technology stack
- **[API Documentation](./API-Documentation)** - Comprehensive REST API and WebSocket documentation
- **[Frontend Components](./Frontend-Components)** - React component architecture and usage
- **[Database Schema](./Database-Schema)** - Complete database structure and relationships

### 🚀 **Setup & Development**
- **[Installation Guide](./Installation-Guide)** - Step-by-step setup instructions
- **[Development Workflow](./Development-Workflow)** - Development best practices and workflows
- **[Environment Configuration](./Environment-Configuration)** - Environment variables and configuration
- **[Deployment Guide](./Deployment-Guide)** - Production deployment instructions

### 🔐 **Security & Authentication**
- **[Authentication System](./Authentication-System)** - JWT, OAuth, and security features
- **[Security Best Practices](./Security-Best-Practices)** - Security guidelines and implementation

### 🎯 **Features & Usage**
- **[Voice Conversation System](./Voice-Conversation-System)** - Real-time voice features and implementation
- **[AI Teacher Profiles](./AI-Teacher-Profiles)** - Customizable AI personalities and configuration
- **[Learning Path System](./Learning-Path-System)** - Structured curriculum and progress tracking

### 🧪 **Testing & Quality**
- **[Testing Guide](./Testing-Guide)** - Unit, integration, and E2E testing
- **[Performance Optimization](./Performance-Optimization)** - Performance benchmarks and optimization

### 🤝 **Contributing**
- **[Contributing Guide](./Contributing-Guide)** - How to contribute to the project
- **[Code Standards](./Code-Standards)** - Coding conventions and style guide

## 🌟 Key Features

### Core Learning Features
- 🤖 **AI Conversation Practice** - Interactive dialogues with GPT-4 powered tutors
- 🗣️ **Voice Synthesis & Recognition** - Real-time speech-to-text and text-to-speech
- 📊 **Real-time Feedback** - Instant grammar, vocabulary, and pronunciation corrections
- 🎮 **Gamified Learning** - Progress tracking, achievements, and skill assessments
- 📈 **Adaptive Curriculum** - Personalized learning paths based on user level and goals

### Technical Features
- 🌐 **Modern Full-Stack Architecture** - Next.js 14 + Express.js + PostgreSQL
- 🔐 **Secure Authentication** - JWT + OAuth (Google, Microsoft, Apple)
- 💬 **Real-time Communication** - WebSocket and Socket.IO integration
- 📱 **Responsive Design** - Mobile-first approach with desktop optimization
- 🎨 **Modern UI/UX** - Tailwind CSS with Framer Motion animations

## 🏗️ Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Headless UI
- **State Management**: Zustand + TanStack Query
- **Authentication**: NextAuth.js v4
- **Real-time**: Socket.IO client + WebSockets
- **Animations**: Framer Motion

### Backend
- **Runtime**: Node.js 20 + Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15 + Prisma ORM
- **Cache**: Redis 7
- **AI Services**: OpenAI GPT-4, Whisper, TTS
- **Real-time**: Socket.IO server + WebSocket
- **Security**: JWT, bcrypt, Helmet, CORS

### Infrastructure
- **Monorepo**: Turborepo for efficient builds
- **Containerization**: Docker + Docker Compose
- **Database Migrations**: Prisma migrations
- **Deployment**: AWS, Vercel, Railway ready
- **CI/CD**: GitHub Actions ready

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/englishai-master.git
cd englishai-master

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start database services
docker compose up -d postgres redis

# Setup database
npm run db:push
npm run db:seed

# Start development
npm run dev
```

Your application will be running at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 📞 Support & Community

- **📧 Email**: support@englishai-master.com
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/yourusername/englishai-master/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/yourusername/englishai-master/discussions)
- **📚 Full Documentation**: Continue reading the wiki sections above

---

**Built with ❤️ by developers who believe in the power of AI-enhanced education**