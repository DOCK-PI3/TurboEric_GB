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

## Instalación y arranque en Linux / macOS

```bash
# Clonar el repositorio
git clone https://github.com/DOCK-PI3/TurboEric_GB.git
cd TurboEric_GB

# Arrancar todo (instala dependencias, inicia proxy de búsqueda y servidor Vite)
./run.sh
```

La aplicación estará disponible en **http://localhost:3000**

> El script `run.sh` también configura automáticamente `OLLAMA_ORIGINS="*"` para habilitar las peticiones CORS desde el navegador.

## Instalación y arranque en Windows 11

### 1. Instalar Node.js

Descarga e instala **Node.js** (versión 18 o superior) desde:
👉 https://nodejs.org/

Durante la instalación, asegúrate de marcar la opción **"Add to PATH"** (viene marcada por defecto). Esto permitirá usar los comandos `node` y `npm` desde PowerShell.

Para verificar que quedó bien instalado, abre PowerShell y ejecuta:

```powershell
node --version   # Debe mostrar algo como v18.20.0 o superior
npm --version    # Debe mostrar algo como 10.x.x
```

### 2. Instalar Ollama

Descarga e instala Ollama desde:
👉 https://ollama.com/download/windows

Una vez instalado, abre una terminal y descarga al menos un modelo:

```powershell
ollama pull llama3.1
```

Ollama se ejecuta como servicio en segundo plano automáticamente al iniciar Windows. Para verificar que está corriendo:

```powershell
ollama list
```

### 3. Configurar CORS para Ollama (IMPORTANTE)

> 🚀 **Si usas `run.ps1`** (recomendado), puedes saltarte esta sección — el script lo configura todo automáticamente.
> Si prefieres arrancar manualmente o configurar Ollama de forma permanente, elige una de las opciones siguientes.

Ollama y la interfaz web se ejecutan en **puertos diferentes**:

| Servicio | Puerto |
|----------|--------|
| Ollama | `11434` |
| Interfaz TurboEric_GB | `3000` |

El navegador bloquea las peticiones entre distintos orígenes (CORS). Para que la web pueda comunicarse con Ollama, hay que indicarle a Ollama que acepte peticiones desde el origen `http://localhost:3000`.

---

#### Opción A — Variable de entorno permanente (recomendada)

Con este método, Ollama arrancará siempre con CORS habilitado, incluso tras reiniciar el equipo.

**Paso 1:** Abre PowerShell y ejecuta:

```powershell
# Establece OLLAMA_ORIGINS como variable de entorno del usuario (persistente)
[System.Environment]::SetEnvironmentVariable("OLLAMA_ORIGINS", "*", "User")
```

> También puedes hacerlo desde la interfaz gráfica: **Inicio → Editar variables de entorno del sistema → Variables de entorno → Nuevas... → Nombre: `OLLAMA_ORIGINS` → Valor: `*`**

**Paso 2:** Cierra completamente Ollama:

```powershell
# Detener el proceso de Ollama
Stop-Process -Name ollama -Force -ErrorAction SilentlyContinue
```

**Paso 3:** Vuelve a iniciar Ollama desde el menú Inicio o ejecutando `ollama serve`.

---

#### Opción B — Variable de sesión (temporal)

Útil para pruebas: la variable solo vive en la terminal actual.

```powershell
# Inicia Ollama con CORS habilitado en esta terminal
$env:OLLAMA_ORIGINS = "*"
ollama serve
```

⚠️ Debes mantener esta terminal abierta mientras uses TurboEric_GB.

---

#### Opción C — Usar run.ps1 (completamente automático)

El script `run.ps1` gestiona todo automáticamente. Al ejecutarlo:

1. ✅ Establece `$env:OLLAMA_ORIGINS = "*"` para la sesión
2. 🔍 **Ping rápido** al puerto 11434 — si Ollama ya responde, lo deja intacto (tarda ~2s)
3. 🔄 Si Ollama **no responde**, verifica que el ejecutable exista y:
   - Si el proceso está corriendo pero sin CORS → lo **reinicia** automáticamente
   - Si no está corriendo → lo **arranca** en segundo plano
