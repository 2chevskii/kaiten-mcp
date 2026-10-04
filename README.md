# Kaiten MCP

Local stdio MCP server for Kaiten, built on `@2chevskii/kaiten-client`.

Requires Node.js 24+. See the [English guide](docs/guide.md) or
[руководство на русском](docs/ru/guide.md) for setup and tools.

```sh
npm ci
npm run check
npm start
```

The client dependency is pinned to `1.0.2` from the public npm registry.
Set `KAITEN_ORIGIN` and `KAITEN_TOKEN` before starting the server.

See [CI/CD and releases](docs/releasing.md) for PR/edge packages, stable releases,
and npm trusted publishing setup.
