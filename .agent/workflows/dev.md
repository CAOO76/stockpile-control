---
description: How to work without interruptions using Live Reload and Android Studio
---

# Flujos de Desarrollo

## 🏗️ dev:studio — Desarrollo Offline-First (recomendado para pruebas de campo)

El APK se instala con datos locales. Permite desconectar el cable y seguir probando.

// turbo
1. Ejecuta el script unificado:
```bash
npm run dev:studio
```
Este comando hace todo en secuencia:
1. **Compila** → APK de producción sin dependencia al servidor de desarrollo
2. **Sincroniza** → copia los assets al proyecto nativo Android
3. **Abre** → lanza Android Studio para instalar en el dispositivo
4. **Sirve** → inicia servidor Vite en `http://localhost:5190` para escritorio

2. Instala el APK desde Android Studio (botón ▶ Run)
3. Abre el navegador en `http://localhost:5190` para escritorio
4. **Desconecta el cable USB** — el dispositivo sigue funcionando offline

> [!IMPORTANT]
> Todos los datos se guardan en `localStorage` del dispositivo. Las fotos se guardan como DataURL base64. No se necesita internet ni el servidor de desarrollo para funcionar.

---

## ⚡ android:dev — Live Reload (para desarrollo activo con emuladores)

Para ver cambios en tiempo real en el dispositivo mientras editas código.

// turbo
1. Ejecuta:
```bash
npm run android:dev
```
Este comando:
1. Inyecta la IP local en `capacitor.config.ts`
2. Sincroniza y abre Android Studio
3. Inicia los emuladores de Firebase
4. Inicia servidor Vite con hot reload

2. En Android Studio: presiona ▶ Run
3. Edita archivos en `src/` y los cambios aparecen instantáneamente en el dispositivo

> [!TIP]
> Requiere que el celular y el iMac estén en la misma red Wi-Fi. Los datos van a los emuladores de Firebase, no al dispositivo. Al desconectar el cable, la app pierde acceso a los datos.