4. ⏳ Espera hasta 15s con indicador de progreso hasta que Ollama esté listo
5. 🚀 Arranca el proxy de búsqueda y la interfaz Vite

Simplemente ejecuta:

```powershell
.\run.ps1
```

Y ya. No necesitas detener Ollama manualmente ni abrir terminales adicionales. El script lo maneja solo.

---

#### Verificar que CORS funciona

Abre http://localhost:3000 en tu navegador. Si el chat se conecta correctamente y los mensajes fluyen, CORS está configurado correctamente.

Si ves errores de conexión en la consola del navegador (F12 → Consola) relacionados con `Cross-Origin` o `CORS`, revisa que:

1. `OLLAMA_ORIGINS` esté configurado (ejecuta `echo $env:OLLAMA_ORIGINS` en PowerShell)
2. Ollama se haya **reiniciado** después de configurar la variable
3. La URL del endpoint en la configuración de TurboEric_GB sea `http://localhost:11434`

---

### 4. Clonar el repositorio

```powershell
git clone https://github.com/DOCK-PI3/TurboEric_GB.git
cd TurboEric_GB
```

> Si no tienes Git instalado, descárgalo desde https://git-scm.com/download/win, o simplemente descarga el ZIP desde GitHub y extráelo en una carpeta.

### 5. Configurar la Execution Policy de PowerShell

Por seguridad, Windows bloquea la ejecución de scripts PowerShell sin firmar. Para permitir la ejecución del script `run.ps1`, abre **PowerShell como Administrador** (clic derecho → "Ejecutar como administrador") y ejecuta:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Luego presiona **S** (Yes) cuando te lo pida confirmar.

Esto solo hace falta **una vez**. A partir de ahí podrás ejecutar `run.ps1` sin problemas.

### 6. Arrancar la aplicación

> ✅ `run.ps1` ya gestiona **Ollama + CORS automáticamente** — no necesitas configurar nada manualmente.

Opción A — **Doble clic en `run.ps1`** (recomendado):

1. Abre la carpeta `TurboEric_GB` en el Explorador de Archivos
2. Haz doble clic en `run.ps1` (el icono tiene una flecha azul)
3. Se abrirá PowerShell, verificará/iniciará Ollama con CORS, instalará dependencias y arrancará todo
4. Abre **http://localhost:3000** en tu navegador

Opción B — **Desde PowerShell manualmente** (para ver la salida más detallada):

```powershell
cd C:\ruta\a\TurboEric_GB
.\run.ps1
```

### Arranque manual (sin run.ps1)

Si prefieres arrancar los servicios por separado (útil para depurar):

```powershell
cd C:\ruta\a\TurboEric_GB

# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Terminal 1 — Proxy de búsqueda (puerto 3001)
$env:OLLAMA_ORIGINS = "*"
npx tsx server.ts

# 3. Terminal 2 — Interfaz web (puerto 3000)
$env:OLLAMA_ORIGINS = "*"
npm run dev
```

> En Windows, `$env:OLLAMA_ORIGINS = "*"` configura la variable de entorno de forma equivalente a `export OLLAMA_ORIGINS="*"` en Linux.

### Solución de problemas comunes en Windows

| Problema | Causa posible | Solución |
|----------|--------------|----------|
| ✅ La ventana se abre y se cierra inmediatamente | Execution Policy bloquea scripts | Ejecuta `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` en PowerShell como Administrador |
| ❌ `npx` no se reconoce como comando | Node.js no está en el PATH | Reinstala Node.js marcando "Add to PATH", o agrega manualmente `%APPDATA%\npm` a las variables de entorno |
| ❌ Error de conexión a Ollama | Ollama no está corriendo | Abre Ollama desde el menú Inicio o ejecuta `ollama serve` en PowerShell |
| ❌ Puerto 3000 ocupado | Otro programa usa ese puerto | Cierra el otro programa, o cambia el puerto en el script `run.ps1` |
| ❌ Error al instalar dependencias (`node-gyp`) | Faltan herramientas de compilación | Ejecuta PowerShell como Administrador: `npm install --global windows-build-tools` |
| ⚠️ La app carga pero el chat no responde | Modelo no descargado | Ejecuta `ollama pull llama3.1` para descargar un modelo |

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
| Terminal Linux | Ejecuta comandos bash en el servidor | ✅ `execute_terminal` |
| Gestor de Archivos | CRUD de archivos del proyecto | ✅ `file_manager` |
| Monitor de Sistema | CPU, memoria y plataforma desde el navegador | ✅ `system_monitor` |
| Editor Pro | Analiza, genera y refactoriza código | ✅ `code_assistant` |
| **Buscador Web** | Búsquedas en internet via SearXNG | ✅ `search_web` |
| Ollama Cloud | Gestión de instancias locales/remotas | ✅ `ollama_cloud` |

