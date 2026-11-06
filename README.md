# ToolBox Online 🧰

A free, open-source collection of practical browser tools for students, creators, and everyday work. Built with React, TypeScript, Vite, and Tailwind CSS.

## Privacy first
- Images and documents are processed in your browser; this app does not upload them to a server.
- No account is required.
- QR content is generated locally.
- Don't use browser tools as a substitute for official requirements when preparing identity or exam documents.

## Tools
- **Photo & Signature Fixer** — resize an image to custom pixel dimensions, set a background, and export PNG/JPEG.
- **Image Studio** — resize and compress images, with a quality control.
- **Image to PDF** — combine selected images into a downloadable PDF.
- **QR Studio** — generate downloadable QR codes from text or URLs.
- **Favicon Maker** — export a simple favicon-sized PNG from text/emoji.
- **Color Lab** — inspect a color and copy HEX/RGB/HSL values.
- **Gradient Lab** — create and copy CSS linear gradients.
- Additional routes are listed as Coming Soon until implemented.

## Development
Requires Node.js 20+ recommended.

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Deploy to GitHub Pages
The Vite base path is configured for the repository name when running in GitHub Actions. Enable **Settings → Pages → GitHub Actions** and add a workflow that installs dependencies, runs `npm run build`, and uploads `dist`.

## Contributing
Issues and pull requests are welcome. Please keep file processing local, add accessible labels, and include a short manual test checklist for new tools.

## License
MIT — see [LICENSE](./LICENSE).
