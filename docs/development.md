# Development

The project is a Node.js 24+ TypeScript ESM server. All Kaiten requests go through
`@2chevskii/kaiten-client`, pinned to `1.0.3` from public npm. The documentation is
a private npm workspace using VitePress `2.0.0-alpha.20`.

## Build from a checkout

From the repository root:

```sh
npm ci
npm run build
npm run check
```

`npm ci` installs the server and documentation workspaces using the committed
lockfile. The build emits `bin/cli.js`; use its absolute path in the
[MCP client configuration](./guide.md#2-configure-your-mcp-client).
Generated output is excluded from Git and must not be edited by hand.

| Command                | Purpose                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run build`        | Compile `src/` into `bin/`                                        |
| `npm run build:watch`  | Rebuild server source as it changes                               |
| `npm run test:types`   | Check source and test TypeScript types                            |
| `npm test`             | Run protocol tests; build first                                   |
| `npm run lint`         | Run ESLint                                                        |
| `npm run format:check` | Check Prettier formatting                                         |
| `npm run docs:dev`     | Start the documentation preview                                   |
| `npm run docs:build`   | Build both documentation languages                                |
| `npm run check`        | Run the build, test types, tests, lint, formatting and docs build |

`npm start` launches the compiled CLI. For an MCP host, use direct `node`
execution to keep npm's script output out of protocol stdout.

## Request flow and project map

The MCP client starts `src/cli.ts`. It reads configuration, creates the Kaiten
client and MCP server, and serves stdio. Tool registration supplies strict input
schemas and output projections. Each tool uses the real Kaiten client; the
registry validates the result and returns structured JSON with equivalent text.

| Path                                    | Responsibility                                                                |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `src/cli.ts`                            | Stdio transport, startup failure handling and shutdown                        |
| `src/config.ts`                         | Environment variables and timeout validation                                  |
| `src/server.ts`                         | Kaiten client and server composition; tool-group registration                 |
| `src/tool-registry.ts`                  | MCP annotations, timeout/cancellation, output validation and error boundary   |
| `src/schemas.ts`                        | Shared IDs, dates, pagination and change validation                           |
| `src/views.ts`                          | Public response projections; unknown upstream fields are stripped             |
| `src/results.ts`                        | Entity and paginated result envelopes                                         |
| `src/errors.ts`, `src/logger.ts`        | Sanitized operational errors and JSON diagnostics on stderr                   |
| `src/tools/`                            | Navigation, card reads/writes, comments, relations, checklists and properties |
| `test/harness.ts`, `test/tool-cases.ts` | Local HTTP fixture, real stdio MCP connection and tool contract cases         |
| `tools/`                                | Preview version calculation and installed-package checks                      |
| `docs/`, `docs/ru/`                     | English and Russian pages with matching routes                                |
| `docs/.vitepress/config.ts`             | Locale navigation, sidebar and local search                                   |
| `.github/workflows/`                    | CI, package publishing, releases and Pages deployment                         |

A tool's abort signal combines client cancellation, process shutdown and its
operation timeout. The timeout applies to the whole tool operation. The server
performs no automatic retries. CLI startup and transport diagnostics use Pino
with synchronous writes to stderr.

## Change a tool

1. Update the focused module in `src/tools/`. Use the public Kaiten client API.
2. Define strict input schemas and explicit public output views. Preserve
   intentional distinctions between omitted fields, `null`, `false` and `0`.
3. Extend HTTP contract cases and relevant behavior tests using production-shaped
   responses, including omitted or nullable fields.
4. Document public changes in both languages and run `npm run check`.

Use `.ts` relative imports, kebab-case file names, strict TypeScript and the
repository's ESLint/Prettier formatting. Keep transport, registration, mappings
and presentation focused. Repository conventions are in the root `AGENTS.md`.

## What the checks prove

Protocol tests launch the compiled CLI from a different working directory and
connect the official MCP client. Calls go through the installed Kaiten library
to a local HTTP server. The suite covers all 44 tool contracts, a stateful card
workflow, pagination, input validation, nullable response fields, sanitized
failures, cancellation and shutdown.

These checks exercise MCP and HTTP contracts against fixtures. They do not
contact a real Kaiten company or prove integration with a particular desktop
MCP application. For a live read check, follow the [connection verification](./guide.md#3-verify-the-connection).

## Documentation changes

Run `npm run docs:dev` and open the URL printed by VitePress. Check English and
Russian pages, their language switch, local search and navigation. Keep matching
page names under `docs/` and `docs/ru/` so locale switching reaches the equivalent
page. Update both locale sidebars when adding a page.

`VITEPRESS_BASE` defaults to `/` locally. The Pages workflow sets it to
`/kaiten-mcp/`. Keep links compatible with that base; the production build writes
to `docs/.vitepress/dist/` and checks internal page links.

## Delivery and package checks

Use a dedicated branch and small Conventional Commits. Push the branch, open a
PR and monitor hosted checks. CI also installs the generated tarball in a
temporary directory, checks package metadata and performs MCP initialization
and `tools/list`. The package check uses no real Kaiten credentials and makes
no Kaiten API calls.

See [CI/CD and releases](./releasing.md) for package channels, registry setup and
stable release steps.
