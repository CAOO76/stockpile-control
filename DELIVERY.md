# 🚚 DELIVERY: Stockpile Control Plugin Integration Guide

## Resumen Técnico
El plugin `stockpile-control` es un módulo federado diseñado para integrarse con el núcleo de MINREPORT. Proporciona capacidades de fotogrametría, IA offline para cálculo de volumen y gestión de trazabilidad de acopios.

---

## 🛠️ Instrucciones de Integración

### 1. Registro del Plugin
El administrador debe cargar el archivo `manifest.json` en la interfaz de administración de MINREPORT.

- **ID**: `stockpile-control`
- **Entry Point**: Inyectar el `remoteEntry.js` generado en el build.
- **Permisos**: Asegurar que la App Host conceda acceso a Cámara y Geolocalización.

### 2. Configuración de Module Federation
En el host de MINREPORT (Vite/Webpack), añadir el remote:

```javascript
remotes: {
  'stockpile_control': 'https://[URL_DEL_PLUGIN]/assets/remoteEntry.js'
}
```

---

## 📊 Esquema de Datos (Extensions)

El plugin inyecta y consulta datos en el EntityManager del SDK bajo la extensión `stockpile-control`.

### Estructura de `extensions.stockpile-control`

```json
{
  "id": "string (uuid)",
  "volume_m3": "number",
  "estimated_tons": "number",
  "density_factor": "number (kg/m3)",
  "confidence_level": "number (0-100)",
  "geo_point": {
    "latitude": "number",
    "longitude": "number",
    "altitude": "number | null",
    "accuracy": "number"
  },
  "region": "southamerica-west1",
  "proxy_image_url": "string (WebP < 200kb)",
  "mesh_3d_url": "string (.glb comprimido)",
  "operator_name": "string",
  "captured_at": "number (timestamp)",
  "processed_at": "number (timestamp)"
}
```

---

## 🛡️ Seguridad y Auditoría

- **Aislamiento**: El plugin opera en un sandbox y no accede a variables globales del host.
- **Privacidad**: Todos los campos de entrada tienen `autocomplete='off'`.
- **Integridad**: Se recomienda implementar SRI en el host utilizando el hash generado para `remoteEntry.js`.
- **Región**: Todos los servicios de persistencia están limitados a `southamerica-west1`.

---

## 🚀 Despliegue
1. Ejecutar `npm run build`.
2. Desplegar el contenido de `dist/` en un Bucket de Cloud Storage o servidor estático.
3. Asegurar que los headers CORS permitan el acceso desde el dominio de MINREPORT.

---

**Entregado por Antigravity Dev Team**
