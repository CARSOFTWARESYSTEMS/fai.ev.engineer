# Contributing to FAI Engineer

## Development Setup

1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env.local` and fill in credentials
4. Run `npm run dev`

## Branching

- `main` — production-ready code
- `dev` — integration branch
- Feature branches: `feature/short-description`
- Bug fixes: `fix/short-description`

## Commit Messages

Use imperative mood and be concise:
- `add PDF viewer placeholder`
- `fix protected route redirect`
- `update landing page hero text`

## Pull Requests

- Keep PRs focused on one feature or fix
- Include a brief description of changes
- Verify build passes before opening PR: `npm run build`
- Test on desktop and mobile

## Code Style

- TypeScript strict mode — no `any` unless justified
- Tailwind for all styling — no inline styles, no CSS modules
- Components: PascalCase filenames
- Utilities: camelCase filenames
- No unused imports

## File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Page components | PascalCase | `LandingPage.tsx` |
| UI components | PascalCase | `Button.tsx` |
| Utilities | camelCase | `formatDate.ts` |
| Config | camelCase | `theme.ts` |

## Security

- Never commit `.env` or `.env.local`
- Never commit Firebase credentials
- Never commit API keys
