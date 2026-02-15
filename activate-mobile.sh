#!/bin/bash
# Script de Activación para Medición DIGITAL Móvil
# Ejecutar desde la raíz del proyecto STOCKPILE-CONTROL

set -e

echo "🚀 Activando permisos para Medición DIGITAL Móvil..."
echo ""

# 1. Build del proyecto
echo "🔨 Compilando proyecto..."
npm run build

echo ""
echo "✅ Build completado"
echo ""

# 2. Sincronizar Capacitor
echo "📱 Sincronizando Capacitor con Android..."
npx cap sync android

echo ""
echo "✅ Sincronización completada"
echo ""

# 3. Abrir Android Studio (opcional)
read -p "¿Deseas abrir Android Studio ahora? (s/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Ss]$ ]]
then
    echo "🔧 Abriendo Android Studio..."
    npx cap open android
fi

echo ""
echo "✅ Todo listo para pruebas móviles!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Ejecuta la app en Android Studio (▶️)"
echo "   2. Autoriza permisos de Cámara y Ubicación"
echo "   3. Abre el plugin y selecciona 'DIGITAL'"
echo "   4. ¡Realiza tu primera medición!"
echo ""
echo "📖 Consulta MOBILE_PERMISSIONS_GUIDE.md para más detalles"
