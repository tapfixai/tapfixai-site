TapFix AI Netlify Backend — Prompt Updated

This version updates the proofreading/fix prompt.

Changed behavior:
- Fixes spelling, typos, punctuation and obvious grammar mistakes only.
- Preserves original meaning, style, tone and context.
- Preserves slang, rude language, swear words and profanity.
- Does not censor or soften the text.
- Does not rewrite the text into polite, official or literary language.

Copy these files into tapfix-site and redeploy Netlify:

- package.json
- netlify.toml
- .gitignore
- netlify/functions/ai-proxy.js

Do not upload node_modules.