Todas las skills están **activas por defecto** y pueden desactivarse desde Configuración Sistema. Las skills con **Tool Calling** requieren un modelo compatible (ver tabla anterior).

> ⚡ El modelo puede ejecutar hasta **10 rondas** de tool calls por mensaje, encadenando múltiples herramientas en un solo flujo de trabajo.

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
├── run.sh             # Script de arranque para Linux/macOS
└── run.ps1            # Script de arranque para Windows
```

## API Reference — Proxy (puerto 3001)

El servidor `server.ts` expone una API REST en `http://localhost:3001` que actúa como proxy entre la interfaz web y los servicios externos (SearXNG, sistema de archivos, terminal). También gestiona el historial de conversaciones en SQLite.

> ⚡ La interfaz Vite redirige automáticamente las rutas `/api/*` al puerto 3001 durante el desarrollo (configurado en `vite.config.ts`).

---

### 🔍 Búsqueda Web

#### `GET /api/search` — Buscar en internet

#### `GET /api/search/test` — Diagnóstico de búsqueda (debug)

Prueba cada proveedor de búsqueda individualmente (Serper, Brave, DuckDuckGo) más el pipeline completo en un solo endpoint. Ideal para verificar que tu API key funciona.

**Parámetros (query string):**

| Parámetro | Tipo | Obligatorio | Defecto | Descripción |
|-----------|------|-------------|---------|-------------|
| `q` | `string` | ❌ | `"tiempo Las Palmas Gran Canaria"` | Consulta de prueba |
| `serper_key` | `string` | ❌ | — | Tu API key de Serper.dev |
| `brave_key` | `string` | ❌ | — | Tu API key de Brave Search |
| `preferred` | `string` | ❌ | `auto` | Proveedor preferido |

**Ejemplo:**

```bash
curl "http://localhost:3001/api/search/test?serper_key=TU_KEY&preferred=serper"
```

**Respuesta (200):**

```json
{
  "query": "tiempo Las Palmas Gran Canaria",
  "preferred": "serper",
  "individual": {
    "serper": {
      "success": true,
      "count": 3,
      "results": [{ "title": "...", "url": "...", "snippet": "...", "engine": "serper" }]
    },
    "brave": {
      "success": false,
      "error": "No se proporcionó API key"
    },
    "duckduckgo": {
      "success": true,
      "count": 3,
      "results": [...]
    }
  },
  "full_pipeline": {
    "success": true,
    "source": "serper",
    "count": 3,
    "firstResult": { "title": "...", "url": "...", "snippet": "..." }
  }
}
```

Esto te permite ver exactamente qué proveedor funciona y cuál falla.

---

#### `GET /api/search` — Buscar en internet

Realiza búsquedas web con un sistema de **tres niveles** de proveedores:

| Prioridad | Motor | Requisito |
|-----------|-------|-----------|
| 🥇 **Brave Search** | API oficial JSON | API key (configurable en la interfaz) |
| 🥈 **Serper.dev** | Google Search API | API key (configurable en la interfaz) |
| 🥉 DuckDuckGo | HTML scraping | Ninguno |
| 🏅 SearXNG | Instancias públicas | Ninguno |

El sistema prueba los proveedores en orden de prioridad según las API keys configuradas. Si el primero falla o no tiene key, pasa al siguiente.

**Parámetros (query string):**

