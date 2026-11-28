# Dev Player deployment

The standalone demo builds from this repository and deploys to the existing Azure Static Web App `mys-dev-player-swa` in resource group `mys-dev-app-rg`. Its custom domain is `https://dev.player.mystira.app`. The resource and DNS are Terraform managed outside this repository; this workflow uploads only static content.

`.github/workflows/dev-player.yml` validates pull requests to `dev`. A successful push to `dev` (or a manual run selected on `dev`) builds once and uploads the same `dist` artifact to the production environment of that **dev** Static Web App. Pull requests do not deploy previews. The workflow runs typecheck, Vitest, the two accepted Manor story YAML checks and the production app/element build before upload. It also reports the draft Fire Door content check as a visible nonblocking step: at pipeline creation the checker reports eight overlapping target boxes in that draft. Clear those boxes and make this step blocking before claiming the Fire Door content has passed validation.

The GitHub Actions secret `AZURE_STATIC_WEB_APPS_API_TOKEN_DEV_PLAYER` must hold the deployment token for **this exact** Static Web App. Restrict write access to the repo and rotate the token if it is exposed. Never put the token in a file, commit, build variable or browser bundle. `public/staticwebapp.config.json` is copied into `dist` for SPA route fallback.

The deployed `public/config.json` currently selects `mode: local` and `demo: true`, so this is a public demo deploy. API-backed authentication and signed-in Story playback have separate acceptance gates. After the first `dev` run, verify the named deploy job, inspect the live URL and exercise both child paths before reporting runtime acceptance.
