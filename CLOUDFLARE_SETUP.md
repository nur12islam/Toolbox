# Cloudflare Pages setup

The Background Remover uses a Pages Function at `/api/remove-background` to call remove.bg. The remove.bg API key is read only by the Function; it must not be added to frontend code, `VITE_*` variables, or a committed file.

## Deploy on Cloudflare Pages

1. Create a Pages project connected to this GitHub repository. Use `npm run build` for the build command and `dist` for the build output directory. Keep the project root at the repository root so Cloudflare detects the top-level `functions/` directory. With a Git-connected Pages project, Cloudflare builds and deploys on pushes to the production branch.
2. Do not use the Worker command `npx wrangler deploy`. If your build setup requires a custom deploy command, use `npx wrangler pages deploy dist --project-name toolbox-online` (replace the project name if needed).
3. In **Settings → Variables and Secrets**, add encrypted Production secrets named `REMOVEBG_API_KEY` and `TURNSTILE_SECRET_KEY`. Add both to Preview too if you want background removal on preview URLs.
4. Create a Turnstile widget in Cloudflare, allow your Pages hostname, then set the public build variable `VITE_TURNSTILE_SITE_KEY` to its site key for Production and Preview.
5. Create a Workers KV namespace and bind it to the Pages project as `RATE_LIMIT_KV` in **Settings → Bindings → Add → KV namespace**. The Function fails closed when this binding or either Turnstile key is absent. KV enforces a per-IP limit of five requests per minute; for stronger protection, also configure a Cloudflare WAF rate limiting rule for `/api/remove-background`.
6. Deploy or redeploy the project after setting these values. The remove.bg-backed tool works on the Cloudflare Pages domain; GitHub Pages cannot run Pages Functions.

The `wrangler.jsonc` file sets the Pages output directory to `dist`. If your Cloudflare Pages project uses a different name, change `name` here to match before using Wrangler-based deployment.

## API usage and privacy

When a visitor clicks **Remove background**, their selected image is sent to this Cloudflare Function and forwarded to remove.bg. The Function returns the processed PNG and does not store the image. API requests may consume remove.bg credits; set an appropriate usage or billing limit in the remove.bg account before making the site public.

For local Pages Function development, put `REMOVEBG_API_KEY` and `TURNSTILE_SECRET_KEY` in `.dev.vars`; put `VITE_TURNSTILE_SITE_KEY` in `.env.local`. Both files are ignored; never commit them. Bind a local KV namespace with Wrangler and run the project with Wrangler Pages dev. Use a Turnstile test widget for local development.

Set an appropriate spending or usage cap in the remove.bg account before making the site public. Turnstile and rate limiting reduce automated abuse but do not eliminate remove.bg credit usage.
