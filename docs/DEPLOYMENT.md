# Deployment

Live game: https://hold-my-paw-mallika.scalerailabs-4179.chatgpt.site

Hosted with Sites in the connected workspace, with public visitor access. The GitHub source repository remains private.

The publishing checkout is `/Users/mallikasuri/dev/hold-my-paw-site`; its `.openai/hosting.json` retains the Site identity. The GitHub development checkout is `/Users/mallikasuri/dev/hold-my-paw`.

GitHub pushes do not automatically deploy. To publish an update, build and test the game, synchronize the source and build output into the publishing checkout while preserving its Site identity and Git metadata, and use the Sites source/package/save/deploy workflow. Reuse the existing Site; do not create a new one.

The host serves only `dist/`. No server, credentials, or database are needed. Player progress is local to each browser and origin; localhost saves do not transfer to the live site.
