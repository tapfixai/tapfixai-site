TapFix AI Netlify Backend — Style Fixed

This version separates proofreading and writing style behavior.

Behavior:
- Neutral style = only fix spelling, punctuation, typos and obvious grammar mistakes.
- Polite / Professional / Friendly / Short / Emoji = apply selected writing style.
- Profanity is not censored automatically.
- Translation preserves slang, tone and profanity.

Copy these files into tapfix-site and redeploy Netlify:

- package.json
- netlify.toml
- .gitignore
- netlify/functions/ai-proxy.js

Do not upload node_modules.
