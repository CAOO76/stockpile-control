# Plugin Stockpile Control para MINREPORT

Plugin de control y monitoreo de stockpile desarrollado para la plataforma MINREPORT.

## 🚀 Características

- ✅ Implementa la interfaz `PluginLifeCycle` del SDK de MINREPORT v1.0.3
- ✅ Configurado con React 18 + Vite + TypeScript
- ✅ Module Federation para carga dinámica en MINREPORT
- ✅ Región configurada: `southamerica-west1`

## 📋 Requisitos

- Node.js 18+ 
- npm 9+

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install
```

## 🔧 Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev
```

El plugin estará disponible en `http://localhost:5173`

## 🏗️ Build

```bash
# Compilar para producción
npm run build
```

El plugin compilado estará en el directorio `dist/` como módulo federado.

## 📦 Estructura del Proyecto

```
stockpile-control/
├── src/
│   ├── @types/
│   │   └── minreport-sdk.d.ts  # Definiciones TypeScript del SDK
│   ├── plugin.ts                # Implementación del PluginLifeCycle
│   ├── App.tsx                  # Componente principal React
│   ├── App.css                  # Estilos del plugin
│   ├── main.tsx                 # Punto de entrada React
│   └── index.css                # Estilos globales
├── vite.config.ts               # Configuración Vite + Module Federation
├── package.json                 # Dependencias y scripts
├── .env                         # Variables de entorno
└── .env.example                 # Plantilla de variables de entorno
```

## 🌐 Variables de Entorno

El plugin utiliza las siguientes variables de entorno (ver `.env`):

- `VITE_MINREPORT_REGION`: Región de MINREPORT (southamerica-west1)
- `VITE_PLUGIN_NAME`: Nombre del plugin
- `VITE_PLUGIN_VERSION`: Versión del plugin
- `VITE_MINREPORT_SDK_VERSION`: Versión del SDK de MINREPORT

## 🔌 Integración con MINREPORT

El plugin exporta los siguientes módulos federados:

- `./Plugin`: Clase principal `StockpileControlPlugin`
- `./App`: Componente React principal

### Uso desde MINREPORT

```typescript
// Importar el plugin
import { stockpileControlPlugin } from 'stockpile-control-plugin/Plugin';

// Inicializar
await stockpileControlPlugin.onInit();

// Activar
await stockpileControlPlugin.onActivate();

// Obtener estado
const status = stockpileControlPlugin.getStatus();

// Desactivar
await stockpileControlPlugin.onDeactivate();
```

## 📄 Licencia

Propiedad de MINREPORT

## 👥 Autor

MINREPORT Team
