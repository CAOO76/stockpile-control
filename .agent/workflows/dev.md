---
description: How to work without interruptions using Live Reload and Android Studio
---

# Flujo de Trabajo Sin Interrupciones

Este flujo te permite programar en la web y ver los cambios instantáneamente en el emulador de Android sin tener que recompilar ni reiniciar Android Studio.

## Comandos del Teclado

### 1. Iniciar todo con un comando
Ejecuta esto en tu terminal:
```bash
npm run android:dev
```
Este comando hace tres cosas por ti:
1. **Sincroniza**: Asegura que Android sepa que debe buscar el servidor de desarrollo.
2. **Abre**: Lanza Android Studio automáticamente.
3. **Sirve**: Arranca el servidor de Vite con Live Reload activo.

## Cómo trabajar sin interrupciones

1. **En Android Studio**: Dale al botón "Run" (el icono verde de Play) para lanzar la app en el emulador.
2. **En tu Editor (VS Code / Cursor)**: Modifica cualquier archivo en `src/`.
3. **Resultado**: Verás el cambio en el emulador en menos de un segundo.

> [!TIP]
> No cierres la terminal donde corre `npm run android:dev`. Si necesitas sincronizar cambios nativos (como un nuevo plugin), detén el comando con `Ctrl+C` y vuelve a ejecutarlo.

> [!IMPORTANT]
> Asegúrate de que tu celular/emulador y tu Mac estén en la misma red Wi-Fi si usas un dispositivo físico.
