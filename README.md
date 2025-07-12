# Canada Spends helps Canadians understand how their government spends their money


## Ambition

Canada Spends aims to be the easiest way for Canadians to understand how their government spends their money.
A government cannot be held accountable if people don't understand what the government is doing. We aim to
bring transparency to every level of government in Canada: federal, provincial, municipal and school boards.

We bring this transparency in two ways:

1) We parse, aggregate and visualize audited financial statements that governments publish so that everyone can
   understand how their government spends their money and how it changes over time.
2) We aggregate and normalize government spending databases to make the data fast to search and accessible.

### Roadmap

By the end of 2025, we aim to have automated data ingestion pipelines for every province and territory and the largest 20 municipalities in Canada.

- [ ] Alberta
- [ ] British Columbia
- [ ] Ontario
- [ ] Quebec
- [ ] Saskatchewan
- [ ] Manitoba
- [ ] Nova Scotia
- [ ] New Brunswick
- [ ] Prince Edward Island
- [ ] Newfoundland and Labrador
- [ ] Yukon
- [ ] Northwest Territories
- [ ] Nunavut

- [ ] Toronto
- [ ] Ottawa
- [ ] Montreal
- [ ] Vancouver #79
- [ ] Calgary #81
- [ ] Edmonton #82
- [ ] Winnipeg #83
- [ ] Hamilton
- [ ] London
- [ ] Mississauga
- [ ] Brampton
- [ ] Markham
- [ ] Oakville
- [ ] Halifax
- [ ] Saint John
- [ ] St. John's
- [ ] Charlottetown
- [ ] Surrey
- [ ] Moncton
- [ ] Quebec City
- [ ] Victoria
- [ ] Vaughan
- [ ] Markham
- [ ] Gatineau


## Getting Started

Canada Spends is a NextJS app. To run it, run:

```
pnpm install
pnpm run dev
```

## Large Binaries/PDFs

This repo uses [Git LFS](https://git-lfs.com/) to version control large binaries. This helps ensure cloning and fetching is performant. To use this, you must install git-lfs locally.

In the event that you do not have Git LFS installed. When the repository is cloned, any files that it is tracking will not be usable or viewable locally. The files instead will show as a pointer to the file only. The rest of the source code, and git operations will work as expected. If you have no need for any of the files tracked by Git LFS (See .gitattributes), then in this way the Git LFS extension is optional.

### Installing

For macOS, via brew ` brew install git-lfs`

For Linux, [straightforward steps here](https://github.com/git-lfs/git-lfs/blob/main/INSTALLING.md)

For Windows, Git LFS is included with the [Git for Windows distribution](https://gitforwindows.org/).

[Alternative installation options (https://github.com/git-lfs/git-lfs/wiki/Installation) exist as well.

### Using

Once installed, run `git lfs install`

Yes, even though it was installed above, this is the command to _ensure_ it's installed and conifured to work.

That is it. It should work seamlessly with `git` for all binaries that Git LFS is currently tracking.

For how to add and remove (ie. 'track', and 'untrack') files from Git LFS, advanced commands to inspect and configure lfs - it is all covered in this [brief tutorial](https://github.com/git-lfs/git-lfs/wiki/Tutorial#git-lfs-tutorial).

## Linting

This project uses ESLint with Next.js configuration. Run linting with:

```bash
pnpm lint          # Check for linting issues
pnpm lint:fix      # Auto-fix auto-fixable issues
```

The linting configuration enforces TypeScript best practices, React rules, and Next.js optimizations while keeping most issues as warnings (temporarily) to avoid blocking development.

## Git Hooks

This project automatically runs linting checks before each commit using `simple-git-hooks`. This is enabled automatically when you run `pnpm install`. If you need to enable it manually:

```bash
npx simple-git-hooks
```

If linting fails, the commit will be blocked until issues are resolved.
