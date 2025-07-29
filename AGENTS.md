# AGENTS.md

## Build/Lint/Test Commands

### Root commands (using Turborepo):

- `npm run build` - Build all apps and packages
- `npm run dev` - Start all apps in development mode
- `npm run lint` - Lint all code
- `npm run test` - Run all tests
- `npm run format` - Format code with Prettier

### API (Express backend):

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Start development server with hot reload
- `npm run lint` - Lint TypeScript files
- `npm run test` - Run Jest tests
- Single test: `npx jest path/to/test.file.ts`

### Web (Next.js frontend):

- `npm run build` - Build Next.js application
- `npm run dev` - Start development server
- `npm run lint` - Run Next.js ESLint
- `npm run type-check` - Run TypeScript checks
- Single test: Not configured yet

## Code Style Guidelines

### Imports

- Use absolute imports with `@/` alias (e.g., `@/components/Button`)
- Group imports: Node.js built-ins, external packages, internal modules
- Use named imports when possible
- Place import statements at the top of the file

### Formatting

- TypeScript strict mode enabled
- Prettier for automatic code formatting
- Line width: 80-100 characters
- Use 2 space indentation
- No trailing commas in function parameters
- Semicolons required

### Types

- Use TypeScript for all code
- Define interfaces for complex objects
- Use type aliases for primitives and unions
- Enable strict typing (noImplicitAny, strictNullChecks)

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for classes, components, and interfaces
- Use UPPER_SNAKE_CASE for constants
- Use descriptive variable names
- File names: camelCase for utility files, PascalCase for components

### Error Handling

- Use try/catch for async operations
- Create custom error classes that extend Error
- Log errors with context information
- Return meaningful error messages to clients
- Use centralized error handling middleware in API

### Additional Rules

- Follow Airbnb ESLint configuration
- Use conventional commit messages
- Write tests for new features
- Document complex logic with inline comments
- Use Husky pre-commit hooks for code quality checks
