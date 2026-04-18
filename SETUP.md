# Aristotle — Setup Guide

This guide walks through everything required to get the app running from scratch.
Total time: approximately 20 minutes.

---

## 1. Firebase project

1. Go to https://console.firebase.google.com and create a new project.
2. In the project dashboard, click **Add app** → **Web**. Register it and copy the config object.
3. Open `js/firebase.js` and replace the placeholder `firebaseConfig` with your values.

**Enable Authentication:**
- In Firebase Console → Authentication → Sign-in method → Enable **Google**.

**Enable Firestore:**
- Firebase Console → Firestore Database → Create database → Start in **production mode**.
- Add these rules under the Rules tab:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /units/{unitId}/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 2. Cloudflare Worker (API proxy)

The app calls Claude through a Cloudflare Worker so the API key never touches the browser.

1. Go to https://workers.cloudflare.com and create a free account.
2. Create a new Worker and paste the contents of `worker/proxy.js`.
3. In the Worker settings → **Variables** → add a secret: `ANTHROPIC_API_KEY` = your Anthropic key.
4. Under **Settings → Triggers**, note your Worker's URL (e.g. `https://aristotle-proxy.yourname.workers.dev`).
5. Open `js/api.js` and set `WORKER_URL` to that address.
6. In the Worker code, update `ALLOWED_ORIGIN` to your GitHub Pages URL (e.g. `https://yourusername.github.io`).

For local development, set `ALLOWED_ORIGIN = 'http://localhost:8080'` temporarily.

---

## 3. GitHub Pages deployment

1. Create a new GitHub repository (public).
2. Push the contents of this folder to the repository root.
3. In repository Settings → Pages → Source: **Deploy from branch** → `main` / `root`.
4. Your app will be live at `https://yourusername.github.io/repository-name`.

---

## 4. Local development

```bash
# From the aristotle/ directory
npx serve .
# or
python3 -m http.server 8080
```

Open `http://localhost:8080` in a browser. 

For Google Sign-In to work locally, add `localhost` to your Firebase project's 
Authorized domains: Firebase Console → Authentication → Settings → Authorized domains.

---

## 5. Anthropic API key

Get a key at https://console.anthropic.com. The app uses `claude-sonnet-4-6`.
At one generation per new user signup (~4,000 tokens), costs are minimal.
