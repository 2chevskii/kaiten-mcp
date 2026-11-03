<script setup>
import ConnectionForm from './.vitepress/components/ConnectionForm.vue';
import {useConnectionValues} from './.vitepress/use-connection-values.js';

const {origin, token, shellOrigin, shellToken, configOrigin, configToken} =
  useConnectionValues();
</script>

# Installation

Kaiten MCP connects an MCP client to one Kaiten company over stdio. You need
Node.js 24 or newer, a Kaiten API token, and a client that can launch a local MCP
server. The token determines which spaces, cards and operations are accessible.

## 1. Check Node.js

Use Node.js 24 or newer. npm and npx are included with Node.js:

```sh
node --version
npm --version
```

## 2. Configure your MCP client

Choose a CLI command or configuration file below. The Codex and Claude Code
examples install the server for your user across projects. Replace the company
address and token, and merge entries into existing configuration files. Keep real
tokens out of version control. Restart the client after setup.

<ConnectionForm v-model:origin="origin" v-model:token="token" locale="en" />

CLI commands use POSIX shell syntax.

### Codex

**CLI:**

```sh-vue
codex mcp add kaiten --env KAITEN_ORIGIN={{ shellOrigin }} --env KAITEN_TOKEN={{ shellToken }} -- npx --yes @2chevskii/kaiten-mcp
```

**Configuration file:** add to `~/.codex/config.toml`:

```toml-vue
[mcp_servers.kaiten]
command = "npx"
args = ["--yes", "@2chevskii/kaiten-mcp"]

[mcp_servers.kaiten.env]
KAITEN_ORIGIN = "{{ configOrigin.slice(1, -1) }}"
KAITEN_TOKEN = "{{ configToken.slice(1, -1) }}"
```

For one trusted project, use `.codex/config.toml` at its root instead. Run
`codex mcp list` to check registration, or `/mcp` inside Codex for active servers.
See the [official Codex MCP guide](https://developers.openai.com/codex/mcp/).

### Claude Code

**CLI:**

```sh-vue
claude mcp add --scope user --transport stdio kaiten --env KAITEN_ORIGIN={{ shellOrigin }} --env KAITEN_TOKEN={{ shellToken }} -- npx --yes @2chevskii/kaiten-mcp
```

**Configuration file:** merge this entry into the top-level `mcpServers` in
`~/.claude.json`:

```json-vue
{
  "mcpServers": {
    "kaiten": {
      "type": "stdio",
      "command": "npx",
      "args": ["--yes", "@2chevskii/kaiten-mcp"],
      "env": {
        "KAITEN_ORIGIN": {{ configOrigin }},
        "KAITEN_TOKEN": {{ configToken }}
      }
    }
  }
}
```

For a shared project configuration, put the same JSON in `.mcp.json` at the project
root, or use `--scope project` in the CLI command. Run `claude mcp get kaiten` to
check status, or `/mcp` inside Claude Code. See the
[official Claude Code MCP guide](https://code.claude.com/docs/en/mcp).

### Other MCP clients

For clients that accept an `mcpServers` JSON configuration, add:

```json-vue
{
  "mcpServers": {
    "kaiten": {
      "command": "npx",
      "args": ["--yes", "@2chevskii/kaiten-mcp"],
      "env": {
        "KAITEN_ORIGIN": {{ configOrigin }},
        "KAITEN_TOKEN": {{ configToken }}
      }
    }
  }
}
```

npx resolves the package and downloads it into npm's cache when needed.
`--yes` suppresses the installation prompt so the MCP client can start the
server unattended. The published package contains the compiled server.

Replace the company address and token. The configuration location and
reload procedure depend on your MCP client. Supply the token through the
client's environment or secret settings where supported. Ensure the client can
find Node.js and npx in its PATH.

For a source checkout, follow [development](./development.md).

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

Reload your client's MCP configuration and check that it discovers **51 tools**
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

The 51 tools cover navigation, cards, parent and child relationships, external links, comments, memberships, tags,
checklists and existing custom properties. Property definitions, options and directories can be
read, and values can be assigned to cards.

Documents, attachments, time tracking, automations, administration, SCIM,
webhooks, property-definition editing and directory editing are outside this
version. The server exposes tools over stdio; HTTP transport, MCP resources and
prompts are outside this version.
