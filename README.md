<div align="center">

# ⚡ TurboEric_GB

**Interfaz avanzada para modelos de IA locales via Ollama**

![Version](https://img.shields.io/badge/version-GB--1.0-cyan)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![License](https://img.shields.io/badge/license-Apache--2.0-blue)

</div>

---

## ¿Qué es TurboEric_GB?

TurboEric_GB es una interfaz web local de alto rendimiento para interactuar con modelos de lenguaje a través de [Ollama](https://ollama.com). Diseñada para desarrolladores y entusiastas de la IA, combina un chat con streaming en tiempo real, un sistema de habilidades (skills) extensible y búsqueda web integrada via SearXNG, todo ejecutándose en tu propia máquina sin enviar datos a servidores externos.

## Características principales

- **Chat en tiempo real** con streaming token a token via la API de Ollama
- **Tool Calling nativo** — los modelos compatibles pueden invocar herramientas automáticamente
- **Buscador Web integrado** — proxy local que consulta instancias públicas de SearXNG
- **Sistema de Skills** — habilidades activables/desactivables desde la configuración
- **3 modos de operación**: Chat · Plan · Build
- **Soporte multimodal** — adjunta imágenes y archivos de texto en la conversación
- **Text-to-Speech** con voz española nativa del navegador
- **Gestor de archivos** — monta una carpeta local y guarda archivos generados por el modelo directamente en disco
- **Parámetros de inferencia configurables** — temperatura, top_p, max tokens
- **100% local** — sin APIs externas, sin fuga de datos, sin suscripciones

## Requisitos

- [Node.js](https://nodejs.org/) ≥ 18
- [Ollama](https://ollama.com/) instalado y corriendo

## Instalación y arranque

```bash
# Clonar el repositorio
git clone https://github.com/DOCK-PI3/TurboEric_GB.git
cd TurboEric_GB

# Arrancar todo (instala dependencias, inicia proxy de búsqueda y servidor Vite)
./run.sh
```

La aplicación estará disponible en **http://localhost:3000**

> El script `run.sh` también configura automáticamente `OLLAMA_ORIGINS="*"` para habilitar las peticiones CORS desde el navegador.

## Arranque manual

```bash
npm install

# Terminal 1 — Proxy de búsqueda (puerto 3001)
npx tsx server.ts

# Terminal 2 — Interfaz web (puerto 3000)
OLLAMA_ORIGINS="*" npm run dev
```

## Modelos recomendados

| Modelo | Tool Calling | Visión | Notas |
|--------|-------------|--------|-------|
| `llama3.1` | ✅ | ❌ | Mejor equilibrio velocidad/calidad |
| `qwen2.5` | ✅ | ❌ | Excelente para código |
| `qwen2.5-vl` | ✅ | ✅ | Con soporte de imágenes |
| `mistral-nemo` | ✅ | ❌ | Rápido y eficiente |
| `llava` | ❌ | ✅ | Análisis de imágenes |

```bash
# Descargar un modelo
ollama pull llama3.1
```

## Skills disponibles

| Skill | Descripción | Tool Calling |
|-------|-------------|-------------|
| Terminal Linux | Contexto de ejecución de comandos | — |
| Gestor de Archivos | Monta carpetas locales y guarda archivos | — |
| Monitor de Sistema | Información sobre recursos del sistema | — |
| Editor Pro | Asistente de codificación avanzado | — |
| **Buscador Web** | Búsquedas reales via SearXNG | ✅ |
| Ollama Cloud | Modelos remotos de Ollama | — |

Las skills con **Tool Calling** requieren un modelo compatible (ver tabla anterior).

## Arquitectura

```
TurboEric_GB/
├── server.ts          # Proxy Express — búsquedas SearXNG (puerto 3001)
├── src/
│   ├── App.tsx        # Lógica principal, gestión de estado
│   ├── lib/
│   │   ├── ollama.ts  # Cliente Ollama con streaming y tool calling
│   │   └── skills.tsx # Definición de skills y herramientas Ollama
│   ├── components/
│   │   ├── Chat.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SettingsModal.tsx
│   │   └── SecurityModal.tsx
│   └── hooks/
│       └── useSpeech.ts
├── vite.config.ts     # Dev server + proxy /api → localhost:3001
└── run.sh             # Script de arranque completo
```

## Configuración

Accede a **Configuración Sistema** desde la barra lateral para ajustar:

- **Endpoint Ollama** — por defecto `http://localhost:11434`
- **Temperatura** — creatividad del modelo (0 – 2)
- **Top P** — diversidad de muestreo (0 – 1)
- **Skills activas** — activa o desactiva herramientas

## Licencia

[Apache 2.0](LICENSE)
