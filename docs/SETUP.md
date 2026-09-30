# AllYouTuber — Telepítési és Üzemeltetési Útmutató (Setup Guide)

Ez a dokumentum lépésről lépésre bemutatja az AllYouTuber projekt helyi fejlesztői környezetének felállítását és éles üzembe állítását (pl. Render.com felületen).

---

## 1. Rendszerkövetelmények

- **Operációs rendszer**: Linux (Ubuntu 22.04+ ajánlott), macOS, Windows (WSL2 ajánlott).
- **Node.js**: `v20.x` LTS (minimum `v18.18.0`).
- **NPM**: `v10.x` vagy újabb.
- **PostgreSQL**: `v14` vagy újabb.
- **Git**: `v2.30+`.

---

## 2. Környezeti Változók (.env)

Hozd létre a `.env` fájlt a `.env.example` mintája alapján:

```bash
cp .env.example .env
```

### Szükséges változók leírása:

| Változó | Kötelező? | Leírás | Alapértelmezett / Példa |
|---|---|---|---|
| `PORT` | Nem | A szerver által használt HTTP port. | `3000` |
| `NODE_ENV` | Igen | Futási környezet (`development` vagy `production`). | `production` |
| `APP_URL` | Igen | Az alkalmazás publikus URL címe (QR kódokhoz és meghívókhoz). | `http://localhost:3000` |
| `DATABASE_URL` | Igen | PostgreSQL kapcsolati karakterlánc. | `postgresql://user:pass@localhost:5432/allyoutuber?schema=public` |
| `SESSION_SECRET` | Igen | Titkos kulcs a session cookie-k aláírásához (min. 32 karakter). | Generálj véletlenszerű kulcsot! |
| `ADMIN_BOOTSTRAP_TOKEN` | Igen | Rendszergazdai bejelentkezési és bootstrap token. | Generálj erős tokent! |
| `YOUTUBE_API_KEY` | Nem | Google YouTube Data API v3 kulcs. Ha üres, az oEmbed fallback lép életbe. | `""` |
| `REDIS_URL` | Nem | Opcionális Redis szerver URL több szerverpéldány közötti terheléselosztáshoz. | `""` |

---

## 3. Lépésről-lépésre Telepítés (Local Development)

```bash
# 1. Repository klónozása
git clone https://github.com/zsirafmix/allyoutuber.git
cd allyoutuber

# 2. Függőségek telepítése
npm install

# 3. PostgreSQL adatbázis beállítása és Prisma migráció
npx prisma db push
npx prisma generate

# 4. Tesztek futtatása a működés ellenőrzésére
npm test

# 5. Fejlesztői szerver indítása
npm run dev
```

A szerver elindul a `http://localhost:3000` címen.

---

## 4. Éles Fordítás és Indítás (Production Build)

```bash
# 1. Prisma kliens és Next.js optimalizált build készítése
npm run build

# 2. Éles Node.js szerver indítása
npm start
```

---

## 5. Render.com Éles Üzembe Állítás (Deployment)

A projekt a gyökérben található `render.yaml` segítségével automatikusan konfigurálható a Render felületén:

1. Hozz létre egy új **Web Service**-t a Renderen a GitHub repó összekapcsolásával.
2. **Environment**: `Node`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - Csatlakoztasd a Render által biztosított ingyenes vagy fizetős **PostgreSQL** adatbázist (`DATABASE_URL`).
   - Add meg a `SESSION_SECRET`, `ADMIN_BOOTSTRAP_TOKEN`, `APP_URL` értékeket.
