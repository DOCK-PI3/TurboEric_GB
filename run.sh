#!/bin/bash

# Script de inicio para TurboEric_GB
echo "🚀 Iniciando TurboEric_GB..."

# Configurar CORS para Ollama (Permitir peticiones del navegador)
export OLLAMA_ORIGINS="*"
echo "🌐 OLLAMA_ORIGINS configurado en '*'"

# Comprobar si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "📦 No se encontraron dependencias. Instalando..."
    npm install
else
    echo "✅ Dependencias detectadas."
fi

# Liberar el puerto 3001 si ya está en uso
if lsof -ti:3001 &>/dev/null; then
    echo "⚠️  Puerto 3001 ocupado, liberando..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Iniciar el proxy de búsqueda en segundo plano
echo "🔍 Arrancando proxy de búsqueda en puerto 3001..."
node_modules/.bin/tsx server.ts &
PROXY_PID=$!

# Capturar señal de salida para limpiar el proxy
cleanup() {
  echo ""
  echo "🛑 Deteniendo proxy de búsqueda (PID $PROXY_PID)..."
  kill "$PROXY_PID" 2>/dev/null
}
trap cleanup EXIT INT TERM

# Iniciar la aplicación en modo desarrollo
echo "🔥 Arrancando el motor de IA..."
npm run dev
