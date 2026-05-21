TapFix AI Netlify Backend Files

Copy these files into your existing tapfix-site folder:

- package.json
- netlify.toml
- .gitignore
- netlify/functions/ai-proxy.js

Important:
Do not upload node_modules to Netlify.
Delete node_modules from tapfix-site before deploy if it exists.

Netlify Environment Variables:
Set these in Netlify UI only. Do not write real values inside project files.

- OPENAI_API_KEY
- TAPFIX_PROXY_SECRET
- MODEL
- MAX_TEXT_LENGTH

Endpoint after deploy:
https://tapfixai.app/.netlify/functions/ai-proxy

Open this endpoint in browser. If configured correctly, it returns JSON with ok:true.
