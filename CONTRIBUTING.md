# Contributing to CryptoLive

Thanks for your interest in contributing! Here's how to get involved.

---

## 🐛 Reporting Bugs

1. Check if the issue already exists in [Issues](../../issues)
2. Open a new issue with:
   - A clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

---

## 💡 Suggesting Features

Open an issue with the `enhancement` label and describe:
- The problem you're solving
- Your proposed solution
- Any alternatives you considered

---

## 🔧 Submitting a Pull Request

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes** — keep commits focused and well-named
4. **Follow commit conventions**:
   ```
   feat(alerts): add email notification support
   fix(chart): resolve flicker on price update
   ```
5. **Push** your branch and open a PR against `main`
6. Fill in the PR template and link any related issues

---

## 📐 Code Style

- Use functional components with hooks
- One component per file
- Name files with PascalCase for components: `CoinCard.jsx`
- Name hooks with camelCase and `use` prefix: `useCryptoPrices.js`
- Keep components small — extract logic into custom hooks

---

## 🌿 Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/...` | `feat/price-alerts` |
| Bug fix | `fix/...` | `fix/auth-redirect` |
| Refactor | `refactor/...` | `refactor/websocket-hook` |
| Docs | `docs/...` | `docs/update-readme` |

---

## ✅ PR Checklist

- [ ] Code builds without errors
- [ ] No console errors or warnings
- [ ] Follows existing code style
- [ ] Commit messages follow conventions
- [ ] Related issue linked

---

Thank you for helping make CryptoLive better! 🚀
