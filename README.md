# Shootstats

Shooting-session statistics tracker. A single self-contained `index.html` —
vanilla JS, no build step, no dependencies to install. Firebase (Auth +
Realtime Database) is loaded from Google's CDN at runtime.

## Run it locally

On Linux/macOS:

```bash
./dev.sh          # http://localhost:8000
./dev.sh 3000     # or pick a port
```

On Windows, use `dev.cmd` (double-clicking it in Explorer works too):

```
dev.cmd
dev.cmd 3000
```

It serves with Python if you have it and falls back to Node's `http-server`
otherwise.

Then edit `index.html` and refresh the browser. That's the whole loop.

Don't open `index.html` as a `file://` URL — the page gets an opaque origin and
Firebase Auth won't work. `http://localhost` is an authorized domain in Firebase
Auth by default, so signing in locally behaves the same as in production.

Both local and deployed builds talk to the **same** Firebase project
(`shootstats-f3861`), so anything you save while testing is real data. Use a
throwaway account for experiments.

## Deploy

Pushing to `main` deploys to production. Netlify watches this repo:

```bash
git add -A
git commit -m "what changed"
git push
```

Open a branch or PR instead and Netlify builds a **deploy preview** on its own
URL — a way to try a change on a phone before it goes live:

```bash
git checkout -b try-something
git push -u origin try-something
```

For a preview URL to be able to sign in, add its domain under
Firebase Console → Authentication → Settings → Authorized domains.
`*.netlify.app` deploy previews get a per-deploy subdomain, so it's simplest to
add your site's stable domain and test sign-in there.

`netlify.toml` holds the deploy config: publish the repo root, no build command,
never cache `index.html`.

## About the Firebase config in `index.html`

The `apiKey` and friends near the top of the file are **not** secrets — Firebase
web config ships to every visitor's browser by design, and this repo being public
changes nothing about that. What actually protects the data is the Realtime
Database security rules in the Firebase Console. Keep those tight.

App Check (reCAPTCHA Enterprise) is wired up but disabled — see the
`APP_CHECK_ENABLED` comment in `index.html` for why.

## Layout

```
index.html      the entire app: styles, markup, logic
dev.sh          local server (Linux/macOS)
dev.cmd         local server (Windows)
netlify.toml    Netlify deploy config
```
