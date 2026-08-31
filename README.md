# Canada Spends

_A Build Canada Project_

Canada Spends is making Canada the most transparent country in the world so that our governments can be the most accountable country in the world.

Canadian governments create and publish so much data but it's often published in ways that are so difficult to understand, process and correlate with other datasets. We're building tools so that you can understand the data in minutes, not hours.

Canada Spends is building core civic infrastructure to make this easy. We organize public data in ways that you can understand in minutes, not hours.

## Understanding How Governments work.

We have found that the easiest way to understand what government priorities are is to take a bottom up approach and look at where public funds is actually being spent. There is so much noise in our media environment that it's easy to get a skewed view of what governments are actually doing. It's also easy for politicians to stay silent on spending that is not in the media spotlight given the scale of government operations.

We bring this transparency in two ways:

1. We parse, aggregate and visualize audited financial statements that governments publish so that everyone can
   understand how their government spends their money and how it changes over time.
2. We aggregate and normalize government spending databases to make the data fast to search and accessible.

## Getting Started

Canada Spends is a NextJS app. To run it, run:

```
pnpm install
pnpm run dev
```

Municipal financial statements are loaded server-side from York Factory. Set
`YORK_FACTORY_API_URL` to override the default production API base (for example,
run Rails with `bin/rails server -p 3001`, then set
`YORK_FACTORY_API_URL=http://localhost:3001/api/v1` when starting Canada Spends).

## Linting

This project uses ESLint with Next.js configuration. Run linting with:

```bash
pnpm lint          # Check for linting issues
pnpm lint:fix      # Auto-fix auto-fixable issues
```

The linting configuration enforces TypeScript best practices, React rules, and Next.js optimizations while keeping most issues as warnings (temporarily) to avoid blocking development.

## Prettier

This project uses [Prettier](https://prettier.io/) for code formatting. To format your code manually, run:

```bash
pnpm format
```

## Git Hooks

This project automatically runs linting checks and formatting before each commit using `simple-git-hooks`. This is enabled automatically when you run `pnpm install`. If you need to enable it manually:

```bash
npx simple-git-hooks
```

If linting fails, the commit will be blocked until issues are resolved.
