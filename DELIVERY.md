# manual de Entrega: Stockpile Control Plugin v1.0.0

## 1. Introducción
El plugin **Stockpile Control** es una solución de clase mundial para la medición de acopios minerales, integrando fotogrametría, inteligencia de visión para granulometría y conciliación de oficina con romana real.

## 2. Operación y Calibración
El sistema utiliza un ciclo de aprendizaje cerrado para ajustar la precisión:
1. **Terreno**: El operador mide el volumen y la IA sugiere una granulometría/densidad.
2. **Oficina**: El administrador ingresa el peso real de romana.
3. **Calibración**: El motor de IA promedia las desviaciones y sugiere nuevos factores globales.
4. **Sincronización**: Al aceptar la sugerencia, el nuevo factor se propaga a todos los dispositivos móviles mediante el `SecureContext`.

## 3. Esquema de Datos (`extensions.stockpile-control`)
Los datos se almacenan de forma blindada bajo las siguientes claves:
- `stockpile_{id}`: Información completa del activo (volumen, medidas, factor usado, peso real).
- `global_material_profiles`: Mapa de factores de densidad calibrados por granulometría.
- `vision_feedback_loop`: Historial de correcciones del operador para re-entrenamiento local.

## 4. Instrucciones de Instalación
Para administradores de MINREPORT:
1. Copiar el bundle generado (`dist/`) al servidor de plugins.
2. Registrar el plugin indicando la ruta al `manifest.json`.
3. Asegurar que el entorno tenga acceso a la región `southamerica-west1` para los servicios de IA.

---
**Firma Digital del Plugin:** `minreport-auth-v2-stockpile-control-secure`
**Región de Datos:** `southamerica-west1`
