# Self-hosting Standby

Standby is a static SPA. No backend, no database, no accounts. Self-hosting means serving a few hundred KB of HTML / JS / CSS from any web server — Docker is the easiest path, but you can also `npm run build` and copy `dist/` to an existing webserver if that's your shop's preference.

## Quick start — Docker

```sh
git clone https://github.com/ShannonH/standby.git
cd standby
docker compose up -d
```

Visit http://localhost:8080. To use a different port:

```sh
PORT=9000 docker compose up -d
```

To pull the pre-built image from GitHub Container Registry once a release tag is cut:

```sh
docker pull ghcr.io/shannonh/standby:latest
docker run -d -p 8080:80 ghcr.io/shannonh/standby:latest
```

The image is multi-architecture (linux/amd64, linux/arm64), so M-series Macs and Raspberry Pi-class servers work without extra steps.

## What's in the image

- **Build stage:** `node:20-alpine`, runs `npm ci` and `npm run build`.
- **Runtime stage:** `nginx:alpine`, ~25 MB, serves the built SPA with:
  - 1-year immutable cache headers on hashed `/assets/` files and woff/woff2 fonts
  - `no-cache` on `index.html`, the service worker, and the manifest (so deploys land immediately)
  - SPA-fallback rewrite to `index.html` so deep links work
  - gzip compression on text-y MIME types
- **No volumes, no environment-dependent runtime state.** The whole image is reproducible from source.

See `Dockerfile` and `nginx.conf` at the repo root for the actual config.

## Configuring the base path

By default the image serves the app at the root URL (`/`). If you're deploying Standby under a subpath — say `https://theatre.example.edu/standby/` — rebuild with `VITE_BASE_PATH`:

```sh
docker build --build-arg VITE_BASE_PATH=/standby/ -t standby:custom .
```

Or in `docker-compose.yml`:

```yaml
services:
  standby:
    build:
      context: .
      args:
        VITE_BASE_PATH: /standby/
```

The base path has to be baked in at build time because Vite uses it to rewrite asset URLs in the generated HTML.

## What you don't need to worry about

- **A database.** Each user's show data lives in their browser's IndexedDB. Switching browsers, switching devices, or reinstalling means re-importing the JSON.
- **User accounts.** There aren't any. There's nothing to provision per-user, no SSO to wire up, no FERPA conversation to have with IT.
- **Backups of user data.** Users are responsible for their own — Standby exposes a JSON export, an auto-backup-to-cloud-folder feature (File System Access API), and a publish-to-shared-folder workflow for crew-facing PDFs. The server itself stores nothing.
- **TLS termination.** Standby ships HTTP only inside the container; put it behind whatever reverse proxy your campus already uses (nginx, Apache, Caddy, Traefik, Cloudflare Tunnel). PWA service-worker installation requires HTTPS in production.

## Putting it behind a reverse proxy

Example nginx snippet for serving Standby at `https://theatre.example.edu/`:

```nginx
server {
    listen 443 ssl http2;
    server_name theatre.example.edu;
    # ... your TLS config ...

    location / {
        proxy_pass http://standby-container:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Replace `standby-container` with whatever address your reverse proxy uses to reach the container. If you're hosting Standby on the same machine, `localhost:8080` works.

## Updating

```sh
cd standby
git pull
docker compose up -d --build
```

The image rebuilds, the container restarts, and users on the next page load pick up the new version automatically (because the service worker checks for updates on every load and `index.html` is served with `no-cache`).

## What stage managers see when you host it

- They visit your URL once and "Install Standby" appears in their browser's address bar (PWA install prompt).
- After installing, Standby launches like a regular app — Dock icon on macOS, Start Menu on Windows.
- Their show data is local to *their* browser/device. Two students using the same university-hosted instance can't see each other's shows. There's no sharing-by-URL — just JSON export/import or the publish-folder feature for crew distribution.

## When to *not* self-host

- You're an individual SM. Use the public site at https://shannonh.github.io/standby/ — it's the same code, zero setup, and your data is still 100% local to your browser. Self-hosting buys you nothing extra in that case.
- Your IT department won't host static sites. Use the public site.

## Questions

Open a [Question or discussion](https://github.com/ShannonH/standby/discussions) thread on the repo, or email shannon.harris@blackboard.com.
