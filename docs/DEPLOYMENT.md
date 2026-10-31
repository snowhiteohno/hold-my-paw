# Deployment

Live game: https://hold-my-paw.vercel.app

Hosted on Vercel in `mallikasuri-8851/hold-my-paw`. The production URL is public; the GitHub source repository remains private.

## Publish an update

From the project root, run:

```sh
pnpm test
pnpm build
pnpm dlx vercel@65.8.0 deploy --prod --scope mallikasuri-8851
```

Sign in with `pnpm dlx vercel@65.8.0 login` if needed. The local `.vercel/` project link is ignored by Git. `vercel.json` configures Vite, `pnpm build`, and the `dist` output directory.

GitHub auto-deploy is not connected yet: Vercel requires a GitHub login connection before it can link `snowhiteohno/hold-my-paw`. After adding that connection in Vercel account settings, run `pnpm dlx vercel@65.8.0 git connect --scope mallikasuri-8851` and verify the repository and production branch (`main`). Until then, publish updates with the command above.

The host serves only static files. No server, credentials, or database are needed. Player progress is local to each browser and origin; localhost and earlier hosting saves do not transfer to this URL.
