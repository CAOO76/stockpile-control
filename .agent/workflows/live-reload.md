---
description: How to use Live Reload for simultaneous Desktop/Mobile development
---

# Live Reload Workflow

This workflow allows you to develop the application with changes instantly reflected on both your local browser and the Android device/emulator, without rebuilding the native app.

## Prerequisites
- Android device connected via USB or Emulator running.
- Computer and Device on the same Wi-Fi network (if using physical device).

## Steps

1. **Start Live Reload Server**
   Run the following command in your terminal:
   ```bash
   // turbo
   npm run dev:live
   ```

2. **Wait for Synchronization**
   The script will:
   - Detect your local IP address.
   - Update `capacitor.config.ts` automatically.
   - Sync the changes to the Android native project.

3. **Launch on Device**
   Once the script says "Syncing Native Android Config..." and starts the Vite server:
   - Open Android Studio (if not open usage `npx cap open android`).
   - Click the **Run** (Play) button in Android Studio.

4. **Develop**
   - Edit files in `src/`.
   - Save changes.
   - Watch them appear instantly on the device and browser.

5. **Stop**
   - Press `Ctrl+C` in the terminal to stop the server.
   - The script will automatically restore your original `capacitor.config.ts`.
