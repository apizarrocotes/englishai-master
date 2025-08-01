# Development Workflow

This guide outlines the development practices, workflows, and processes for contributing to the EnglishAI Master project.

## 🚀 Getting Started

### Prerequisites Setup
Before starting development, ensure you have completed the [Installation Guide](./Installation-Guide) and have the following configured:

- **Development Environment**: Node.js 20+, Docker, Git
- **IDE Setup**: VS Code with recommended extensions
- **Environment Variables**: All required `.env` variables configured
- **Database**: PostgreSQL and Redis running (Docker or local)

### Initial Development Setup
```bash
# Clone and setup
git clone https://github.com/yourusername/englishai-master.git
cd englishai-master

# Install dependencies
npm install

# Setup development database
npm run db:push
npm run db:seed

# Start development servers
npm run dev
```

## 🌿 Git Workflow

### Branch Strategy
We follow a **Git Flow** inspired workflow with feature branches and protected main branch.

#### Branch Types
- **`main`**: Production-ready code, protected branch
- **`develop`**: Integration branch for features (if used)
- **`feature/*`**: New features and enhancements
- **`bugfix/*`**: Bug fixes
- **`hotfix/*`**: Critical production fixes
- **`refactor/*`**: Code refactoring without functionality changes

#### Branch Naming Convention
```bash
# Feature branches
feature/user-authentication
feature/voice-conversation-ui
feature/teacher-profile-customization

# Bug fixes
bugfix/speech-recognition-chrome
bugfix/lesson-progress-tracking

# Hotfixes
hotfix/security-patch-jwt
hotfix/api-rate-limiting

# Refactoring
refactor/conversation-service-cleanup
refactor/database-query-optimization
```

### Development Process

#### 1. Start New Feature
```bash
# Create and switch to feature branch
git checkout -b feature/lesson-completion-analytics

# Make your changes
git add .
git commit -m "feat: add lesson completion analytics dashboard

- Add analytics service for lesson completion tracking
- Create dashboard components for progress visualization
- Implement API endpoints for analytics data
- Add unit tests for analytics calculations"

# Push feature branch
git push -u origin feature/lesson-completion-analytics
```

#### 2. Commit Message Standards
We follow **Conventional Commits** specification:

```bash
# Format: <type>[optional scope]: <description>
# [optional body]
# [optional footer(s)]

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # Code style changes (formatting, etc.)
refactor: # Code refactoring
test:     # Adding or updating tests
chore:    # Build process or auxiliary tool changes
perf:     # Performance improvements
ci:       # CI/CD changes

# Examples:
feat(auth): add Google OAuth integration
fix(voice): resolve speech recognition timeout in Chrome
docs(api): update authentication endpoint documentation
refactor(db): optimize conversation query performance
test(conversation): add unit tests for message validation
```

#### 3. Pull Request Process
1. **Create Pull Request** from feature branch to `main`
2. **Fill PR Template** with detailed description
3. **Request Reviews** from team members
4. **Address Feedback** and update branch
5. **Merge** after approval and CI passes

### PR Template
```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made
- List of specific changes
- Components or files modified
- New dependencies added

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if applicable)

## Screenshots/Videos
If applicable, add screenshots or videos of the changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors or warnings
```

## 🏗️ Development Environment

### IDE Configuration

#### VS Code Setup
**Required Extensions:**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.error-lens",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

**Workspace Settings:**
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

