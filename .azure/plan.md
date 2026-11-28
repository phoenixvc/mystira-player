# Dev Player deployment plan

Status: CI validated; awaiting merged dev deployment and live verification

## Observed target

- Subscription: `mystira-sub` (`bb4e3882-2079-4bab-8974-611bc0b8bb58`).
- Existing resource: `mys-dev-player-swa` in `mys-dev-app-rg`, East US 2, Free tier.
- Existing custom domain: `dev.player.mystira.app`.
- Resource is tagged `ManagedBy=terraform`; repository and branch linkage are currently empty. Infrastructure and DNS remain in their existing Terraform ownership.
- This repository has no `.github/workflows` at the observed `origin/dev` commit `84aaa6b`.

## Delivery

1. Add one GitHub Actions workflow for PR validation and a `dev` branch deployment to the existing Static Web App. Build the frontend with the committed lockfile, run typecheck, Vitest and accepted story-content validation, then upload the prebuilt `dist` directory. Report the eight existing Fire Door draft overlap errors in a nonblocking step until its content is corrected. The workflow never deploys pull requests.
2. Add SPA navigation fallback configuration to the Vite `public` directory so it is copied into `dist`.
3. Store the existing Static Web App deployment token as GitHub Actions secret `AZURE_STATIC_WEB_APPS_API_TOKEN_DEV_PLAYER`. Do not commit or print its value.
4. Verify the workflow syntax, local checks and exact branch. Once merged to `dev`, inspect the deployment run and the live custom domain before claiming deployed acceptance.

## Boundary

This pipeline deploys the current standalone local demo configuration. It does not provision Azure resources, change DNS, connect the protected Story API, or claim signed-in Mystira acceptance. The site receives public static assets only; no ElevenLabs credential is bundled.

## 7. Validation proof

- Azure resource lookup: `mys-dev-player-swa` exists, has `dev.player.mystira.app`, and uses deployment-token authentication. No repository branch is linked.
- GitHub secret-name lookup: `AZURE_STATIC_WEB_APPS_API_TOKEN_DEV_PLAYER` is present after the user explicitly authorized transferring the existing app's deployment token. Its value was not displayed or committed.
- `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test` (162 tests), and `pnpm build` passed locally. Build includes `dist/staticwebapp.config.json`; static output is about 86 MB.
- Workflow parsed as YAML with `on.pull_request`, `on.push` and `deploy-dev` jobs; `git diff --check` passed.
- `core-preview.story.yaml` and `pumpkin-gate.story.yaml` pass content validation. The draft `fire-door.story.yaml` reports eight overlapping target boxes, so its check is visible but nonblocking in the initial workflow.
- Automatic approval review first rejected the transfer because the user's earlier “ok” was ambiguous. The user subsequently authorized the exact source, destination and secret name; the transfer then succeeded. The PR's validation job passed at head `8f1af4c`. Deployment is still unobserved until this PR lands on `dev` and the live URL is checked.