| Parámetro | Tipo | Obligatorio | Defecto | Descripción |
|-----------|------|-------------|---------|-------------|
| `q` | `string` | ✅ | — | Consulta de búsqueda |
| `num` | `integer` | ❌ | `5` | Número de resultados (1–10) |
| `brave_key` | `string` | ❌ | — | API Key de Brave Search |
| `serper_key` | `string` | ❌ | — | API Key de Serper.dev |
| `preferred` | `string` | ❌ | `auto` | Proveedor preferido: `auto`, `brave`, `serper` o `duckduckgo` |

**Respuesta exitosa (200):**

```json
{
  "query": "últimas noticias ia",
  "source": "serper",      // "brave" | "serper" | "duckduckgo" | "searxng"
  "results": [
    {
      "title": "Título del resultado",
      "url": "https://ejemplo.com/articulo",
      "snippet": "Fragmento descriptivo del contenido...",
      "engine": "serper"    // "brave" | "serper" | "duckduckgo" | engine name from SearXNG
    }
  ]
}
```

**Errores:**
- `400` — Parámetro `q` requerido
- `503` — Todos los motores de búsqueda fallaron

---

### 💻 Ejecución de Comandos

#### `POST /api/exec` — Ejecutar comando en el servidor

Ejecuta comandos de terminal (bash) y devuelve stdout, stderr y código de salida.

**Cuerpo de la solicitud:**

| Campo | Tipo | Obligatorio | Defecto | Descripción |
|-------|------|-------------|---------|-------------|
| `command` | `string` | ✅ | — | Comando a ejecutar |
| `timeout` | `integer` | ❌ | `15` | Timeout máximo en segundos (1–60) |

**Ejemplo:**

```bash
curl -X POST http://localhost:3001/api/exec \
  -H "Content-Type: application/json" \
  -d '{"command": "ls -la", "timeout": 10}'
```

**Respuesta exitosa (200):**

```json
{
  "stdout": "total 123\ndrwxr-xr-x ...\n",
  "stderr": "",
  "error": null,
  "code": 0,
  "killed": false
}
```

**Errores:**
- `400` — `command` requerido
- `500` — Error interno al ejecutar

**Límites:**
- Timeout máximo: 60 segundos
- Buffer máximo de salida: 2 MB

---

### 📁 Sistema de Archivos

Todas las rutas son relativas a la raíz del proyecto. El servidor protege contra **path traversal**: cualquier ruta que intente salir del directorio del proyecto recibe `403 Acceso denegado`.

#### `GET /api/files/:path(*)` — Leer archivo o listar directorio

Si `path` apunta a un archivo, devuelve su contenido. Si apunta a un directorio, lista su contenido.

**Ejemplos:**

```bash
# Leer archivo
curl http://localhost:3001/api/files/package.json

# Listar directorio
curl http://localhost:3001/api/files/src
```

**Respuesta — archivo (200):**

```json
{
  "path": "package.json",
  "type": "file",
  "content": "{\n  \"name\": \"turboeric-gb\",\n  ...\n}",
  "size": 1234
}
```

**Respuesta — directorio (200):**

```json
{
  "path": "src",
  "type": "directory",
  "children": [
    { "name": "App.tsx", "type": "file" },
    { "name": "components", "type": "directory" },
    { "name": "lib", "type": "directory" }
  ]
}
```

**Errores:**
- `403` — Ruta fuera del proyecto (path traversal detectado)
- `404` — Archivo o directorio no encontrado

---

#### `POST /api/files/:path(*)` — Crear o sobrescribir archivo

Crea un archivo nuevo o sobrescribe uno existente. Los directorios intermedios se crean automáticamente.

**Cuerpo de la solicitud:**

```json
{
  "content": "Contenido del archivo..."
}
```

**Ejemplo:**

```bash
curl -X POST http://localhost:3001/api/files/src/nuevo/archivo.ts \
  -H "Content-Type: application/json" \
  -d '{"content": "export const saludo = \"Hola\";"}'
```

**Respuesta exitosa (200):**

```json
{
  "path": "src/nuevo/archivo.ts",
  "written": true,
  "size": 35
}
```

**Errores:**
- `400` — `content` requerido en el body
- `403` — Ruta fuera del proyecto

---

