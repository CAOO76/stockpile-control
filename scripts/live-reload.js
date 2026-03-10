
import { networkInterfaces } from 'os';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { execSync, spawn } from 'child_process';
import { join } from 'path';

// Get Local IP
const nets = networkInterfaces();
let ip = 'localhost';

// Prioritize Ethernet/Wi-Fi interfaces
for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
            ip = net.address;
            break;
        }
    }
    if (ip !== 'localhost') break;
}

const PROJECT_ID = 'stockpile-control-demo';
const emulatorDataPath = join(process.cwd(), '.firebase', 'emulator_data');

// Ensure directory exists
try { mkdirSync(emulatorDataPath, { recursive: true }); } catch (e) { }

console.log(`\n🚀 Starting Live Reload...`);
console.log(`📍 Local IP Detected: http://${ip}:5190`);

const configPath = join(process.cwd(), 'capacitor.config.ts');
let originalConfig = '';

try {
    originalConfig = readFileSync(configPath, 'utf-8');
} catch (err) {
    console.error('❌ Could not read capacitor.config.ts');
    process.exit(1);
}

// Inject server url into config
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

console.log('⚡ Starting Vite Server & Firebase Emulators...');

const env = {
    ...process.env,
    VITE_FIREBASE_EMULATOR_HOST: ip,
    VITE_USE_FIREBASE_EMULATOR: 'true'
};

const vite = spawn('npx', ['vite', '--host'], {
    stdio: 'inherit',
    env
});

const emulators = spawn('npx', [
    'firebase',
    'emulators:start',
    '--project', PROJECT_ID,
    '--import=' + emulatorDataPath,
    '--export-on-exit'
], {
    stdio: 'inherit'
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
    // In inherit mode, emulators receive SIGINT from the terminal too.
    // We just need to make sure we don't call process.exit(0) before they're done.
});