#### Debug Configuration
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Next.js App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/web/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/apps/web",
      "console": "integratedTerminal",
      "env": {
        "NODE_OPTIONS": "--inspect=9229"
      }
    },
    {
      "name": "Debug API Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/api/src/index.ts",
      "cwd": "${workspaceFolder}/apps/api",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

### Development Scripts

#### Package.json Scripts
```json
{
  "scripts": {
    // Development
    "dev": "turbo run dev",
    "dev:web": "turbo run dev --filter=web",
    "dev:api": "turbo run dev --filter=api",
    
    // Building
    "build": "turbo run build",
    "build:web": "turbo run build --filter=web",
    "build:api": "turbo run build --filter=api",
    
    // Testing
    "test": "turbo run test",
    "test:watch": "turbo run test:watch",
    "test:e2e": "turbo run test:e2e",
    
    // Quality checks
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "format": "prettier --write .",
    "type-check": "turbo run type-check",
    
    // Database
    "db:generate": "cd apps/api && npx prisma generate",
    "db:push": "cd apps/api && npx prisma db push",
    "db:migrate": "cd apps/api && npx prisma migrate dev",
    "db:seed": "cd apps/api && npx prisma db seed",
    "db:studio": "cd apps/api && npx prisma studio",
    "db:reset": "cd apps/api && npx prisma migrate reset",
    
    // Utilities
    "clean": "turbo run clean",
    "reset": "npm run clean && rm -rf node_modules package-lock.json && npm install",
    "check": "npm run lint && npm run type-check && npm run test"
  }
}
```

#### Turborepo Configuration
```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

## 🧪 Testing Strategy

### Testing Pyramid
```
    /\
   /E2E\     <- Few, slow, high confidence
  /______\
 /        \
/Integration\ <- Some, medium speed
\____________/
\            /
 \Unit Tests/ <- Many, fast, focused
  \________/
```

### Unit Testing

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/e2e/'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

#### Testing Utilities
```typescript
// utils/test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

export * from '@testing-library/react';
export { renderWithProviders as render };
```

#### Example Unit Tests
```typescript
// components/__tests__/LoginForm.test.tsx
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../../utils/test-utils';
import { LoginForm } from '../auth/LoginForm';

describe('LoginForm', () => {
  it('validates required fields', async () => {
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);
    
    expect(await screen.findByText(/invalid email format/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const onSuccess = jest.fn();
    render(<LoginForm onSuccess={onSuccess} />);
    
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'SecurePass123!' }
    });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

### Integration Testing

#### API Testing
```typescript
// __tests__/api/auth.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/utils/database';

describe('/api/auth', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('POST /register', () => {
    it('creates new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('rejects duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };

      // Create first user
      await request(app).post('/api/auth/register').send(userData);

      // Attempt to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });
  });
});
```

### E2E Testing with Playwright

#### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### E2E Test Examples
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('user can register and login', async ({ page }) => {
    // Navigate to registration
    await page.goto('/auth');
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.fill('[data-testid="name-input"]', 'Test User');
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome, Test User');
  });

  test('user can complete a conversation lesson', async ({ page, context }) => {
    // Login first
    await page.goto('/auth');
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123!');
    await page.click('[data-testid="login-button"]');
    
    // Navigate to lesson
    await page.goto('/learning/business-path/lesson/interview-prep');
    
    // Start conversation
    await page.click('[data-testid="start-conversation"]');
    
    // Send message
    await page.fill('[data-testid="message-input"]', 'Hello, I want to practice for my interview');
    await page.click('[data-testid="send-message"]');
    
    // Wait for AI response
    await expect(page.locator('[data-testid="ai-message"]')).toBeVisible({ timeout: 10000 });
    
    // End conversation
    await page.click('[data-testid="end-conversation"]');
    
    // Verify completion
    await expect(page.locator('[data-testid="lesson-completed"]')).toBeVisible();
  });
});
```

## 🔍 Code Quality

### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};
```

### Prettier Configuration
```javascript
// .prettierrc.js
module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'avoid',
  endOfLine: 'lf',
};
```

### Pre-commit Hooks
```bash
# Install Husky
npm install --save-dev husky

# Setup pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"

# Setup commit message hook
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

### Commitlint Configuration
```javascript
// .commitlintrc.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', 'fix', 'docs', 'style', 'refactor',
        'test', 'chore', 'perf', 'ci', 'build'
      ]
    ],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
  },
};
```

## 📦 Dependency Management

### Adding Dependencies
```bash
# Add production dependency to specific workspace
npm install --workspace=apps/web react-query

# Add development dependency
npm install --save-dev --workspace=apps/api @types/jest

# Add shared dependency to root
npm install typescript --workspace=root
```

### Dependency Guidelines
- **Minimize bundle size**: Prefer lightweight alternatives
- **Check security**: Use `npm audit` regularly
- **Keep updated**: Regular dependency updates
- **Document decisions**: Explain choice of libraries

### Security Scanning
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Check for outdated packages
npm outdated
```

## 🚀 Deployment Workflow

### Environment Branches
- **`main`** → Production deployment
- **`staging`** → Staging environment (if used)
- **`develop`** → Development environment (if used)

### CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build
      
      - name: Run E2E tests
        run: npx playwright test
```

### Deployment Checklist
- [ ] All tests passing
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Performance testing completed
- [ ] Security scan passed

## 📋 Code Review Guidelines

### Reviewer Checklist
- [ ] **Functionality**: Code works as intended
- [ ] **Performance**: No obvious performance issues
- [ ] **Security**: No security vulnerabilities
- [ ] **Testing**: Adequate test coverage
- [ ] **Documentation**: Code is well-documented
- [ ] **Style**: Follows coding standards
- [ ] **Architecture**: Fits project architecture

### Review Process
1. **Self-review** before requesting review
2. **Detailed description** in PR
3. **Small, focused PRs** (< 400 lines when possible)
4. **Responsive to feedback**
5. **Approve and merge** after all concerns addressed

This development workflow ensures consistent, high-quality code contributions while maintaining project velocity and team collaboration.