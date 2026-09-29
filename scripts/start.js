const { execSync, spawn } = require('child_process');
const http = require('http');

const port = process.env.PORT || 10000;
const dbUrl = process.env.DATABASE_URL;

console.log('----------------------------------------------------');
console.log('🚀 AllYouTuber Starting...');
console.log(`Port: ${port}`);
console.log(`Node: ${process.version}`);
console.log('----------------------------------------------------');

if (!dbUrl || dbUrl.trim() === '') {
  console.error('\n====================================================================');
  console.error('❌ HIÁNYZÓ KÖRNYEZETI VÁLTOZÓ: DATABASE_URL');
  console.error('A PostgreSQL adatbázis URL nincs beállítva a Renderen.');
  console.error('');
  console.error('Hogyan javítsd a Render Dashboardon:');
  console.error('1. Hozz létre egy PostgreSQL adatbázist: New + -> PostgreSQL (pl. allyoutuber-db)');
  console.error('2. Másold ki az "Internal Database URL" értékét.');
  console.error('3. A Web Service felületén nyisd meg az "Environment" fület.');
  console.error('4. Adj hozzá egy új változót:');
  console.error('   Key:   DATABASE_URL');
  console.error('   Value: postgresql://...');
  console.error('5. Mentsd el (Save changes) - a Render automatikusan újraindul!');
  console.error('====================================================================\n');

  // Start helpful fallback HTTP server so Render healthcheck doesn't crash loop
  const server = http.createServer((req, res) => {
    res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>AllYouTuber — Adatbázis konfiguráció szükséges</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #090b10; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
          .card { background: #151928; border: 1px solid #222942; border-radius: 16px; padding: 32px; max-width: 600px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
          h1 { color: #f59e0b; margin-top: 0; font-size: 24px; }
          ol { line-height: 1.8; color: #cbd5e1; }
          code { background: #090b10; padding: 2px 6px; border-radius: 4px; color: #a78bfa; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚠️ Adatbázis (DATABASE_URL) beállítása szükséges</h1>
          <p>Az AllYouTuber sikeresen elindult a Renderen, de a PostgreSQL adatbázis kapcsolata még nincs beállítva.</p>
          <ol>
            <li>Nyisd meg a <b>Render Dashboardot</b> (dashboard.render.com).</li>
            <li>Hozz létre egy PostgreSQL adatbázist (<b>New + ➔ PostgreSQL</b>).</li>
            <li>Másold ki az <b>Internal Database URL</b> értékét.</li>
            <li>A Web Service-ednél menj az <b>Environment</b> fülre, és add hozzá:
              <br><code>DATABASE_URL = postgresql://...</code>
            </li>
            <li>Kattints a <b>Save changes</b> gombra!</li>
          </ol>
        </div>
      </body>
      </html>
    `);
  });

  server.listen(port, () => {
    console.log(`ℹ️ Segítő diagnosztikai weboldal fut a :${port} porton.`);
  });
} else {
  console.log('✅ DATABASE_URL megtalálva. Adatbázis séma frissítése (prisma db push)...');
  try {
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    console.log('✅ Prisma séma sikeresen szinkronizálva!');
  } catch (err) {
    console.error('Prisma db push hiba:', err.message);
  }

  try {
    console.log('🌱 Kezdő adatok feltöltése (prisma seed)...');
    execSync('npm run prisma:seed', { stdio: 'inherit' });
    console.log('✅ Seedelés kész!');
  } catch (err) {
    console.warn('Seedelés kihagyva vagy már létezik.');
  }

  console.log('🚀 Szerver indítása (tsx src/server/index.ts)...');
  const child = spawn('npx', ['tsx', 'src/server/index.ts'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}