#### `DELETE /api/files/:path(*)` — Eliminar archivo

Elimina un archivo del proyecto. No elimina directorios.

**Ejemplo:**

```bash
curl -X DELETE http://localhost:3001/api/files/src/nuevo/archivo.ts
```

**Respuesta exitosa (200):**

```json
{
  "path": "src/nuevo/archivo.ts",
  "deleted": true
}
```

**Errores:**
- `403` — Ruta fuera del proyecto
- `404` — Archivo no encontrado

---

### 🤖 Ollama

#### `GET /api/ollama/models` — Listar modelos disponibles

Obtiene la lista de modelos instalados en Ollama local (`http://localhost:11434`).

**Respuesta exitosa (200):**

```json
{
  "models": [
    "llama3.1:8b",
    "qwen2.5:7b",
    "mistral-nemo:latest"
  ]
}
```

**Errores:**
- `502` — Ollama no responde en `http://localhost:11434`

---

### 💬 Historial de Conversaciones (SQLite)

El historial se almacena en `chat_history.db` (SQLite). Cada conversación tiene un título y una lista de mensajes con rol (`user`, `assistant`, `system`, `tool`), contenido e imágenes opcionales.

---

#### `GET /api/conversations` — Listar conversaciones

Devuelve todas las conversaciones ordenadas por fecha de creación descendente.

**Respuesta (200):**

```json
[
  {
    "id": "uuid-v4",
    "title": "Nueva conversación",
    "created_at": "2025-01-15T10:30:00.000Z"
  }
]
```

---

#### `POST /api/conversations` — Crear conversación

Crea una nueva conversación con título por defecto "Nueva conversación".

**Cuerpo:** No requiere body.

**Respuesta (200):**

```json
{
  "id": "uuid-v4",
  "title": "Nueva conversación",
  "created_at": "2025-01-15T10:30:00.000Z"
}
```

---

#### `PATCH /api/conversations/:id/title` — Actualizar título

**Cuerpo:**

```json
{
  "title": "Nuevo título (máx 60 caracteres)"
}
```

**Respuesta (200):** `{ "ok": true }`

**Errores:**
- `400` — `title` requerido

---

#### `DELETE /api/conversations/:id` — Eliminar conversación

Elimina una conversación y todos sus mensajes (cascada por clave foránea).

**Respuesta (200):** `{ "ok": true }`

---

#### `GET /api/conversations/:id/messages` — Obtener mensajes

Devuelve los mensajes de una conversación ordenados por fecha ascendente.

**Respuesta (200):**

```json
[
  {
    "id": "uuid-v4",
    "conversation_id": "uuid-v4",
    "role": "user",
    "content": "Hola, ¿qué puedes hacer?",
    "images": null,
    "created_at": "2025-01-15T10:30:00.000Z"
  },
  {
    "id": "uuid-v4",
    "conversation_id": "uuid-v4",
    "role": "assistant",
    "content": "¡Hola! Soy TurboEric_GB...",
    "images": null,
    "created_at": "2025-01-15T10:30:05.000Z"
  }
]
```

---

#### `POST /api/conversations/:id/messages` — Agregar mensaje

Añade un mensaje a una conversación.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `role` | `string` | ✅ | `"user"`, `"assistant"`, `"system"` o `"tool"` |
| `content` | `string` | ✅ | Contenido del mensaje |
| `images` | `string[]` | ❌ | Lista de imágenes en base64 (sin cabecera `data:`) |

**Respuesta (200):** `{ "id": "uuid-v4", "ok": true }`

**Errores:**
- `400` — `role` y `content` requeridos

---

#### `DELETE /api/conversations/:id/messages` — Limpiar mensajes

Elimina todos los mensajes de una conversación (pero conserva la conversación).

**Respuesta (200):** `{ "ok": true }`

---

### 💚 Health Check

#### `GET /api/health` — Estado del servidor

**Respuesta (200):**

```json
{
  "status": "ok",
  "port": 3001
}
```

---

## Tool Reference — Modelo de IA (Tool Calling)

