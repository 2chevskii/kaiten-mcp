# CI/CD and releases

## Pull requests and master

CI runs lint, formatting, test type checking, protocol tests and the bilingual
documentation build as separate jobs. It builds a versioned `.tgz`, installs it
with production dependencies in a temporary directory, and checks MCP initialization
and `tools/list` before uploading the raw archive and publishing it.

| Source             | Package version                               | Registry tag  |
| ------------------ | --------------------------------------------- | ------------- |
| Same-repository PR | `<base>-<PR number>-<head SHA, 7 characters>` | `pr-<number>` |
| `master`           | `<base>-master-<SHA, 7 characters>`           | `edge`        |

These previews go to GitHub Packages. Fork and Dependabot PRs run checks and upload
an archive without publishing. Installing previews requires GitHub Packages read
access. Stable MCP releases and the pinned client dependency use public npm.
The documentation deploys from `master` to
[GitHub Pages](https://2chevskii.github.io/kaiten-mcp/).

## Registry setup

GitHub environments:

| Environment       | Purpose                                                   | Deployment URL                                                                       |
| ----------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `npmjs`           | Stage stable packages using npm OIDC                      | [npm package](https://www.npmjs.com/package/@2chevskii/kaiten-mcp)                   |
| `github-packages` | Publish previews and stable packages using `GITHUB_TOKEN` | [GitHub package](https://github.com/users/2chevskii/packages/npm/package/kaiten-mcp) |
| `github-pages`    | Publish documentation                                     | [Documentation](https://2chevskii.github.io/kaiten-mcp/)                             |

Restrict `npmjs` deployments to tags matching `v*.*.*`. Enable GitHub Actions as
the Pages build source. The workflow supplies package URLs when jobs run.

Before using the npm release job, configure a
[Trusted Publisher](https://docs.npmjs.com/trusted-publishers/) for
`@2chevskii/kaiten-mcp`:

- Provider: GitHub Actions.
- Owner: `2chevskii`; repository: `kaiten-mcp`.
- Workflow filename: `finish_release.yml`.
- Environment: `npmjs`.
- Allowed action: `npm stage publish`.

The package must already exist on npm to configure trust. For a new package,
complete its initial publication with a maintainer account before configuring
OIDC. Use a separate bootstrap version so the intended stable version remains
available for the release workflow. This one-time setup requires npm account
access and 2FA. Do not add an
`NPM_TOKEN` repository secret. See the [npm trust prerequisites](https://docs.npmjs.com/cli/v11/commands/npm-trust/#prerequisites).

## Release

1. Update the package and lockfile version together, open a PR and merge it after
   CI passes.
2. Tag the merged commit with `v<package.json version>` and push the tag.
   `start_release.yml` verifies version equality, runs separate lint, formatting,
   test and documentation jobs, then builds and checks the installable package.
3. Inspect the generated draft release and its `2chevskii-kaiten-mcp-<version>.tgz`
   asset. Publish the GitHub release when ready.
4. `finish_release.yml` starts automatically. Independent jobs publish that asset
   to GitHub Packages and stage it in npm, both with explicit `--tag latest`.
5. In npm's **Staged Packages**, review and approve the staged version with 2FA.
   The public npm `latest` tag changes only after approval.

There is no manual trigger for `finish_release.yml`. If one registry fails, rerun
only the failed job from the original workflow run. The successful registry job
does not need to publish the same immutable version again.

To check a stable archive locally after `npm ci`:

```sh
npm run check
npm pack
npm run package:check -- ./2chevskii-kaiten-mcp-1.0.0.tgz
```

The package check requires a prior build and npm access for production dependencies.
It starts the installed CLI from a temporary directory without contacting Kaiten.
