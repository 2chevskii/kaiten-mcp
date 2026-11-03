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
lockfile. The build emits `bin/cli.js`. To launch the checkout from its root,
use `node bin/cli.js` with the required Kaiten environment variables.
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

`npm start` launches the compiled CLI for development. For the published package,
use the [npx or npm exec configuration](./guide.md#2-configure-your-mcp-client).

## Measure tool context with OpenAI

The token-count lab uses the pinned development-only `openai` SDK and
`client.responses.inputTokens.count()`. It starts the local MCP server, collects
all pages of `tools/list`, and closes it without executing tools or contacting
Kaiten. Real Kaiten credentials are not needed. The default model is
`gpt-6.1-sol`; access through your OpenAI API project is required.
ChatGPT/Codex subscription authentication does not replace an API key here.

```sh
# Prepare requests without an API key or OpenAI requests.
npm run tokens:count -- --dry-run

# Copy .env.tokens.example to .env.tokens and set OPENAI_API_KEY locally.
# An existing OPENAI_API_KEY environment variable takes precedence.
npm run tokens:count

# Optional: select a model and count each tool in isolation.
npm run tokens:count -- --model gpt-6.1-sol --per-tool
```

Each run saves `catalog.json`, `requests.json`, and (after successful API calls)
`report.json` under a timestamped `artifacts/token-count/` directory. Use
`--output <directory>` to choose a destination; existing files there are
overwritten. Artifacts and `.env.tokens` are ignored by Git. API keys and
authorization headers are not included in the saved requests.

The default run makes three counting requests, with no response generation:

- `baseline`: a fixed short input without tools.
- `functions`: the same input plus all tools mapped to OpenAI functions using
  their names, descriptions, and input schemas. `strict: false` preserves
  optional MCP arguments. Output schemas and MCP annotations are excluded.
- `catalog-as-text`: the short input followed by compact JSON containing the full
  tools array, including output schemas and annotations. This measures the
  catalog as text, not its native MCP representation.

The report preserves API counts, request IDs, and differences from the baseline.
`--per-tool` adds one request per tool; isolated differences need not sum to the
full-catalog difference. These are exact counts for the saved API payloads,
not measurements of Codex or another MCP application's context. They do not
measure tool results, deferred loading, or client-specific instructions.
The lab uses the public OpenAI API endpoint, a 60-second timeout per request,
and no automatic retries. Failures exit nonzero without inventing counts;
the catalog and prepared requests remain available for inspection.

See [OpenAI token counting](https://developers.openai.com/api/docs/guides/token-counting).

## Request flow and project map

The MCP client starts `src/cli.ts`. It reads configuration, creates the Kaiten
client and MCP server, and serves stdio. Tool registration supplies strict input
schemas and output projections. Each tool uses the real Kaiten client; the
registry validates the result and returns structured JSON with equivalent text.

Date inputs advertise compact `date` / `date-time` string formats rather than
expanded calendar regexes. Runtime validation still uses Zod's ISO validators:
dates must exist in the calendar, and date-times require `Z` or a timezone offset.
The same validation applies to card deadlines, search filters and checklist items.

IDs advertise positive integers without repeating JavaScript's maximum safe
integer in each field. Runtime validation still rejects zero, negative,
fractional and unsafe IDs, including array elements. UUID inputs advertise the
`uuid` string format without an expanded regex; Zod's UUID validation still
checks the accepted versions, variants and special nil/max UUIDs before HTTP.

Pagination offsets advertise nonnegative integers with a default of zero,
without repeating the maximum safe integer. Runtime validation still rejects
negative, fractional and unsafe offsets; page limits remain bounded to 1–100.

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
to a local HTTP server. The suite covers all 51 tool contracts, a stateful card
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

The site uses `/kaiten-mcp/` as its base path locally and on GitHub Pages.
The production build writes to `docs/.vitepress/dist/` and checks internal page links.
The site serves the shared branding from the repository's `assets/` directory;
the theme lives in `docs/.vitepress/theme/`.

## Delivery and package checks

Use a dedicated branch and small Conventional Commits. Push the branch, open a
PR and monitor hosted checks. CI also installs the generated tarball in a
temporary directory, checks package metadata and performs MCP initialization
and `tools/list`. The package check uses no real Kaiten credentials and makes
no Kaiten API calls.

See [CI/CD and releases](./releasing.md) for package channels, registry setup and
stable release steps.
