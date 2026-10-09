# BK Crown Cam

PWA that puts a Burger King crown on someone's head. Point, snap, drag the crown onto the head if it missed, save.

Plain HTML + JS, no build step. Face placement uses the browser's native `FaceDetector` where available (Chrome on Android); elsewhere the crown starts top-center and you drag it.

## Run

```
bun run serve.ts   # or any static server in public/
```

## Deploy (Cloudflare Workers static assets)

```
npx wrangler deploy
```

Requires `wrangler login` first.
