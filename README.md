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

Deploys go to **Firebase Hosting**, and they only ever happen when you ask for
them. Nothing is published on push.

To deploy: GitHub → **Actions** → **Deploy to Firebase Hosting** → **Run
workflow**. Pick the branch to publish, and a channel:

- `live` (the default) — production, at <https://shootstats-f3861.web.app>
- any other name, e.g. `test` — a temporary preview URL that expires after 7
  days. The Action prints the URL in its run summary.

Because the site lives in the same Firebase project as the database,
`shootstats-f3861.web.app` and `shootstats-f3861.firebaseapp.com` are already
authorized domains in Firebase Auth, so sign-in works without extra setup.
Preview channels get their own subdomain and need that domain added under
Firebase Console → Authentication → Settings → Authorized domains before
sign-in will work there.

`firebase.json` holds the deploy config: publish the repo root, never cache, and
send the same security headers the site has always sent. `.firebaserc` pins the
Firebase project.

### One-time setup

The Action authenticates as a service account. Set it up once:

1. **Enable Hosting.** Firebase Console → your project → Build → Hosting → *Get
   started*. Click through the CLI instructions — you do not need to run them,
   the Action does that part.
2. **Create the service account.** Google Cloud Console → *IAM & Admin* →
   *Service Accounts* → *Create service account*, for project
   `shootstats-f3861`. Name it something like `github-deploy`.
3. **Grant it the `Firebase Hosting Admin` role.** That is all a `live` deploy
   needs. If you also want preview channels, add `Firebase Authentication
   Admin`, `Cloud Run Viewer`, and `Service Usage Consumer`.
4. **Download a key.** On the new account: *Keys* → *Add key* → *Create new key*
   → **JSON**. A file downloads.
5. **Put it in GitHub.** Repo → *Settings* → *Secrets and variables* → *Actions*
   → *New repository secret*. Name it exactly `FIREBASE_SERVICE_ACCOUNT` and
   paste the entire contents of the JSON file as the value.

That JSON key is a real credential — it is the one secret in this project that
matters. Don't commit it; the repo only ever sees it through the GitHub secret.

### Deploying from your own machine instead

If you'd rather not use the Action:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting
```

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
firebase.json   Firebase Hosting deploy config
.firebaserc     which Firebase project to deploy to
netlify.toml    old Netlify deploy config (unused)
```
