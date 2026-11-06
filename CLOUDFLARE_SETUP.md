# Cloudflare Pages setup

The Background Remover uses a Pages Function at `/api/remove-background` to call remove.bg. The remove.bg API key is read only by the Function; it must not be added to frontend code, `VITE_*` variables, or a committed file.

## Deploy on Cloudflare Pages

1. Create a Pages project connected to this GitHub repository. Use `npm run build` for the build command and `dist` for the build output directory. Keep the project root at the repository root so Cloudflare detects the top-level `functions/` directory.
2. In the Pages project, open **Settings → Variables and Secrets** and add `REMOVEBG_API_KEY`. Paste the API key from your remove.bg account and mark it as an encrypted secret for Production. Add a Preview secret too if you want the feature on preview deployments.
3. Deploy or redeploy the project after adding the secret. The remove.bg-backed tool works on the Cloudflare Pages domain; GitHub Pages cannot run Pages Functions.

The `wrangler.jsonc` file sets the Pages output directory to `dist`. If your Cloudflare Pages project uses a different name, change `name` here to match before using Wrangler-based deployment.

## API usage and privacy

When a visitor clicks **Remove background**, their selected image is sent to this Cloudflare Function and forwarded to remove.bg. The Function returns the processed PNG and does not store the image. API requests may consume remove.bg credits; set an appropriate usage or billing limit in the remove.bg account before making the site public.

For local Pages Function development, put `REMOVEBG_API_KEY="your-key"` in `.dev.vars` (never commit that file) and run the project with Wrangler Pages dev.

