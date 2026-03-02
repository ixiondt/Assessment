# A.S.S. — Server Deployment Guide

## Requirements

- **Node.js** 18.17+ (LTS 20.x or 22.x recommended)
- **npm** 9+ (ships with Node.js)
- **Git**

No other system dependencies are needed. SQLite is bundled by Prisma.

---

## 1. Clone the repository

```bash
git clone <your-repo-url> ass
cd ass
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment

Create a `.env` file (or copy the existing one):

```bash
cp .env.example .env   # or create manually
```

Set the database path. For a server, use an absolute path so the DB is stored in a predictable location:

```env
DATABASE_URL="file:/var/lib/ass/data.db"
```

Make sure the directory exists:

```bash
sudo mkdir -p /var/lib/ass
sudo chown $USER:$USER /var/lib/ass
```

> Or keep the default `file:./dev.db` to store the database in the `prisma/` folder.

## 4. Set up the database

Run migrations to create the database schema:

```bash
npx prisma migrate deploy
```

Seed the checklist data:

```bash
npm run seed
```

## 5. Build the application

```bash
npm run build
```

## 6. Start the server

```bash
npm run start
```

By default Next.js listens on **port 3000**. To change it:

```bash
PORT=8080 npm run start
```

The app is now running at `http://your-server-ip:3000`.

---

## Running as a systemd service (Linux)

Create `/etc/systemd/system/ass.service`:

```ini
[Unit]
Description=Automated Site Surveyor
After=network.target

[Service]
Type=simple
User=ass
Group=ass
WorkingDirectory=/opt/ass
ExecStart=/usr/bin/node node_modules/.bin/next start -p 3000
Restart=on-failure
Environment=NODE_ENV=production
Environment=DATABASE_URL=file:/var/lib/ass/data.db

[Install]
WantedBy=multi-user.target
```

Then enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable ass
sudo systemctl start ass
```

Check status:

```bash
sudo systemctl status ass
```

---

## Reverse proxy (optional)

To serve over HTTPS, put Nginx or Caddy in front of the app.

**Nginx example** (`/etc/nginx/sites-available/ass`):

```nginx
server {
    listen 80;
    server_name survey.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
```

Then use Certbot for HTTPS:

```bash
sudo certbot --nginx -d survey.example.com
```

---

## Updating

```bash
cd /opt/ass
git pull
npm install
npx prisma migrate deploy
npm run build
sudo systemctl restart ass
```

---

## Quick reference

| Command | Purpose |
|---|---|
| `npm install` | Install dependencies |
| `npx prisma migrate deploy` | Apply database migrations |
| `npm run seed` | Seed checklist data |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run dev` | Start dev server (not for production) |
