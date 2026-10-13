# Oro launch video

The `OroLaunch` Remotion composition runs at 30 fps for 18.5 seconds. It includes a notification intro, an animated 3D iMessage conversation, three rotating gold phrases, and the Oro wordmark outro.

Run these commands from `my-video`.

Install dependencies:

```bash
npm ci
```

Open the preview:

```bash
npm run dev
```

Export a sharper 1080p MP4 with PNG intermediate frames and reduced compression:

```bash
npx remotion render src/index.ts OroLaunch out/oro-launch-1080p.mp4 --scale=1.5 --image-format=png --crf=16
```

The composition uses a 1280 × 720 layout; `--scale=1.5` exports at 1920 × 1080. Exported videos in `out` are ignored by Git.

Run static checks:

```bash
npm run lint
```
