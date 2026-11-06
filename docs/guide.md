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

| Variable              | Required | Value                                                                                              |
| --------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `KAITEN_ORIGIN`       | Yes      | Company origin, such as `https://company.kaiten.ru`; no API path, credentials, query or fragment   |
| `KAITEN_TOKEN`        | Yes      | Kaiten API token; whitespace around the token is trimmed                                           |
| `KAITEN_TIMEOUT_MS`   | No       | Timeout per tool operation in milliseconds; default `30000`, integer from `1` to `2147483647`      |
| `KAITEN_CONTEXT_FILE` | No       | Comma-separated context file paths, loaded left to right at startup; overrides automatic discovery |

HTTPS is required for a Kaiten company. The client library accepts loopback HTTP
for local fixtures. REST requests use API v1.

To connect to several companies or tokens, create separate server entries with
unique names and their own environment variables.

### Identity and connection context

Without additional configuration, “I”, “me” and “my” refer to the account returned
by `kaiten_navigation_read` (`get_current_user`). The assistant is instructed to use its Kaiten ID,
without asking whether its name matches your OpenAI profile, OS username or
nickname. “My tasks” defaults to `responsible_ids`; explicit requests such as
“cards I created” take precedence.

For a service token, set `user_id` to the person whose tasks should count as
yours. This does not change the token account or its permissions:
`kaiten_navigation_read` (`get_current_user`) always returns the actual token account.

Optionally create `.agents/kaiten-mcp.context.json` in your project or user profile:

```json
{
  "user_id": 42,
  "my_tasks_role": "responsible",
  "instructions": "Show overdue tasks first. Use the delivery board for delivery work.",
  "spaces": [{"id": 10, "purpose": "Engineering work"}],
  "boards": [
    {
      "id": 20,
      "space_id": 10,
      "purpose": "Delivery work",
      "guidance": "Choose for delivery requests; use another board for infrastructure."
    }
  ]
}
```

Without `KAITEN_CONTEXT_FILE`, the server loads existing files in this order:

1. `<user profile>/.agents/kaiten-mcp.context.json`.
2. `.agents/kaiten-mcp.context.json` in the project root, then each directory down
   to the server's working directory, with the closest file loaded last.

The project root is the nearest ancestor (including the working directory) with
a `.git` file or directory, including Git worktrees. Without one, only the working
directory and user profile are searched. A file reached through both locations is
loaded once. The MCP client must launch the server with the project's working
directory for project discovery to work; it does not follow the chat's project
automatically. Missing automatically discovered files are skipped.

To replace automatic discovery, set `KAITEN_CONTEXT_FILE` in the same environment
settings as the token. For Codex, add under `[mcp_servers.kaiten.env]`:

```toml
KAITEN_CONTEXT_FILE = "C:/Users/me/.agents/kaiten-mcp.context.json,.agents/kaiten-mcp.context.json"
```

Explicit paths load left to right; relative paths resolve against the server's
working directory. Every explicit file must exist. Whitespace around paths is
trimmed; empty entries and paths containing commas are not supported. Use an
explicit file containing `{}` to disable inherited automatic context.

When merging, the last specified `user_id` or `my_tasks_role` wins. `instructions`
are concatenated in load order; later instructions take precedence on conflicts.
`spaces` and `boards` merge by `id`, with later records replacing earlier records
in full, including optional fields. An omitted field preserves the inherited
value; an empty array clears the corresponding list. The same rules apply to
automatic discovery and explicit paths.

All JSON fields are optional. `my_tasks_role` accepts `responsible` (default),
`member` or `owner`, selecting the corresponding search filter. Every space or
board requires a positive safe integer `id` and nonempty `purpose`; `guidance` is
optional, as is a board's `space_id`. `user_id` uses the same ID constraints.
Unknown fields, invalid values, empty explicit paths, unreadable files and malformed
JSON stop startup with a generic diagnostic on stderr. Files are read once;
restart the server after edits. Each server entry can use its own files. Their
merged contents are shared with the model, so keep secrets out.

The server sends this guidance in MCP initialization `instructions` and repeats it
in the description of `kaiten_navigation_read` (`get_current_user`) for clients that omit server
instructions. No extra Kaiten requests are made during initialization. A client
must expose the instructions or tool descriptions to the model; this cannot repair
tools missing from a client's catalog.

Explicit user requests override connection preferences. For omitted scope, the
assistant should choose a configured space or board only if its purpose fits
unambiguously. Otherwise it should discover available scopes and ask when needed.
Before using configured references, it should check `kaiten_navigation_read` (`get_space`) or
`kaiten_navigation_read` (`get_board`) and verify a configured board/space relationship with
`kaiten_navigation_read` (`list_boards`) (following pagination). Missing or inaccessible references
require reporting the problem and asking for a replacement, without silently
switching scope. A request for all tasks must not be silently narrowed to a default.

These are instructions to the model, not automatic filter injection or server-side
access controls. Tools continue to use the IDs and filters supplied by the client;
Kaiten enforces permissions. No network validation of configured references occurs
at startup. Actual model behavior needs verification in your MCP client.

## 3. Verify the connection

Reload your client's MCP configuration and check that it discovers **18 tools**
with the `kaiten_` prefix. Ask the assistant:

> Identify my Kaiten user, then list the spaces I can access.

This uses `kaiten_navigation_read` (`get_current_user`) and `kaiten_navigation_read` (`list_spaces`) and verifies a real
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

The 18 tools cover navigation, cards, parent and child relationships, external links, comments, memberships, tags,
checklists and existing custom properties. Property definitions, options and directories can be
read, and values can be assigned to cards.

Spaces, boards, columns, subcolumns and lanes can also be created, updated and
removed through [advanced client operations](./api.md).

User profiles, groups, roles, invitations and space access are supported through
[identity and access operations](./identity.md).

[SCIM provisioning](./scim.md) supports users, groups and typed patch operations.

[Time tracking](./time-tracking.md) supports card logs and paginated reports.

[Documents and groups](./documents.md) support content editing, schema discovery,
cloning, publishing controls and both pagination formats.

[Automations](./automations.md) support event, date and on-demand definitions.

[Incoming card webhooks](./webhooks.md) are supported.

Attachments are outside this
version. The server exposes tools over stdio; HTTP transport, MCP resources and
prompts are outside this version.

[Custom-field administration](./custom-fields.md) supports definitions, options,
scores, votes and availability bindings.

[Custom directories](./directories.md) support directory, field and record
administration, nested record filters and linked-card lookup.
