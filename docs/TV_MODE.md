# AllYouTuber — Smart TV Mode Dokumentáció

Az **AllYouTuber Smart TV Mode** egy célzottan LG (webOS), Samsung (Tizen), Hisense (VIDAA) és egyéb okostévék beépített böngészőire optimalizált, nagyméretű, nagy kontrasztú és valós időben szinkronizált megjelenítési és lejátszási felület.

---

## 1. Főbb Képességek & Szerepkör

- **Lejátszás Smart TV-n**: A TV játssza le a 16:9 arányú YouTube videókat.
- **Távvezérlés Telefonról / PC-ről**: A linkbeküldés, chat, szavazás, moderáció és adminisztráció mind a felhasználók saját eszközeiről történik.
- **Read-Only TV Kliens (`TV_CLIENT`)**: A TV kliens kizárólag adatokat fogad, nem manipulálhatja a várólistát vagy a chatet.
- **Valós Idejű Információk**:
  - **MOST JÁTSZIK**: Cím (32-48px), beküldő nick, teljes időtartam és dinamikus folyamatjelző sáv.
  - **KÖVETKEZIK**: Maximum 3 soron következő dal (sorszám, cím, hossz, beküldő).
- **Egyszerű Párosítás**: 6-karakteres kód (`A7K4Q2`) vagy QR-kód beolvasásával a TV azonnal kapcsolódik a szobához.
- **OLED Képernyőégés-védelem**: Finom periodikus pixel-shift és halványítás védi a statikus TV paneleket.
- **Autoplay Kezelés**: Automatikus lejátszás-blokkolás esetén hatalmas "LEJÁTSZÁS INDÍTÁSA" gomb TV távirányító Enter támogatással.

---

## 2. Útvonalak (Routing)

- `/tv` : A központi TV felület. Ha nincs még párosítva, generálja a párosítási kódot és QR-kódot. Sikeres párosítás után automatikusan átvált a lejátszóra.
- `/tv/:roomId` (pl. `/tv/rock-night`) : Közvetlen szoba TV nézet fix telepítésekhez vagy fejlesztői teszteléshez.
- `/tv?debug=1` : Fejlesztői diagnosztikai sáv (Socket állapot, actual vs expected pozíció, sync drift ms).

---

## 3. Párosítási Folyamat (Pairing Flow)

1. A Smart TV böngészőjében megnyitásra kerül a `https://allyoutuber.onrender.com/tv` cím.
2. A backend legenerál egy 6 karakteres, biztonságos és nem összetéveszthető kódot (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, kizárva a `0`, `O`, `I`, `1` karaktereket).
3. A kód SHA256 hash formájában és 10 perces lejárattal mentődik a `TvSession` adatbázistáblába.
4. A felhasználó telefonján vagy számítógépén a szobában a **TV Kijelző** gombra kattint, és beírja a 6-jegyű kódot.
5. A backend összekapcsolja a TV-t a szobával (`PAIRED` státusz), és Socket.IO-n keresztül értesíti a TV-t (`tv:paired`).
6. A TV csatlakozik a szobai Socket csatornához, és elindítja a szinkronizált YouTube lejátszót.

---

## 4. Socket.IO Események

| Esemény | Irány | Leírás |
|---|---|---|
| `tv:init` | Kliens -> Szerver | TV session token inicializálása |
| `tv:heartbeat` | Kliens -> Szerver | 30 mp-es aktivitásjelző szívverés |
| `tv:sync_request` | Kliens -> Szerver | Pontos szerverpozíció és idősúly lekérdezése |
| `tv:paired` | Szerver -> Kliens | Sikeres szobához csatlakozás visszaigazolása |
| `tv:queue_preview` | Szerver -> Kliens | A következő maximum 3 videó listája |
| `tv:disconnected` | Szerver -> Kliens | Leválasztási jelzés a TV-nek (visszatérés kódhoz) |

---

## 5. Smart TV Böngésző Kompatibilitás

- **LG webOS Browser** (webOS 3.0+): Támogatja az IFrame API-t, Flexbox és CSS Grid elrendezést.
- **Samsung Tizen TV Browser**: Támogatja a modern ES6+ és WebSocket / Polling Socket.IO fallbacket.
- **Hisense VIDAA**: Teljes mértékben támogatott.
- **Távirányító Navigáció**: `Enter`, `OK`, `Space`, és nyilak az autoplay és újrakapcsolódás gombokhoz.
