# Repository Guidelines

## Structure and development

This is a local Node.js 24+ TypeScript ESM MCP server. `src/` contains the CLI,
configuration, MCP boundary, and domain tools. All Kaiten requests use the public
API of `@2chevskii/kaiten-client`. `test/` contains protocol tests backed by a local
HTTP server. `docs/` is a private bilingual VitePress workspace.

Install with `npm ci`. The client is pinned to `1.0.3` from public npm; commit the
lockfile and update the dependency explicitly. Never commit credentials. Generated
`bin/`, `artifacts/`, tarballs, `node_modules/`, and documentation output must not
be edited by hand. `tools/` contains package versioning and installation checks.

## Quality and style

Use strict TypeScript, explicit boundary contracts, descriptive kebab-case file
names, and `.ts` relative imports. Follow ESLint and Prettier: two spaces, single
quotes, semicolons, and normal multiline formatting. Keep CLI composition, MCP
registration, schemas, domain mappings, and presentation responsibilities focused.
Prefer readable code and existing platform facilities over speculative abstractions.

Run `npm run check` before completion. It builds the server, checks test types,
runs tests, lint and formatting checks, and builds both documentation languages.
Test observable behavior through the real client library and local HTTP fixtures.
Review the diff for correctness, readability, completeness, and unintended changes.
Keep protocol stdout clean and send diagnostics to stderr.

## Delivery

Use a dedicated branch and small Conventional Commits after each completed logical
block. Document public behavior in English and Russian. Push changes and open a
pull request for implementation tasks; monitor hosted checks. Report local and
hosted checks separately from any live Kaiten verification.

## CI/CD and releases

`ci.yml` checks lint, formatting, test types, protocol tests, and documentation.
It builds and checks an installable tarball, then publishes same-repository PR
versions with `pr-<number>` and `master` versions with `edge` to GitHub Packages.
Fork and Dependabot PRs are checked and packed without publishing. Preview versions
are `<base>-<pr number or master>-<short head SHA>`.

`publish_docs.yml` deploys the bilingual VitePress site from `master` to Pages.
`start_release.yml` checks that `package.json` matches a pushed tag without its
`v` prefix, runs separate check jobs, builds and checks the package, and creates a
draft GitHub release with a raw versioned `.tgz` asset.

`finish_release.yml` runs only on `release.published`. Independent matrix jobs
publish the same asset with explicit `--tag latest`: npm uses OIDC and staged
publishing in `npmjs`; GitHub Packages uses `GITHUB_TOKEN` in `github-packages`.
Each environment links to its package. Rerun only failed jobs after a registry
failure. npm approval requires a maintainer with 2FA. Do not add `NPM_TOKEN`.

Before a release, follow `docs/releasing.md` and verify npm trusted publishing is
configured. Create tags and publish stable releases only when requested.
