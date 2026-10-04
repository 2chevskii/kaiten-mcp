# Setup and development

Kaiten MCP runs locally over stdio. One process uses one Kaiten company and API
token. The server exposes 44 tools for cards, navigation, comments, memberships,
tags, checklists and existing custom properties.

## Install

Use Node.js 24 or newer. Install and build from a checkout:

```sh
npm ci
npm run build
```

The server depends on `@2chevskii/kaiten-client@1.0.2` from the public npm registry.
No GitHub Packages authentication is needed. The manifest pins this version and
the committed lockfile fixes the full dependency tree.

After the first stable MCP release, you can also install the published executable:

```sh
npm install --global @2chevskii/kaiten-mcp --registry=https://registry.npmjs.org
```

With a global installation, use `"command": "kaiten-mcp"` and omit `args` in the
configuration below. Use `"command": "kaiten-mcp.cmd"` on Windows.

## Configure a client

Set the environment for the server process:

| Variable            | Meaning                                                                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| `KAITEN_ORIGIN`     | Required company origin, such as `https://company.kaiten.ru`; no path, credentials, query or fragment |
| `KAITEN_TOKEN`      | Required Kaiten API token                                                                             |
| `KAITEN_TIMEOUT_MS` | Optional timeout per operation; default `30000`, integer from `1` to `2147483647`                     |

HTTPS is required for Kaiten. Loopback HTTP is accepted by the library for local
tests. The REST API version is `v1`.

Add the following stdio entry to a compatible MCP client's configuration, adapting
the configuration file location to that client. Supply the token through the
client's environment/secret settings where available. Replace the placeholders:

```json
{
  "mcpServers": {
    "kaiten": {
      "command": "node",
      "args": ["C:/Users/YOU/source/kaiten-mcp/bin/cli.js"],
      "env": {
        "KAITEN_ORIGIN": "https://company.kaiten.ru",
        "KAITEN_TOKEN": "YOUR_KAITEN_TOKEN"
      }
    }
  }
}
```

Use an absolute path to Node.js 24+ if the client's PATH selects another version.
The CLI works independently of the current directory. Direct `node` execution
keeps npm's script banners out of protocol stdout. The package also declares the
`kaiten-mcp` executable; local development does not require a global installation.

The SDK's stdio entry supports modern MCP connections and legacy initialization.
The server uses Pino to write newline-delimited JSON diagnostics exclusively to
stderr, with a default level of `info` and synchronous writes. Diagnostic messages
exclude credentials and raw upstream errors. The server closes on stdin EOF,
SIGINT or SIGTERM.
Stopping the process or cancelling a tool call cancels its pending HTTP request.

## Use the tools

Typical workflow:

1. Call `kaiten_list_spaces`, then `kaiten_list_boards` with a space ID.
2. Call `kaiten_get_board` to discover valid column and lane IDs.
3. Call `kaiten_search_cards` to find existing work or `kaiten_create_card` to create it.
4. Fetch `kaiten_get_card` for the full description, members, tags, properties and checklist references.
5. Use focused tools to move the card, add a comment or complete a checklist item.
6. Archive a completed card, restore an archived card, or explicitly delete a card.

Tools execute mutations when called. MCP annotations describe read and destructive
operations to the host. Authorization is determined by the Kaiten token's access.

Search returns compact summaries. Descriptions, comment text and checklist item
text are preserved when requested through their respective tools. Lists default
to 25 items, with a maximum of 100 per call. Follow `next_cursor` or `next_offset`
until it is `null`; keep the original filters. A full offset page may produce one
final empty page because those endpoints do not return a total count.

All successful results include `structuredContent` and equivalent JSON text in
`content`. Single-entity results contain `item`; list results contain `items` and
their continuation field. Unknown upstream fields are excluded from the public
projections. Tool schemas are available through MCP `tools/list`.

## Errors

Invalid tool arguments are rejected before a request reaches Kaiten. Operational
failures return `isError: true` and JSON text with `code`, `message`, and an optional
HTTP `status`. Error codes are `KAITEN_HTTP_ERROR`, `INVALID_KAITEN_RESPONSE`,
`NETWORK_ERROR`, `TIMEOUT`, `CANCELLED`, and `INTERNAL_ERROR`.

The server does not automatically retry requests. An interrupted write can have
reached Kaiten; inspect the card before repeating a create operation. Error text
does not include raw upstream bodies, credentials or authorization headers.

## Develop and validate

```sh
npm run build:watch
npm run docs:dev
npm run check
```

`check` runs compilation, test type checking, `node:test`, ESLint, Prettier and the
English/Russian documentation build. To run protocol tests separately, build first:

```sh
npm run build
npm test
```

The tests launch the built CLI from a different working directory, connect an
official MCP client and send requests through the installed Kaiten library to a
local HTTP fixture. They cover every tool's HTTP contract, a complete card
workflow, pagination, validation, sanitized errors, cancellation and shutdown.
They do not contact a working Kaiten company. A specific desktop MCP application's
integration has not been verified.

Use a dedicated branch and small Conventional Commits. Update both documentation
languages for interface changes. Repository conventions are in the root `AGENTS.md`.
See [CI/CD and releases](./releasing.md) for package channels and release setup.

## Current scope

Documents, file attachments,
time tracking, automations, administration, SCIM, webhooks, HTTP transport, MCP
resources and prompts are outside this version. Existing custom property
definitions, options and directories can be read; their values can be assigned to
cards. Definition and directory editing are outside this version.
