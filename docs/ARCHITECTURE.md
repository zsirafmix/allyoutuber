# AllYouTuber — Rendszerarchitektúra és Működési Terv

Ez a dokumentum részletesen bemutatja az **AllYouTuber** architektúráját, moduljait, adatfolyamait, adatbázis sémáit és Socket.IO protokolljait.

---

## 1. Rendszerarchitektúra Áttekintés

Az AllYouTuber egy hibrid **Next.js 14 App Router** és **Socket.IO Node.js** szerverre épül, amely egyetlen folyamatként fut. A perzisztens adatokat **PostgreSQL** tárolja **Prisma ORM** rétegen keresztül, míg a gyors szobakezelést és valós idejű szinkronizációt egy szerver oldali in-memory állapotgép biztosítja.

```mermaid
graph TD
    subgraph Clients["Kliensek"]
        BrowserMobile["📱 Mobil Böngésző (Irányítás, Beküldés, Chat)"]
        BrowserDesktop["💻 Asztali PC (Irányítás, DJ, Admin)"]
        SmartTV["📺 Smart TV (/tv) (Read-only Player, OLED Guard)"]
    end

    subgraph AppServer["AllYouTuber Alkalmazásszerver (Node.js)"]
        HttpServer["HTTP / Express Szerver (server.ts)"]
        NextEngine["Next.js 14 App Router (SSR, UI, API Routes)"]
        SocketEngine["Socket.IO Szerver (src/server/socket.ts)"]
        
        subgraph Services["Belső Szolgáltatások"]
            RoomState["Szoba és Lejátszás Állapotgép (Master Clock)"]
            DjEngine["Auto-DJ Motor (10 stílus, 2500+ track)"]
            TvService["TV Párosítási és Munkamenet Kezelő (src/lib/tv.ts)"]
            YtService["YouTube Metaadat & Validáció (src/lib/youtube.ts)"]
            AuthService["Session & Anonim Felhasználó Kezelő (src/lib/session.ts)"]
        end
    end

    subgraph DataStorage["Adattárolás"]
        PostgresDB[("🗄️ PostgreSQL Adatbázis (Prisma ORM)")]
    end

    subgraph ExternalServices["Külső Szolgáltatások"]
        YouTubeAPI["▶️ YouTube Data API v3 & oEmbed"]
        GeoIP["🌐 IP Geolocation API (ip-api.com)"]
    end

    BrowserMobile <-->|WebSocket: Full Duplex| SocketEngine
    BrowserDesktop <-->|WebSocket: Full Duplex| SocketEngine
    BrowserMobile <-->|HTTP REST: Auth, TV Claim, Admin| NextEngine
    BrowserDesktop <-->|HTTP REST: Auth, TV Claim, Admin| NextEngine
    SmartTV <-->|WebSocket: Read-Only Events| SocketEngine
    SmartTV -->|YouTube Iframe Stream| YouTubeAPI

    HttpServer --> NextEngine
    HttpServer --> SocketEngine
    SocketEngine <--> RoomState
    RoomState <--> DjEngine
    SocketEngine <--> TvService
    NextEngine <--> TvService
    NextEngine <--> AuthService
    NextEngine <--> YtService
    YtService --> YouTubeAPI
    NextEngine --> GeoIP

    RoomState <--> PostgresDB
    TvService <--> PostgresDB
    AuthService <--> PostgresDB
```

---

## 2. Valós Idejű Lejátszás Szinkronizáció (Master Clock Engine)

A videók szinkronizációja központi szerveridő (Master Clock) alapján történik.

