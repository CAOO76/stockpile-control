import { networkInterfaces } from 'os';
import { writeFileSync } from 'fs';
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

const envContent = `VITE_DEV_MAC_IP=http://${ip}:5190\n`;

try {
    // Write to both just in case
    writeFileSync(join(process.cwd(), '.env.local'), envContent);
    writeFileSync(join(process.cwd(), '.env.android.local'), envContent);
    console.log(`[Dev Setup] ✅ Injected Mac IP for Offline Build: ${ip}`);
} catch (e) {
    console.error(`[Dev Setup] ❌ Failed to write env files:`, e);
}
