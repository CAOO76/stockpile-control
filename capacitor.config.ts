import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.minreport.stockpilecontrol',
  appName: 'Stockpile Control',
  webDir: 'dist',
  server: {
    url: 'http://192.168.1.87:5173',
    cleartext: true
  }
};

export default config;
