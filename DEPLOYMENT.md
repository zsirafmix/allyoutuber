# AllYouTuber — Deployment Guide (Render.com)

## Quick Deploy on Render

AllYouTuber includes a native `render.yaml` blueprint for one-click deployment of both the Web Service and PostgreSQL database.

### Prerequisites
1. A [Render.com](https://render.com) account.
2. Fork or push this repository to your GitHub account: `https://github.com/zsirafmix/allyoutuber.git`.
3. Optional: YouTube Data API v3 key from Google Cloud Console.

### Steps on Render
1. Navigate to the **Blueprints** tab on Render Dashboard.
2. Click **New Blueprint Instance**.
3. Select your repository (`allyoutuber`).
4. Render will detect `render.yaml` and provision:
   - A PostgreSQL database instance (`allyoutuber-db`).
   - A Node.js web service (`allyoutuber`).
5. Configure Environment Variables:
   - `DATABASE_URL`: Automatically populated from `allyoutuber-db`.
   - `SESSION_SECRET`: Auto-generated 32-character string.
   - `ADMIN_BOOTSTRAP_TOKEN`: Auto-generated secret token for initial `/admin` access.
   - `YOUTUBE_API_KEY`: Paste your YouTube Data API v3 key (or leave empty to use oEmbed fallback).
   - `APP_URL`: Set to your Render domain (e.g., `https://allyoutuber.onrender.com`).
6. Click **Apply**.
7. The build pipeline will execute:
   ```bash
   npm install && npm run build
   ```
   and start the service via:
   ```bash
   npm run start
   ```

### Health Check
The service exposes `/api/health` returning `200 OK` and database connectivity status.
