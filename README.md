# Pulse

Pulse is a local-first social platform: feed + stories, private chats, and community servers in one app.

**Repo:** https://github.com/PopcornParty/Pulse

## Open the app

1. Download this repository.
2. Open a terminal in the project folder.
3. Run:

```bash
python3 -m http.server 4173 --directory dist
```

4. Visit http://localhost:4173

## Demo login

- Username: `you`
- Password: `pulse123`

## Owner desk

In the sidebar open **Owner desk** and enter `FERRARI1`.

## Publish with GitHub Pages

1. Repo **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / folder: `/docs`
4. Save. After a minute the app will be at:

https://popcornparty.github.io/Pulse/

## Project layout

- `src/` — app source
- `dist/` — bundled app for local running
- `docs/` — same bundle, used by GitHub Pages
