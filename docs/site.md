# Landing site

- Lives in `site/`: static HTML/CSS/JS in the app's pixel style, plus `site/play/` (the browser build, generated, git-ignored).
- Served by Cloudflare Workers static assets (`wrangler.jsonc`) at https://deskfisch.codepawl.com. The custom domain and certificate are managed by Wrangler because `codepawl.com` is a Cloudflare zone on the same account.
- Downloads are read live from the latest GitHub release, so publishing a release updates the buttons without a redeploy. The `/play/` demo only changes when the site is redeployed.

## Deploy by hand

```bash
pnpm site:deploy
```

## Deploy from Actions

The `site` job in `release.yml` runs after the web build when the repository secret `CLOUDFLARE_API_TOKEN` exists (create one at dash.cloudflare.com → API Tokens with *Workers Scripts: Edit* and *Zone: DNS: Edit* on codepawl.com). Without the secret the job skips and prints why.
