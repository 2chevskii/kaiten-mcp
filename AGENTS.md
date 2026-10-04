# Repository Guidelines

## Structure and development

This is a local Node.js 24+ TypeScript ESM MCP server. `src/` contains the CLI,
configuration, MCP boundary, and domain tools. All Kaiten requests use the public
API of `@2chevskii/kaiten-client`. `test/` contains protocol tests backed by a local
HTTP server. `docs/` is a private bilingual VitePress workspace.

Install with `npm ci` after authenticating to GitHub Packages. The client uses the
`edge` tag; commit the lockfile and update the dependency explicitly. Never commit
credentials. Generated `lib/`, `node_modules/`, and documentation output must not
be edited by hand.

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
block. Document public behavior in English and Russian. Development is local for
now: remote creation, push, pull requests, and publication require a later task.
Report local checks separately from any live Kaiten verification.
