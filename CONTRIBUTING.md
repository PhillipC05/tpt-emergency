# Contributing to TPT Emergency

Thank you for your interest in contributing to the TPT Emergency System. This document outlines the process and guidelines for contributing.

---

## Code of Conduct

All contributors are expected to adhere to standard open source conduct principles. Be respectful, inclusive, and constructive in all interactions.

---

## Development Workflow

### 1. Fork & Branch
```bash
# Fork the repository
git checkout -b feature/your-feature-name
```

### Branch Naming Convention
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `perf/*` - Performance improvements

### 2. Make Changes
- Follow existing code style patterns
- Write clean, maintainable code
- Add appropriate comments for complex logic
- Test your changes thoroughly

### 3. Commit Messages

Use conventional commit format:
```
type(scope): subject

body
```

Types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructuring
- `perf:` Performance
- `test:` Testing

### 4. Run Checks
```bash
# Install dependencies
npm install

# Run build
npm run build

# Run server
npm run server
```

Ensure there are no build errors before submitting.

### 5. Submit Pull Request
1. Push your branch to your fork
2. Create a Pull Request against main branch
3. Provide clear description of changes
4. Link any related issues

---

## Code Standards

### JavaScript / JSX
- Use ES6+ syntax
- SolidJS reactivity patterns
- Avoid unnecessary re-renders
- Proper error handling
- Async/await for asynchronous operations

### Styling
- Use Tailwind CSS utilities
- Avoid custom CSS where possible
- Maintain responsive design
- Support both light and dark modes

### Performance
- Keep bundle size minimal
- Lazy load non-critical components
- Optimize map rendering
- Minimize IndexedDB operations

---

## Testing

Manual testing is required for all changes:
1. Test in both online and offline modes
2. Verify map interactions work correctly
3. Test alarm and notification system
4. Check vehicle mode interface
5. Validate cross-tab communication

---

## Review Process

All pull requests require review from at least one maintainer. Reviews will check:
- Code quality and standards
- Functional correctness
- Performance impact
- Security considerations
- Documentation updates

---

## Issue Reporting

When reporting issues:
1. Use the issue template
2. Include system details
3. Provide steps to reproduce
4. Include screenshots where applicable
5. Describe expected vs actual behaviour

---

## Getting Help

- Check existing documentation first
- Search existing issues
- Create a discussion for questions
- Tag maintainers for critical issues