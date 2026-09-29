const { execSync, spawn } = require('child_process');

const port = process.env.PORT || 10000;
const defaultDbUrl = 'postgresql://allyoutuber_user:t6RzLXcfEfl71jpobMuZXHNKn5HCh0VK@dpg-datts00u01pc73ah2800-a/allyoutuber';
const dbUrl = process.env.DATABASE_URL || defaultDbUrl;
process.env.DATABASE_URL = dbUrl;

console.log('----------------------------------------------------');
console.log('🚀 AllYouTuber Starting...');
console.log(`Port: ${port}`);
console.log(`Node: ${process.version}`);
console.log(`Database target configured: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
console.log('----------------------------------------------------');

console.log('✅ DATABASE_URL aktív. Adatbázis séma létrehozása (prisma db push)...');
try {
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
  });
  console.log('✅ Prisma séma sikeresen szinkronizálva!');
} catch (err) {
  console.error('Prisma db push hiba:', err.message);
}

try {
  console.log('🌱 Kezdő adatok és szobák feltöltése (prisma seed)...');
  execSync('npm run prisma:seed', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: dbUrl },
  });
  console.log('✅ Kezdő szobák és DJ zenei könyvtár feltöltve!');
} catch (err) {
  console.warn('Seedelés kihagyva vagy már létezik.');
}

console.log('🚀 AllYouTuber szerver indítása...');
const child = spawn('npx', ['tsx', 'src/server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: dbUrl, NODE_ENV: 'production' },
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
