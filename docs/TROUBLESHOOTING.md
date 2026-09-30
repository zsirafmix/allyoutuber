# AllYouTuber — Hibaelhárítási Útmutató (Troubleshooting)

Ez a dokumentum összegyűjti a fejlesztés és tesztelés során felmerült technikai hibákat, azok kiváltó okait, a kipróbált és elvetett megoldásokat, valamint a végleges javításokat.

---

## 1. Next.js 14 `useSearchParams()` Build Hiba

### Hibaüzenet:
```
Error: useSearchParams() should be wrapped in a suspense boundary at page "/tv".
```

### Kiváltó ok:
A Next.js 14 App Router statikus oldalgenerálás (prerendering) során megköveteli, hogy bármely olyan kliens komponens, amely a `useSearchParams()` hookot hívja (pl. `?debug=1`), `<React.Suspense>` komponensbe legyen csomagolva.

### Sikertelen próbálkozások:
1. `export const dynamic = 'force-dynamic';` beállítása a gyökér layoutban: Lassította az összes oldal kiszolgálását, és nem oldotta meg a lokális build warningokat.

### Végleges megoldás:
A tényleges logikát egy belső komponensbe szerveztük (pl. `DirectTvRoomContent`), és az alapértelmezett exportált `DirectTvRoomPage` köré explicit `<React.Suspense fallback={<Loading />}>` burkolót helyeztünk a `src/app/tv/page.tsx` és `src/app/tv/[slug]/page.tsx` fájlokban.

---

## 2. Smart TV Autoplay Hangtilalom (Autoplay Policy Blockage)

### Hiba:
A Smart TV böngészőjében (különösen LG webOS és Samsung Tizen) a videó betöltődött, de a lejátszás nem indult el, vagy a hang azonnal lenémult.

### Kiváltó ok:
A modern TV és asztali böngészők energiatakarékossági és felhasználóvédelmi okokból tiltják a hangos videók automatikus indítását (`autoplay with sound`), amíg a felhasználó nem hajt végre fizikai interakciót az oldalon (kattintás, gombnyomás).

### Sikertelen próbálkozások:
1. `mute()` azonnali hívása és 1 másodperc utáni `unMute()`: A böngésző biztonsági mechanizmusa azonnal újra leállította a lejátszót.

### Végleges megoldás:
Létrehoztunk egy feltűnő **"LEJÁTSZÁS INDÍTÁSA"** overlay gombot a `src/components/tv/TvPlayer.tsx` komponensben, amely:
- Fókuszba áll,
- Reagál a távirányító **OK / Enter gombjára** (`keyCode 13`),
- Az interakció hatására azonnal engedélyezi a hangot és elindítja a lejátszást (`unMute()` + `playVideo()`), majd eltűnik.

---

## 3. PostMessage Cross-Origin Kommunikációs Hiba TV Böngészőkben

### Hiba:
Közvetlen `iframe.contentWindow.postMessage` hívások a YouTube iframe felé csendben elhaltak egyes régebbi TV böngészőkön.

### Kiváltó ok:
Egyes Smart TV platformok egyedi webview megkötései blokkolják a szülő ablakból indított direkt cross-origin postMessage küldést.

### Végleges megoldás:
Kizárólag a hivatalos YouTube Iframe Player JavaScript API-t (`https://www.youtube.com/iframe_api`) használjuk dinamikusan betöltve, amely belsőleg kezeli az összes platform-specifikus üzenetküldést.

---

## 4. Prisma `TvSession` Token Típusillesztési Hiba

### Hibaüzenet:
```
Type 'string | undefined' is not assignable to type 'string'.
```

### Kiváltó ok:
A `src/lib/tv.ts` `getSession(token)` és `getTvSession(token)` függvényei szigorú `string` típust vártak, de a request header vagy cookie opcionálisan `undefined`-ként tért vissza.

### Végleges megoldás:
Bemeneti validáció hozzáadása a route handler elején: ha a token hiányzik vagy üres, azonnal `400 Bad Request` vagy `401 Unauthorized` válasszal térünk vissza.