```mermaid
sequenceDiagram
    autonumber
    actor DJ as DJ / Felhasználó
    participant Socket as Socket.IO Szerver
    participant State as Room State Engine
    participant Client as Felhasználó Kliens
    participant TV as Smart TV Kliens

    DJ->>Socket: queue:add (YouTube URL)
    Socket->>State: Videó hozzáadása a várakozási sorhoz
    State->>State: Ha a lejátszó üres: elindítja az új számot
    State->>Socket: room:state_update (videoId, startedAt, duration, isPlaying: true)
    Socket-->>Client: room:state_update
    Socket-->>TV: room:state_update
    Socket-->>TV: tv:queue_preview (következő 3 szám)
    
    Note over Client,TV: Kliensek számolják: currentTime = (Date.now() - startedAt) / 1000
    Note over Client,TV: Ha eltérés > 1.5s -> seekTo(currentTime)
    
    loop 5 másodpercenként
        State->>State: Ellenőrzi, hogy letelt-e a szám ideje
        alt Szám véget ért
            State->>State: Következő szám léptetése (vagy Auto-DJ beválogatás)
            State->>Socket: room:state_update (új szám adatai)
            Socket-->>Client: room:state_update
            Socket-->>TV: room:state_update
        end
    end
```

---

## 3. Smart TV Párosítási és Kezelési Folyamat

```mermaid
sequenceDiagram
    autonumber
    actor User as Felhasználó (Mobil/PC)
    participant TV as Smart TV (/tv)
    participant Api as Next.js API (/api/tv/*)
    participant Socket as Socket.IO Szerver
    participant DB as PostgreSQL (TvSession)

    TV->>Api: POST /api/tv/pair/code (Új kód kérése)
    Api->>DB: TvSession létrehozása (hash, 6 karakter, WAITING, 10 perc lejárattal)
    Api-->>TV: token, rawCode (pl. 'A7K4Q2'), expiresAt
    TV->>TV: Megjeleníti a nagy kódot és a QR kódot a képernyőn
    TV->>Socket: tv:init { token, pairCode: 'A7K4Q2' }

    User->>User: Megnyitja a szobát mobilon, rákattint a "TV Kijelző" gombra
    User->>Api: POST /api/tv/pair/claim { code: 'A7K4Q2', roomId }
    Api->>DB: Kód ellenőrzés (SHA-256 hash), TvSession -> PAIRED, roomId hozzárendelés
    Api-->>User: { success: true, tvName: 'Smart TV' }
    
    Api->>Socket: TV értesítése a párosításról
    Socket-->>TV: tv:paired { roomId, roomSlug, roomName }
    Socket-->>TV: room:state_update + tv:queue_preview
    TV->>TV: Automatikus váltás TVPlayer nézetre (LEJÁTSZÁS INDÍTÁSA overlay-jel)
```

---

## 4. Adatbázis Séma (Prisma Data Model)

Az adatbázis sémát a `prisma/schema.prisma` definiálja.

### Főbb modellek:

1. **User**:
   - `id`, `nickname`, `avatarUrl`, `role` (`GUEST`, `USER`, `ADMIN`, `OWNER`), `ipAddress`, `lastActiveAt`.
2. **Room**:
   - `id`, `name`, `slug`, `description`, `isPrivate`, `pinCode`, `djStyle`, `allowGuestDj`, `createdAt`.
3. **QueueItem**:
   - `id`, `roomId`, `userId`, `youtubeId`, `title`, `duration`, `thumbnailUrl`, `position`, `source` (`USER`, `AUTO_DJ`).
4. **ChatMessage**:
   - `id`, `roomId`, `userId`, `message`, `type` (`CHAT`, `SYSTEM`, `EMOTE`), `createdAt`.
5. **TvSession**:
   - `id`, `token` (egyedi azonosító token), `codeHash` (SHA-256 hashelt 6 karakteres kód), `status` (`WAITING`, `PAIRED`, `DISCONNECTED`, `EXPIRED`), `name` (pl. "Nappali TV"), `ipAddress`, `roomId` (külső kulcs), `expiresAt`, `createdAt`, `updatedAt`.
6. **AuditLog**:
   - `id`, `adminId`, `action`, `targetType`, `targetId`, `details`, `createdAt`.

---

## 5. Biztonság és Kliens-védelem

- **Read-Only TV Védelem**: A TV socketek `isTvClient: true` jelöléssel csatlakoznak a Socket.IO szerverre. A szerver automatikusan blokkol minden szobamódosító, szavazó vagy várakozási sor módosító eseményt a TV felől.
- **Brute Force Védelem**: A TV kódbeváltás 10 kérés/perc/IP cím korlátozással védett.
- **XSS és Sanitization**: Minden chat üzenet és szobanév DOMPurify / escape szűrésen esik át.
