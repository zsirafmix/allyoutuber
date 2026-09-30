# AllYouTuber — Ismert Problémák (Known Issues)

Ez a dokumentum rögzíti a rendszerben ismert, nyitott problémákat, azok súlyosságát és a javasolt vagy tervezett megoldásokat.

---

## 1. Régi Smart TV modellek WebKit/Chromium korlátai

- **Leírás**: 2017 előtti LG és Samsung Smart TV modellek régi beépített böngészői nem támogatják a modern CSS Flexbox/Grid bizonyos tulajdonságait vagy a WebSocket automatikus újrakapcsolódási protokolljait.
- **Súlyosság**: Alacsony (régi, elavult hardverek).
- **Érintett komponens**: `/tv` felület és Socket.IO kliens.
- **Reprodukció**: Nyisd meg a `/tv` URL-t 2016-os Samsung Orsay/Tizen 2.4 böngészőben.
- **Ideiglenes workaround**: Újabb Smart TV (webOS 4.0+, Tizen 4.0+, VIDAA U4+) vagy Chromecast / Fire TV Stick használata.
- **Tervezett végleges megoldás**: Letisztult polyfill készlet és fallback stíluslapok beépítése.

---

## 2. YouTube Regionálisan Korlátozott vagy Beágyazást Tiltó Videók

- **Leírás**: Egyes előadók zenéi le vannak tiltva a külső beágyazás alól (YouTube Error 150 / 101), vagy országspecifikus szerzői jogi korlátozás alá esnek (Error 100).
- **Súlyosság**: Közepes.
- **Érintett komponens**: `src/server/socket.ts`, `src/components/tv/TvPlayer.tsx`, YouTube Iframe.
- **Reprodukció**: Olyan YouTube link beküldése a lejátszási sorba, amely nem engedélyezi a webes beágyazást.
- **Ideiglenes workaround**: A szobában tartózkodó DJ manuálisan a "Skip" gombra kattint.
- **Tervezett végleges megoldás**: A kliens `onError` eseménykezelője automatikusan küldjön egy `playback:error` szignált a szervernek, ami 3 másodpercen belül automatikusan a következő számra ugrik, és megjelöli a rossz linket.

---

## 3. Render Ingyenes Példány Alvó Állapota (Cold Start Latency)

- **Leírás**: A Render.com ingyenes tier 15 perc inaktivitás után leállítja a konténert, így az első betöltés 30–50 másodpercet is igénybe vehet.
- **Súlyosság**: Alacsony (üzemeltetési tulajdonság).
- **Érintett komponens**: Kezdeti HTTP és WebSocket kapcsolódás.
- **Reprodukció**: 15 perc inaktivitás után nyisd meg az alkalmazást.
- **Ideiglenes workaround**: Egyszeri megvárás, vagy uptime-robot / cron heartbeat használata.
- **Tervezett végleges megoldás**: Fizetős Starter/Standard instanciára váltás éles környezetben.