El modelo de IA puede invocar **herramientas (tools)** de forma autónoma durante la conversación gracias al sistema de **Tool Calling nativo** de Ollama. Cada herramienta está definida en formato JSON Schema en `src/lib/skills.tsx` y se ejecuta a través del proxy en `localhost:3001` o directamente desde el navegador.

> ⚡ Para usar Tool Calling necesitas un modelo compatible: `llama3.1`, `qwen2.5`, `mistral-nemo`, etc. (ver tabla de modelos recomendados).

El sistema ejecuta hasta **10 rondas** de tool calls por mensaje, permitiendo workflows multi-herramienta complejos (ej: buscar en web → leer archivo → ejecutar comando → escribir resultado).

---

### 🌐 1. `search_web` — Búsqueda Web

Busca información actualizada en internet. **4 motores en cascada**: Brave Search → Serper.dev → DuckDuckGo → SearXNG.

**Parámetros:**

| Parámetro | Tipo | Obligatorio | Defecto | Descripción |
|-----------|------|-------------|---------|-------------|
| `query` | `string` | ✅ | — | Consulta de búsqueda (inglés da más resultados) |
| `num_results` | `integer` | ❌ | `5` | Resultados a devolver (3–10) |

**Respuesta (JSON):**

```json
{
  "query": "noticias ia 2025",
  "source": "serper",  // "brave" | "serper" | "duckduckgo" | "searxng"
  "count": 5,
  "results": [
    {
      "index": 1,
      "title": "Título",
      "url": "https://ejemplo.com",
      "snippet": "Resumen del contenido..."
    }
  ]
}
```

**Backend:** `GET /api/search?q=...&num=...&brave_key=...&serper_key=...` (proxy local `:3001`)

**Configuración:** Las API keys se añaden desde _Configuración Sistema → Brave Search API / Serper.dev API_. Sin keys, el sistema usa DuckDuckGo + SearXNG automáticamente.

**Proveedor preferido:** Puedes elegir qué motor se intenta primero desde _Configuración Sistema → Proveedor de Búsqueda Preferido_. Opciones: `Auto` (Brave → Serper → DDG → SearXNG), `Brave`, `Serper.dev`, o `DuckDuckGo` (solo gratis, ignora APIs).

---

### 💻 2. `execute_terminal` — Terminal Linux

Ejecuta comandos bash en el servidor y devuelve stdout, stderr y código de salida.

**Parámetros:**

| Parámetro | Tipo | Obligatorio | Defecto | Descripción |
|-----------|------|-------------|---------|-------------|
| `command` | `string` | ✅ | — | Comando a ejecutar. Ej: `"ls -la"`, `"npm install"` |
| `timeout` | `integer` | ❌ | `15` | Timeout máximo (1–60 segundos) |

**Respuesta (JSON):**

```json
{
  "stdout": "total 123\ndrwxr-xr-x ...\n",
  "stderr": "",
  "error": null,
  "code": 0,
  "killed": false
}
```

**Backend:** `POST /api/exec` (proxy local `:3001`)

**Límites:** 60s timeout máximo · 2 MB buffer de salida

---

### 📁 3. `file_manager` — Gestor de Archivos

Lee, escribe, lista y elimina archivos del proyecto. Las rutas son relativas a la raíz del proyecto y están protegidas contra path traversal.

**Parámetros:**

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | `string` | ✅ | `"read"`, `"write"`, `"list"` o `"delete"` |
| `path` | `string` | ✅ | Ruta relativa al proyecto. Ej: `"src/index.ts"` |
| `content` | `string` | ❌ | Contenido a escribir (requerido si `action="write"`) |

**Ejemplos de uso por el modelo:**

- **read** → Lee el contenido de un archivo y lo devuelve como texto
- **write** → Crea o sobrescribe un archivo, creando directorios intermedios automáticamente
- **list** → Lista el contenido de un directorio (nombres y tipos)
- **delete** → Elimina un archivo

**Respuestas típicas:**

```json
// read → archivo
{ "path": "package.json", "type": "file", "content": "{...}", "size": 1234 }

// list → directorio
{ "path": "src", "type": "directory", "children": [{ "name": "App.tsx", "type": "file" }, ...] }

// write → éxito
{ "path": "src/nuevo.ts", "written": true, "size": 35 }

// delete → éxito
{ "path": "src/temp.ts", "deleted": true }
```

