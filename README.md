# Kaiten MCP

Kaiten MCP connects your AI assistant to your Kaiten workspace. It lets the
assistant find cards, read their context, and make changes through tools exposed
over the Model Context Protocol (MCP).

The server runs locally on your computer. Your MCP client starts it when needed
and communicates with it over stdio; the server sends requests to Kaiten using
your API token. Each server connection uses one Kaiten company and one token.

[English documentation](https://2chevskii.github.io/kaiten-mcp/) ·
[Документация на русском](https://2chevskii.github.io/kaiten-mcp/ru/) ·
[npm package](https://www.npmjs.com/package/@2chevskii/kaiten-mcp)

## What you can do

The server provides 44 tools covering everyday work with cards:

- **Find your way around:** browse spaces, boards, columns and lanes; look up
  users, card types and tags.
- **Work with cards:** search and read cards, create new ones, update descriptions
  and deadlines, move cards, and archive, restore or delete them.
- **Keep the conversation together:** read and manage comments, card members and
  tags.
- **Track smaller tasks:** create checklists, add items, assign responsibility and
  mark items complete.
- **Use custom fields:** inspect existing property definitions, options and
  directories, and set property values on cards.

Once connected, try asking your assistant to:

> Find overdue cards assigned to me on the Support board.
>
> Read this card and its comments, then summarize what is blocking it.
>
> Create a card for the release checklist and add these three tasks.

The assistant uses the available tools to carry out these requests. Changes made
through the server affect your Kaiten workspace immediately, with the permissions
of the supplied token. Review proposed changes in your MCP client before approving
them.

## Get started

You need **Node.js 24 or newer**, a Kaiten API token, and an MCP client that can
launch a local stdio server.

### 1. Install the server

```sh
npm install --global @2chevskii/kaiten-mcp@1.0.0 --registry=https://registry.npmjs.org
```

The package includes the compiled server and installs its runtime dependencies.
You do not need to clone this repository or build it yourself.

### 2. Find the installed package

```sh
npm root --global
```

This prints the global `node_modules` directory. The server entry point is
`@2chevskii/kaiten-mcp/bin/cli.js` inside that directory. Use its full path in the
configuration below.

### 3. Add it to your MCP client

For clients that use an `mcpServers` JSON configuration, add an entry like this:

```json
{
  "mcpServers": {
    "kaiten": {
      "command": "node",
      "args": [
        "/absolute/path/to/node_modules/@2chevskii/kaiten-mcp/bin/cli.js"
      ],
      "env": {
        "KAITEN_ORIGIN": "https://company.kaiten.ru",
        "KAITEN_TOKEN": "YOUR_KAITEN_TOKEN"
      }
    }
  }
}
```

Replace the path, company address and token. On Windows, forward slashes work in
the JSON path, for example
`C:/Users/YOU/AppData/Roaming/npm/node_modules/@2chevskii/kaiten-mcp/bin/cli.js`;
use the location reported by `npm root --global` on your machine. If your MCP
client cannot find Node.js 24+, set `command` to the full path to that Node.js
executable.

The configuration file location and reload procedure depend on your MCP client.
If it provides dedicated secret settings, use those for the token. Once the client
connects, it can discover the tools through MCP. Start by asking it to list your
Kaiten spaces or boards.

## Configuration

| Variable            | Required | Description                                                                                                            |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `KAITEN_ORIGIN`     | Yes      | Your company origin, such as `https://company.kaiten.ru`. Supply the origin only, without an API path or query string. |
| `KAITEN_TOKEN`      | Yes      | The Kaiten API token used for all requests.                                                                            |
| `KAITEN_TIMEOUT_MS` | No       | Timeout for each tool operation, in milliseconds. Defaults to `30000`; accepts integers from `1` to `2147483647`.      |

To connect to several Kaiten companies, add a separate server entry for each,
with its own name and environment settings.

## How it behaves

Search and list tools return compact results with pagination. Individual read
tools provide the full requested description, comment or checklist item text.
Your assistant can follow the returned cursor or offset to load more results.

The server validates tool arguments before sending requests. Cancelling a tool
call cancels its pending HTTP request. Failed requests are not automatically
retried; if a write times out, check the card before repeating the change.

Diagnostics go to stderr, leaving stdout for the MCP protocol. The process stops
when the client closes its input stream or sends a termination signal. Starting
it in a terminal can appear idle because it is waiting for an MCP connection.

This release focuses on cards and their related data. Documents, file attachments,
time tracking, automation management, administration, SCIM and webhooks are outside
its scope. The server supports stdio transport and exposes tools; it does not
provide an HTTP endpoint, MCP resources or prompts.

See the [tool reference](https://2chevskii.github.io/kaiten-mcp/tools) for all tool
names, arguments and response fields, or the
[setup guide](https://2chevskii.github.io/kaiten-mcp/guide) for more detail.

## Development

From a checkout of this repository:

```sh
npm ci
npm run check
```

`check` builds the server, checks test types, runs protocol tests, checks lint and
formatting, and builds the English and Russian documentation. The tests use the
real client library against a local HTTP fixture; they do not access your Kaiten
company.

Use `npm run build:watch` while editing the server and `npm run docs:dev` to preview
the documentation. The server is built on
[`@2chevskii/kaiten-client`](https://github.com/2chevskii/kaiten-client), pinned to
version `1.0.3` from npm.

PR and `edge` packages are available through GitHub Packages. Stable packages use
the `latest` tag in npm and GitHub Packages. See the
[release guide](https://2chevskii.github.io/kaiten-mcp/releasing) for the CI/CD
workflow and publishing process.

## License

[MIT](https://github.com/2chevskii/kaiten-mcp/blob/master/LICENSE).
