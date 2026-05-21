# TapFix public site deployment

This repository is safe to serve as a static site.

## Static public files

- `index.html`
- `privacy-policy.html`
- `accessibility-disclosure.html`
- `images/*`
- `downloads/*`
- `install-tapfix.sh`

These can be served from GitHub Pages.

## Backend

The old Netlify Function proxy is still present for rollback:

- `netlify/functions/ai-proxy.js`
- `netlify.toml`

Do not delete it until the Railway API is deployed and TapFix builds are switched to:

```text
VITE_TAPFIX_API_URL=https://YOUR-RAILWAY-DOMAIN.up.railway.app/tapfix/ai
```

## GitHub Pages

Recommended GitHub Pages settings:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/root`
- Custom domain: `tapfixai.app`

The `.nojekyll` file is intentionally present so GitHub Pages serves files exactly as stored.