**Backend:** `GET|POST|DELETE /api/files/:path(*)` (proxy local `:3001`)

---

### 🖥️ 4. `system_monitor` — Monitor de Sistema

Obtiene información del sistema en tiempo real usando APIs del navegador.

**Parámetros:**

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `info_type` | `string` | ✅ | `"cpu"`, `"memory"`, `"platform"` o `"all"` |

**Respuesta (JSON):**

```json
{
  "platform": {
    "userAgent": "Mozilla/5.0...",
    "language": "es",
    "platform": "Win32",
    "hardwareConcurrency": 8,
    "deviceMemory": 8,
    "online": true
  },
  "cpu": {
    "cores": 8
  },
  "memory": {
    "jsHeapSizeLimit": "219 MB",
    "totalJSHeapSize": "12.3 MB",
    "usedJSHeapSize": "8.1 MB"
  }
}
```

> ℹ️ Esta herramienta se ejecuta **íntegramente en el navegador** — no necesita el proxy.

---

### ✍️ 5. `code_assistant` — Editor Pro / Code Assistant

Analiza, genera o refactoriza código con acceso al proyecto. Carga archivos completos del proyecto para darlos como contexto al modelo.

**Parámetros:**

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | `string` | ✅ | `"analyze"`, `"generate"` o `"refactor"` |
| `language` | `string` | ❌ | Lenguaje. Ej: `"typescript"`, `"python"` |
| `code` | `string` | ❌ | Código a analizar (alternativa a `file_path`) |
| `file_path` | `string` | ❌ | Ruta del archivo a cargar (alternativa a `code`) |
| `instructions` | `string` | ❌ | Instrucciones específicas para la tarea |

**Comportamiento:**

1. Si se proporciona `file_path`, carga el archivo completo del proyecto vía API
2. Devuelve al modelo el contenido del archivo + las instrucciones como contexto
3. El modelo procesa la información y genera la respuesta final

**Backend:** `GET /api/files/:path(*)` para cargar archivos (proxy local `:3001`)

---

### ☁️ 6. `ollama_cloud` — Ollama Cloud

Gestiona conexiones a instancias de Ollama locales o remotas.

**Parámetros:**

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `action` | `string` | ✅ | `"list_models"`, `"test_connection"` o `"switch_model"` |
| `url` | `string` | ❌ | URL del servidor Ollama (requerido para `test_connection`) |
| `model` | `string` | ❌ | Nombre del modelo (requerido para `switch_model`) |

**Acciones:**

| Acción | Descripción | Respuesta |
|--------|-------------|-----------|
| `list_models` | Lista modelos disponibles en Ollama local | `{ "models": ["llama3.1:8b", ...] }` |
| `test_connection` | Prueba conexión a una URL de Ollama | `{ "status": "connected", "url": "...", "models": [...], "model_count": 3 }` |
| `switch_model` | Solicita cambio de modelo activo | `{ "action": "switch_model", "model": "codellama:13b", ... }` |

**Backend:** `GET /api/ollama/models` para listar modelos (proxy local `:3001`); `test_connection` consulta directamente la URL indicada.

---

## Configuración

Accede a **Configuración Sistema** desde la barra lateral para ajustar:

- **Endpoint Ollama** — por defecto `http://localhost:11434`
- **Brave Search API Key** — API key para Brave Search (opcional). Sin key se usa DuckDuckGo + SearXNG
- **Serper.dev API Key** — API key para Google Search vía Serper.dev (opcional, 2500 consultas gratis/mes sin tarjeta). Sin key se usa DuckDuckGo + SearXNG
- **Proveedor de Búsqueda Preferido** — Selecciona qué motor usar primero: `Auto` (Brave → Serper → DDG → SearXNG), `Brave`, `Serper.dev` (Google), o `DuckDuckGo` (solo gratis)
- **Temperatura** — creatividad del modelo (0 – 2)
- **Top P** — diversidad de muestreo (0 – 1)
- **Skills activas** — activa o desactiva herramientas

## Licencia

[Apache 2.0](LICENSE)
