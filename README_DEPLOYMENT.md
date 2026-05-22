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

TapFix AI requests are handled by the Railway API:

```text
https://api.tapfixai.app/tapfix/ai
```

The public site repository should stay static and should not contain OpenAI keys,
backend functions, or proxy code.

## GitHub Pages

Recommended GitHub Pages settings:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/root`
- Custom domain: `tapfixai.app`

The `.nojekyll` file is intentionally present so GitHub Pages serves files exactly as stored.
