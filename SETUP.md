# Bashabari — Local Setup & Deployment Guide

This guide covers running the **frontend + self-hosted Supabase backend**
on your own PC (development) and on a VPS (production).

> ℹ️ The Lovable preview always uses Lovable Cloud. The steps below are
> only needed when you want to run everything yourself.

---

## 1. Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| **Docker** + Docker Compose v2 | 24+ | Runs the backend stack |
| **Node.js** | 20+ | Runs the frontend |
| **Bun** *(or npm)* | 1.1+ | Faster installs |
| **Git** | any | Clone the repo |
| **OpenSSL** | any | Generate JWT secrets |

Verify:

```bash
docker --version && docker compose version
node --version && bun --version
```

---

## 2. Clone & install

```bash
git clone <your-fork-url> bashabari
cd bashabari
bun install        # or: npm install
```

---

## 3. Start the backend (Docker)

```bash
cd backend
cp .env.example .env
```

### 3.1 Generate JWT secret + API keys

The frontend authenticates against the backend with a JWT signed by
`JWT_SECRET`. The `ANON_KEY` and `SERVICE_ROLE_KEY` are themselves JWTs
signed with that same secret.

```bash
# 1) JWT secret
openssl rand -base64 48
# Paste the result as JWT_SECRET in backend/.env
```

Then generate the two API keys with the official helper:
<https://supabase.com/docs/guides/self-hosting/docker#api-keys>
(or any JWT tool — payloads are `{ "role": "anon" }` and `{ "role": "service_role" }`,
both signed HS256 with your `JWT_SECRET`).

Paste them as `ANON_KEY` and `SERVICE_ROLE_KEY` in `backend/.env`.

### 3.2 Boot the stack

```bash
docker compose up -d
docker compose ps           # all services should be "running"
docker compose logs -f db   # watch schema apply
```

You should now have:

| Service     | URL                     |
|-------------|-------------------------|
| API gateway | http://localhost:8000   |
| Studio (admin UI) | http://localhost:3000 |
| Postgres    | `localhost:5432`        |

> 🛑 If the DB starts but the schema doesn't load, the data volume already
> existed. Run `./scripts/reset.sh` to wipe and reinitialise.

---

## 4. Point the frontend at your local backend

Edit the project root `.env` (create it if missing):

```env
VITE_SUPABASE_URL="http://localhost:8000"
VITE_SUPABASE_PUBLISHABLE_KEY="<paste your ANON_KEY>"
VITE_SUPABASE_PROJECT_ID="local"
```

> The file `src/integrations/supabase/client.ts` reads these variables.
> No code changes are needed — it works against any Supabase-compatible API.

---

## 5. Run the frontend

```bash
cd ..              # back to project root
bun run dev
```

Open <http://localhost:5173>. Sign up with email + password — a profile row
is created automatically by the `on_auth_user_created` trigger. Pick your
role (tenant / landlord) on the onboarding screen — that inserts into
`user_roles`.

---

## 6. Enable Google sign-in (optional)

1. Create OAuth credentials at <https://console.cloud.google.com/apis/credentials>.
2. **Authorized redirect URI:** `http://localhost:8000/auth/v1/callback`
3. Paste the client ID + secret into `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
4. Restart auth: `docker compose restart auth`

---

## 7. Deploy to a VPS

Tested on Ubuntu 22.04 with a 2 vCPU / 4 GB droplet.

### 7.1 Server prep

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# Install Caddy (auto-HTTPS reverse proxy)
sudo apt install -y caddy
```

### 7.2 Copy the project to the server

```bash
scp -r ./bashabari user@your-vps:/opt/
ssh user@your-vps
cd /opt/bashabari/backend
```

### 7.3 Edit `backend/.env` for production

```env
API_EXTERNAL_URL=https://api.yourdomain.com
SITE_URL=https://app.yourdomain.com
ENABLE_EMAIL_AUTOCONFIRM=false       # require real email confirmation
DASHBOARD_PASSWORD=<long-random>
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/v1/callback
```

Then:

```bash
docker compose up -d
```

### 7.4 Build the frontend

```bash
cd /opt/bashabari
echo 'VITE_SUPABASE_URL="https://api.yourdomain.com"'   >  .env
echo 'VITE_SUPABASE_PUBLISHABLE_KEY="<ANON_KEY>"'       >> .env
echo 'VITE_SUPABASE_PROJECT_ID="prod"'                  >> .env

bun install
bun run build
# Output: ./dist
```

### 7.5 Caddyfile (frontend + API on HTTPS)

`/etc/caddy/Caddyfile`:

```caddy
app.yourdomain.com {
  root * /opt/bashabari/dist
  encode gzip
  try_files {path} /index.html       # SPA fallback
  file_server
}

api.yourdomain.com {
  reverse_proxy localhost:8000
}
```

```bash
sudo systemctl reload caddy
```

Done — open `https://app.yourdomain.com`.

---

## 8. Common operations

| Task | Command |
|------|---------|
| View logs | `docker compose logs -f <service>` |
| Restart auth | `docker compose restart auth` |
| Apply ad-hoc SQL | `./backend/scripts/migrate.sh change.sql` |
| Wipe DB | `./backend/scripts/reset.sh` *(destroys data)* |
| Backup DB | `docker compose exec db pg_dump -U postgres postgres > backup.sql` |
| Restore DB | `cat backup.sql \| docker compose exec -T db psql -U postgres postgres` |

---

## 9. Troubleshooting

- **`fetch failed` in the browser** → `VITE_SUPABASE_URL` is wrong or the
  backend is not reachable. Curl `http://localhost:8000/auth/v1/health`.
- **`JWSError JWSInvalidSignature`** → `ANON_KEY` was signed with a different
  `JWT_SECRET`. Regenerate both.
- **`new row violates row-level security policy`** → the user is signed in
  but trying to insert a row whose `user_id` ≠ `auth.uid()`. Check the
  insert payload.
- **Realtime chat not updating** → confirm `messages` is in the
  `supabase_realtime` publication: `\dRp+ supabase_realtime` from psql.
- **Google sign-in 400** → redirect URI in Google Cloud must EXACTLY match
  `GOOGLE_REDIRECT_URI` in `.env` (including scheme and trailing slash).

---

## 10. Project layout recap

```
bashabari/
├── src/                      Frontend (React + Vite + Tailwind)
│   ├── contexts/AuthContext  Session, profile, role (heavily commented)
│   ├── integrations/supabase Auto-generated client
│   └── pages/                Tenant + Landlord screens
├── supabase/migrations/      Migrations applied to Lovable Cloud
├── backend/                  Self-hosted mirror (Docker)
│   ├── docker-compose.yml
│   ├── volumes/db/01-schema.sql
│   └── scripts/
└── SETUP.md                  ← this file
```
