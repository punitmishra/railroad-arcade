# Contributing to Railroad Arcade

Thank you for your interest in contributing to Railroad Arcade! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Testing](#testing)
- [Documentation](#documentation)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. Please:

- Be respectful and considerate in your communication
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

Unacceptable behavior includes harassment, trolling, or any form of discrimination.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (Neon recommended for development)
- Git

### Setup

1. **Fork the repository**

   Click the "Fork" button on GitHub to create your own copy.

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/railroad-arcade.git
   cd railroad-arcade
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/punitmishra/railroad-arcade.git
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

6. **Initialize database**
   ```bash
   npx prisma db push
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

---

## Development Workflow

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features (e.g., `feature/multiplayer-mode`)
- `fix/` - Bug fixes (e.g., `fix/token-calculation`)
- `docs/` - Documentation updates (e.g., `docs/api-reference`)
- `refactor/` - Code refactoring (e.g., `refactor/hardware-adapter`)
- `test/` - Adding or updating tests (e.g., `test/tournament-api`)

### Keeping Your Fork Updated

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

## Pull Request Process

### Before Submitting

1. **Sync with main**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run quality checks**
   ```bash
   npm run lint        # ESLint
   npm run build       # Verify build
   npm run test        # Run tests
   ```

3. **Update documentation** if your changes affect:
   - API endpoints
   - Environment variables
   - Configuration options
   - User-facing features

### Creating the PR

1. Push your branch to your fork
2. Open a Pull Request against `main`
3. Fill out the PR template with:
   - Clear description of changes
   - Screenshots (for UI changes)
   - Testing steps
   - Related issues

### Review Process

- PRs require at least one approval before merging
- Address review feedback promptly
- Keep PRs focused and reasonably sized
- Large changes should be discussed in an issue first

---

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper typing
- Export types for public interfaces

```typescript
// Good
interface TournamentEntry {
  id: string;
  userId: string;
  score: number;
}

// Avoid
const entry: any = {};
```

### React

- Use functional components with hooks
- Follow the existing component structure
- Keep components focused and composable

```typescript
// Component structure
export function MyComponent({ prop }: MyComponentProps) {
  // 1. Hooks
  const [state, setState] = useState();

  // 2. Derived values
  const computed = useMemo(() => ..., []);

  // 3. Effects
  useEffect(() => { ... }, []);

  // 4. Handlers
  const handleClick = () => { ... };

  // 5. Render
  return <div>...</div>;
}
```

### Styling

- Use Tailwind CSS for styling
- Follow the existing design system colors
- Ensure responsive design (mobile-first)
- Maintain accessibility (focus states, ARIA labels)

```tsx
// Use design system colors
<button className="bg-cyan-500 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500">
```

### API Routes

- Use consistent response format
- Include proper error handling
- Validate input data
- Add rate limiting where appropriate

```typescript
// Standard response format
return NextResponse.json({
  success: true,
  data: { ... }
});

// Error response
return NextResponse.json(
  { success: false, error: 'Error message' },
  { status: 400 }
);
```

---

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting (no code change)
- `refactor` - Code restructuring
- `test` - Adding tests
- `chore` - Maintenance tasks

### Examples

```
feat(tournaments): add real-time leaderboard updates

fix(auth): prevent session timeout during game

docs(api): add tournament endpoint documentation

refactor(hardware): simplify adapter interface
```

---

## Testing

### Running Tests

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:integration  # Integration tests
```

### Writing Tests

- Write tests for new features and bug fixes
- Use descriptive test names
- Follow the existing test patterns

```typescript
describe('TournamentAPI', () => {
  describe('POST /api/tournaments/[id]/register', () => {
    it('should register user for tournament', async () => {
      // Arrange
      const user = await createTestUser();

      // Act
      const response = await registerForTournament(user.id, tournamentId);

      // Assert
      expect(response.success).toBe(true);
    });

    it('should reject if tournament is full', async () => {
      // ...
    });
  });
});
```

---

## Documentation

### Code Comments

- Add comments for complex logic
- Use JSDoc for public functions
- Keep comments up to date with code

```typescript
/**
 * Calculate user's tournament rank with tiebreakers
 * @param tournamentId - The tournament to calculate rank for
 * @param userId - The user's ID
 * @returns The user's rank (1-indexed)
 */
async function calculateRank(tournamentId: string, userId: string): Promise<number> {
  // Implementation
}
```

### README Updates

Update relevant documentation when adding:
- New environment variables
- New API endpoints
- New dependencies
- Changed configuration

---

## Questions?

- Open a [Discussion](https://github.com/punitmishra/railroad-arcade/discussions) for questions
- Check existing [Issues](https://github.com/punitmishra/railroad-arcade/issues) before creating new ones
- Join our community chat (coming soon)

---

Thank you for contributing to Railroad Arcade!
