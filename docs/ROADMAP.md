# AllYouTuber — Fejlesztési Útiterv és Feladatlista (Roadmap & TODO)

Ez a dokumentum a jövőbeli feladatokat, prioritásokat, függőségeket és ellenőrzési lépéseket tartalmazza.

---

## 1. Prioritási Szintek és Feladatok

### [P0 - Kritikus / Immediate]

#### 1.1 Éles Smart TV Valós Eszközös Tesztelés (Hardware Validation)
- **Prioritás**: P0
- **Függőségek**: Render.com deployment, fizikai LG/Samsung TV.
- **Várható eredmény**: A `/tv` felület távirányítóval zökkenőmentesen párosítható és elindítható valós LG webOS és Samsung Tizen tévéken.
- **Érintett fájlok**: `src/components/tv/TvPlayer.tsx`, `src/components/tv/TvPairingScreen.tsx`.
- **Ellenőrzés módja**: Távirányítóval végigvinni a párosítást és a lejátszást a fizikai készüléken.

---

### [P1 - Magas / High]

#### 1.2 YouTube Beágyazási Hiba (Error 100/101/150) Automatikus Átugrása
- **Prioritás**: P1
- **Függőségek**: `src/server/socket.ts`, `src/components/tv/TvPlayer.tsx`, `src/app/room/[slug]/page.tsx`.
- **Várható eredmény**: Ha egy videó letiltott vagy nem beágyazható, a lejátszó 3 másodperces visszaszámlálás után magától a következő számra lép ahelyett, hogy elakadna a szoba.
- **Érintett fájlok**: `src/components/tv/TvPlayer.tsx`, `src/server/socket.ts`.
- **Ellenőrzés módja**: Letiltott YouTube ID beküldése és automatikus átlépés ellenőrzése.

#### 1.3 Mobil Távirányító Virtuális D-Pad Gombok a TV Vezérléshez
- **Prioritás**: P1
- **Függőségek**: `TvManagerModal.tsx`, `src/server/socket.ts`.
- **Várható eredmény**: A telefonos TV managerből lehessen a TV hangerejét szabályozni vagy némítani WebSocket parancsokkal (`tv:set_volume`).
- **Érintett fájlok**: `src/components/TvManagerModal.tsx`, `src/server/socket.ts`, `src/components/tv/TvPlayer.tsx`.
- **Ellenőrzés módja**: Hangerőállítás mobilon, és hangerőváltozás a TV felületen.

---

### [P2 - Közepes / Medium]

#### 1.4 Több Szerverpéldány Horizontális Skálázása (Redis Adapter)
- **Prioritás**: P2
- **Függőségek**: `@socket.io/redis-adapter`, `ioredis`.
- **Várható eredmény**: Több Node.js konténer párhuzamos futtatása esetén a Socket.IO szobák állapota szinkronban maradjon.
- **Érintett fájlok**: `src/server/socket.ts`, `render.yaml`.
- **Ellenőrzés módja**: Két külön porton futó szerver összekapcsolása Redis-en keresztül.

---

### [P3 - Kényelmi / Low]

#### 1.5 Sötét / Világos / Neon Téma Választó
- **Prioritás**: P3
- **Függőségek**: Tailwind CSS téma konfiguráció.
- **Várható eredmény**: A felhasználók választhassanak a Classic Neon, Dark Cyberpunk és Minimal témák között.
- **Érintett fájlok**: `tailwind.config.js`, `src/app/globals.css`.
- **Ellenőrzés módja**: Témaváltás a beállítások menüben.
