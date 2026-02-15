#!/bin/bash

# Script para hacer commit y push a GitHub de forma rápida
# Uso: npm run git:push "mensaje del commit"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Preparando commit a GitHub...${NC}"

# Verificar si hay cambios
if [[ -z $(git status -s) ]]; then
    echo -e "${RED}✗ No hay cambios para commitear${NC}"
    exit 0
fi

# Obtener mensaje de commit (primer argumento o mensaje por defecto)
COMMIT_MSG="${1:-"Update: $(date '+%Y-%m-%d %H:%M:%S')"}"

echo -e "${YELLOW}📝 Mensaje del commit: ${COMMIT_MSG}${NC}"

# Add all changes
echo -e "${YELLOW}➕ Agregando cambios...${NC}"
git add .

# Commit
echo -e "${YELLOW}💾 Commiteando...${NC}"
git commit -m "$COMMIT_MSG"

# Push
echo -e "${YELLOW}📤 Pusheando a GitHub...${NC}"
git push

# Verificar resultado
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Código subido exitosamente a GitHub${NC}"
else
    echo -e "${RED}✗ Error al pushear a GitHub${NC}"
    exit 1
fi
