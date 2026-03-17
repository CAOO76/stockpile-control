
import { networkInterfaces } from 'os';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { join } from 'path';

// ─── Leer manifest de tipo de proyecto ───────────────────────────────────────
const manifestPath = join(process.cwd(), 'antigravity.project.json');
let projectType = 'Plugin'; // default seguro
let emulatorProject = 'demo-local';
let emulatorsToStart = ['auth', 'firestore', 'storage'];

try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    projectType = manifest.type || 'Plugin';
    emulatorProject = manifest.firebase?.emulatorProject || emulatorProject;
    emulatorsToStart = manifest.firebase?.emulators || emulatorsToStart;
    console.log(`\n📋 Tipo de Proyecto: ${projectType} (${manifest.name})`);
} catch (err) {
    console.warn('⚠️  antigravity.project.json no encontrado. Asumiendo tipo: Plugin (modo seguro)');
}

// ─── Validación de seguridad: Plugins no despliegan a producción ──────────────
if (projectType === 'Plugin') {
    console.log('🔌 Modo Plugin: Solo emuladores Firebase. Sin proyecto de producción vinculado.');
} else if (projectType === 'APP') {
    console.log('📦 Modo APP: Firebase en producción disponible.');
} else {
    console.error(`❌ Tipo de proyecto desconocido en antigravity.project.json: "${projectType}"`);
    process.exit(1);
}

// ─── Detectar IP local ────────────────────────────────────────────────────────
const nets = networkInterfaces();
let ip = 'localhost';
for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
            ip = net.address;
            break;
        }
    }
    if (ip !== 'localhost') break;
}

const emulatorDataPath = join(process.cwd(), '.firebase', 'emulator_data');
try { mkdirSync(emulatorDataPath, { recursive: true }); } catch (e) { }

console.log(`\n🚀 Starting Live Reload...`);
console.log(`📍 Local IP Detected: http://${ip}:5190`);

// ─── Patch capacitor.config.ts ────────────────────────────────────────────────
const configPath = join(process.cwd(), 'capacitor.config.ts');
let originalConfig = '';
try {
    originalConfig = readFileSync(configPath, 'utf-8');
} catch (err) {
    console.error('❌ Could not read capacitor.config.ts');
    process.exit(1);
}

let newConfig = originalConfig;
if (originalConfig.includes('server: {')) {
    newConfig = originalConfig.replace(
        'server: {',
        `server: {\n    url: 'http://${ip}:5190',\n`
    );
}

console.log('🔧 Patching capacitor.config.ts for Live Reload...');
writeFileSync(configPath, newConfig);

try {
    console.log('🔄 Syncing Native Android Config...');
    execSync('npx cap copy android', { stdio: 'inherit' });
    console.log('✅ Native Config Updated');
    console.log('📱 Opening Android Studio...');
    execSync('npx cap open android', { stdio: 'inherit' });
} catch (e) {
    console.error('❌ Error syncing android:', e);
} finally {
    console.log('🧹 Restoring original capacitor.config.ts...');
    writeFileSync(configPath, originalConfig);
}

// ─── Lanzar Vite + Emuladores ─────────────────────────────────────────────────
console.log('⚡ Starting Vite Server & Firebase Emulators...');

const env = {
    ...process.env,
    VITE_FIREBASE_EMULATOR_HOST: ip,
    VITE_USE_FIREBASE_EMULATOR: 'true',
    VITE_PROJECT_TYPE: projectType,
    // Forzar Java 21 para Firebase Tools (instalado vía Homebrew)
    JAVA_HOME: '/usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home'
};

const vite = spawn('npx', ['vite', '--host'], {
    stdio: 'inherit',
    env
});

// Solo lanzar emuladores (modo Plugin: sin acceso a producción firebase)
const emulators = spawn('npx', [
    'firebase',
    'emulators:start',
    '--project', emulatorProject,
    '--only', emulatorsToStart.join(','),
    '--import=' + emulatorDataPath,
    '--export-on-exit'
], {
    stdio: 'inherit',
    env // <-- Asegurar que los emuladores reciban la variable JAVA_HOME
});

vite.on('close', () => {
    if (!emulators.killed) emulators.kill('SIGINT');
});

emulators.on('close', (code) => {
    console.log(`✅ Emulators shut down (code ${code || 0})`);
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development environment...');
    vite.kill();
    if (!emulators.killed) emulators.kill('SIGINT');
});
