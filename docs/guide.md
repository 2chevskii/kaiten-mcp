# Setup

Kaiten MCP connects an MCP client to one Kaiten company over stdio. You need
Node.js 24 or newer, a Kaiten API token, and a client that can launch a local MCP
server. The token determines which spaces, cards and operations are accessible.

## 1. Install the server

```sh
node --version
npm install --global @2chevskii/kaiten-mcp --registry=https://registry.npmjs.org
npm root --global
```

The last command prints the global `node_modules` directory. Find
`@2chevskii/kaiten-mcp/bin/cli.js` inside it and use that file's absolute path
below. The published package includes the compiled server and installs its
runtime dependencies.

For a source checkout, follow [development](./development.md). After building,
use the checkout's `bin/cli.js` as the entry point.

## 2. Configure your MCP client

For clients that accept an `mcpServers` JSON configuration, add:

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

Replace the path, company address and token. The configuration location and
reload procedure depend on your MCP client. Supply the token through the
client's environment or secret settings where supported.

::: tip Windows paths
Use the directory printed by `npm root --global`. JSON paths can use forward
slashes, for example
`C:/Users/YOU/AppData/Roaming/npm/node_modules/@2chevskii/kaiten-mcp/bin/cli.js`.
If the client cannot resolve Node.js 24+, set `command` to the absolute path of
that Node.js executable.
:::

Direct `node` execution works independently of the current directory and keeps
npm script banners out of protocol stdout. The package also supplies the
`kaiten-mcp` executable for hosts that support launching it from PATH.

### Environment variables

| Variable            | Required | Value                                                                                            |
| ------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `KAITEN_ORIGIN`     | Yes      | Company origin, such as `https://company.kaiten.ru`; no API path, credentials, query or fragment |
| `KAITEN_TOKEN`      | Yes      | Kaiten API token; whitespace around the token is trimmed                                         |
| `KAITEN_TIMEOUT_MS` | No       | Timeout per tool operation in milliseconds; default `30000`, integer from `1` to `2147483647`    |

HTTPS is required for a Kaiten company. The client library accepts loopback HTTP
for local fixtures. REST requests use API v1.

To connect to several companies or tokens, create separate server entries with
unique names and their own environment variables.

## 3. Verify the connection

Reload your client's MCP configuration and check that it discovers **44 tools**
with the `kaiten_` prefix. Ask the assistant:

> Identify my Kaiten user, then list the spaces I can access.

This uses `kaiten_get_current_user` and `kaiten_list_spaces` and verifies a real
read through the configured token. A successful MCP connection alone verifies
process startup and tool discovery; the first tool call verifies Kaiten access.

If the process exits or the tool fails, see [troubleshooting](./troubleshooting.md).
Starting the server in a terminal may appear idle while it waits for MCP input.

## 4. Choose a workflow

Start with [finding your cards](./workflows.md#find-my-active-cards),
[reading a card's context](./workflows.md#understand-a-card), or
[creating a card and checklist](./workflows.md#create-a-card-and-checklist).
The [tool reference](./tools.md) lists every tool's arguments and behavior.

Tools execute changes immediately when called. The MCP host decides how to
present or approve calls; server annotations describe read and destructive
operations. Kaiten enforces the token's permissions.

Search returns compact summaries. Fetch card details, comments and checklist
items with their dedicated tools. Lists default to 25 items and accept at most
100; follow the returned continuation field until it is `null`.

## Supported scope

The 44 tools cover navigation, cards, comments, memberships, tags, checklists and
existing custom properties. Property definitions, options and directories can be
read, and values can be assigned to cards.

Documents, attachments, time tracking, automations, administration, SCIM,
webhooks, property-definition editing and directory editing are outside this
version. The server exposes tools over stdio; HTTP transport, MCP resources and
prompts are outside this version.
