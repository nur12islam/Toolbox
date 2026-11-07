# Contributing

Thanks for helping improve ToolBox Online.

## Setup

Use Node.js 22 or newer, clone the repository, and run `npm ci` followed by `npm run dev`.
For the Background Remover, configure the Cloudflare secrets and KV binding described in
`CLOUDFLARE_SETUP.md`.

## Branches and commits

Create a focused branch from `main`. Use short, descriptive commit messages such as
`feat: add image watermark tool` or `fix: handle empty PDF files`. Keep pull requests focused and
explain user-visible changes and any configuration needs.

## Code style

Use TypeScript, format with Prettier, and keep each tool in its own file under `src/tools/`. Put
reusable browser helpers and pure logic in `src/core/`. Add new tool metadata and its lazy import to
`src/tools/registry.ts`. Add tests for pure logic. Label every input and icon-only button.

## Manual check list

- Test the normal path, invalid input, and empty state.
- Check keyboard use, focus visibility, and screen-reader labels.
- Check the desktop layout and a 390px-wide mobile viewport.
- Confirm the expected output downloads and opens correctly.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Confirm no secret or private test file is included in the change.

## Privacy

File processing must stay local unless the product clearly tells users what is sent, where it goes,
and why. Never log or store submitted files. Never commit API keys, `.dev.vars*`, or `.env*` files.
