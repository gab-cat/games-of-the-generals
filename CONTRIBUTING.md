# 🤝 Contributing to Games of the Generals

Welcome to the Games of the Generals community! We're thrilled that you're interested in contributing to this classic Filipino strategy game. This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Submitting Changes](#submitting-changes)
- [Community Support](#community-support)

## 📜 Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold these standards and contribute to a positive, inclusive community.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **npm** (or **bun**)
- **Git** for version control
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Basic knowledge of **React**, **TypeScript**, and **game development**

### Quick Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/yourusername/games-of-generals.git
   cd games-of-generals
   ```
3. **Install dependencies**:
   ```bash
   bun install  # or npm install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```
5. **Start development server**:
   ```bash
   bun run dev  # or npm run dev
   ```

## 🔧 Development Setup

### Environment Configuration

Create a `.env.local` file with the following variables:

```bash
# Convex Configuration
VITE_CONVEX_URL=your_convex_deployment_url

# Optional: Analytics and Monitoring
VITE_VERCEL_ANALYTICS_ID=your_analytics_id
VITE_VERCEL_SPEED_INSIGHTS_ID=your_insights_id
```

### Development Scripts

```bash
# Start development servers
bun run dev              # Frontend + Backend
bun run dev:frontend     # Frontend only
bun run dev:backend      # Backend only

# Build and quality checks
bun run build           # Production build
bun run build:analyze   # Build with bundle analysis
bun run lint            # Code quality checks

# Asset generation
bun run icons           # Generate PWA icons
bun run sitemap         # Generate sitemap
```

## 🤔 How to Contribute

### Types of Contributions

We welcome various types of contributions:

#### 🐛 Bug Fixes

- Identify and fix bugs in the game logic, UI, or performance
- Add regression tests for fixed bugs
- Update documentation for bug fixes

#### ✨ New Features

- Implement new game features or enhancements
- Add new UI components or pages
- Extend the game's functionality

#### 🎨 Design & UX

- Improve user interface and user experience
- Create new themes or visual enhancements
- Enhance mobile responsiveness

#### 📚 Documentation

- Improve code documentation and comments
- Update README and guides
- Create tutorials or examples

#### 🧪 Testing

- Write unit tests and integration tests
- Improve test coverage
- Add end-to-end tests for new features

#### 🌐 Localization

- Add support for new languages
- Improve existing translations
- Add internationalization features

### Finding Issues to Work On

1. **Check GitHub Issues**: Look for [good first issues](https://github.com/yourusername/games-of-generals/labels/good%20first%20issue) or [help wanted](https://github.com/yourusername/games-of-generals/labels/help%20wanted) labels
2. **Bug Reports**: Look for confirmed bugs that need fixing
3. **Feature Requests**: Check for approved feature requests
4. **Documentation**: Help improve docs or create new ones

## 🔄 Development Workflow

### 1. Choose an Issue

- Select an issue from GitHub or create your own
- Comment on the issue to indicate you're working on it
- Wait for maintainer approval if creating a new issue

### 2. Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 3. Make Changes

- Write clear, focused commits
- Test your changes thoroughly
- Follow our code standards (see below)

### 4. Test Your Changes

```bash
# Run all quality checks
bun run lint

# Test the build process
bun run build

# Manual testing in browser
bun run dev
```

### 5. Submit a Pull Request

- Push your branch to your fork
- Create a Pull Request on GitHub
- Fill out the PR template completely
- Request review from maintainers

## 📏 Code Standards

### TypeScript/React Guidelines

#### File Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components (auto-generated)
│   └── game/           # Game-specific components
├── pages/              # Route-based page components
├── lib/                # Utilities and helpers
├── hooks/              # Custom React hooks
└── types/              # TypeScript type definitions
```

#### Naming Conventions

- **Components**: PascalCase (e.g., `GameBoard.tsx`)
- **Files**: kebab-case (e.g., `game-board.tsx`)
- **Functions**: camelCase (e.g., `calculateMove`)
- **Types**: PascalCase (e.g., `GameState`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `BOARD_SIZE`)

#### Component Structure

```tsx
// Good: Clear component structure
interface GameBoardProps {
  gameId: Id<"games">;
  onMove: (move: Move) => void;
}

export function GameBoard({ gameId, onMove }: GameBoardProps) {
  // Early returns for loading/error states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  // Main component logic
  return <div className="game-board">{/* Component JSX */}</div>;
}
```

### Convex Backend Guidelines

#### Function Organization

- **Queries**: Read-only operations (`query`)
- **Mutations**: Write operations (`mutation`)
- **Actions**: External API calls (`action`)
- **Internal**: Private functions (`internalQuery`, etc.)

#### Schema Design

```typescript
// Good: Clear, typed schema
export const games = defineTable({
  player1Id: v.id("users"),
  player2Id: v.id("users"),
  status: v.union(
    v.literal("waiting"),
    v.literal("playing"),
    v.literal("finished")
  ),
  board: v.array(
    v.array(
      v.union(
        v.null(),
        v.object({
          piece: v.string(),
          player: v.union(v.literal("player1"), v.literal("player2")),
        })
      )
    )
  ),
})
  .index("by_status", ["status"])
  .index("by_players", ["player1Id", "player2Id"]);
```

### Commit Guidelines

#### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

#### Types

- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

#### Examples

```
feat(game): add real-time move validation
fix(ui): resolve mobile layout overflow issue
docs(readme): update installation instructions
refactor(board): simplify piece movement logic
test(components): add unit tests for GameBoard
```

## 🧪 Testing Guidelines

### Testing Strategy

#### Unit Tests

- Test individual functions and components
- Use React Testing Library for component tests
- Mock external dependencies (Convex, APIs)

#### Integration Tests

- Test component interactions
- Test Convex function calls
- Test complete user flows

#### End-to-End Tests

- Test complete game flows
- Use Playwright for browser automation
- Test real-time multiplayer scenarios

### Running Tests

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run E2E tests
bun run test:e2e

# Run tests with coverage
bun run test:coverage
```

### Writing Tests

```tsx
// Component test example
import { render, screen, fireEvent } from "@testing-library/react";
import { GameBoard } from "./GameBoard";

test("renders game board correctly", () => {
  render(<GameBoard gameId="test-id" />);
  expect(screen.getByRole("grid")).toBeInTheDocument();
});

test("handles piece movement", () => {
  render(<GameBoard gameId="test-id" />);
  const piece = screen.getByLabelText("pawn");
  fireEvent.click(piece);
  // Assert expected behavior
});
```

## 📤 Submitting Changes

### Pull Request Process

1. **Create a PR**: Use our PR template
2. **Title**: Clear, descriptive title following commit conventions
3. **Description**: Detailed explanation of changes
4. **Screenshots**: Include before/after screenshots for UI changes
5. **Testing**: Describe how you tested your changes
6. **Breaking Changes**: Note any breaking changes

### PR Template Checklist

- [ ] Code follows project standards
- [ ] Tests pass and are included
- [ ] Documentation is updated
- [ ] No linting errors
- [ ] Build passes successfully
- [ ] Screenshots included for UI changes
- [ ] Tested on multiple browsers/devices

### Code Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Peer Review**: At least one maintainer reviews the code
3. **Discussion**: Address any feedback or concerns
4. **Approval**: Maintainers approve and merge the PR

### After Your PR is Merged

1. **Celebrate!** 🎉 Your contribution is now part of the game
2. **Clean up**: Delete your feature branch
3. **Stay Involved**: Look for new issues to work on
4. **Share**: Tell others about your contribution

## 🆘 Community Support

### Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Discord**: Real-time chat with the community
- **Documentation**: Check our wiki and guides first

### Communication Guidelines

- **Be Respectful**: Follow our Code of Conduct
- **Be Clear**: Provide context and examples
- **Be Patient**: Maintainers are volunteers
- **Be Helpful**: Help others when you can

### Recognition

Contributors are recognized in several ways:

- **Contributors List**: Added to README acknowledgments
- **GitHub Recognition**: GitHub shows contribution stats
- **Community Recognition**: Featured in community updates
- **Special Roles**: Active contributors may be invited to help maintain

## 🎯 Development Philosophy

### Our Values

- **Accessibility**: Games should be playable by everyone
- **Performance**: Smooth gameplay on all devices
- **Quality**: Thorough testing and code review
- **Community**: Inclusive and welcoming environment
- **Innovation**: Pushing the boundaries of web gaming

### Game Design Principles

- **Fair Play**: Balanced gameplay mechanics
- **Intuitive UX**: Easy to learn, hard to master
- **Cultural Respect**: Honoring Filipino gaming heritage
- **Modern Tech**: Leveraging latest web technologies

---

Thank you for contributing to Games of the Generals! Your efforts help preserve and evolve this beloved Filipino strategy game for players worldwide. 🏁

**Ready to contribute?** Check out our [GitHub Issues](https://github.com/yourusername/games-of-generals/issues) to get started!
