# CHANGELOG — TurboEric_GB

> Documentación completa de todos los cambios realizados durante la sesión de optimización y corrección.

---

## 📋 Resumen de archivos modificados

| Archivo | Tipo de cambio | Líneas aprox. |
|---------|---------------|--------------|
| `run.ps1` | ✏️ Reescrito completo | ~160 líneas |
| `server.ts` | ✏️ Ampliado (+130 líneas) | ~265 líneas |
| `src/lib/skills.tsx` | ✏️ Reescrito completo (+250 líneas) | ~370 líneas |
| `src/lib/ollama.ts` | ✏️ Modificado (1 línea) | ~150 líneas |
| `README.md` | ✏️ Ampliado (+200 líneas) | ~350 líneas |
| `CHANGELOG.md` | 🆕 **Este archivo** | — |

---

## 1. `run.ps1` — Script de arranque para Windows

### 🔴 Bugs corregidos

| Bug | Síntoma | Solución |
|-----|---------|----------|
| **`-ArgumentList` como string simple** | `npx` recibía `"tsx server.ts"` como un solo argumento → fallaba | Cambiado a array `@("--yes", "tsx", "server.ts")` |
| **Ventana se cierra sin mostrar errores** | Al hacer doble clic, la ventana de PowerShell se abría y cerraba instantáneamente | Agregado `$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")` al final |
| **Sin `Set-Location`** | El script se ejecutaba desde cualquier directorio, no desde su ubicación | Agregado `Set-Location $scriptDir` al inicio |
| **UTF-8 sin BOM** | PowerShell 5.1 lee UTF-8 sin BOM como ANSI → caracteres `$` y acentos corruptos | BOM UTF-8 agregado (`0xEF BB BF`) vía `WriteAllBytes` |
| **`&&` en string** | PS 5.1 no soporta el operador `&&` (es de PS 7+) | Cambiado a `;` |

### 🆕 Gestión automática de Ollama

Nueva lógica de arranque inteligente:

```
1. Ping rápido a localhost:11434/api/tags (2s timeout)
   ├─ ✅ Responde → no toca nada, sigue adelante
   └─ ❌ No responde:
       ├─ ¿existe ollama.exe en PATH?
       │   └─ ❌ No → muestra advertencia, no bloquea
       ├─ ¿proceso ollama está corriendo?
       │   ├─ Sí → Stop-Process + espera activa (5s polling)
       │   └─ No → arranque limpio
       ├─ Start-Process ollama serve (hereda $env:OLLAMA_ORIGINS)
       └─ Polling 15s con dots progresivos hasta que responda
```

**Protección anti-race condition:** Después de `Stop-Process`, sondea cada 500ms hasta 5s para confirmar que el proceso realmente murió antes de reiniciar (Windows puede auto-reiniciar Ollama).

### 🔧 Otras mejoras

- `npx` → `npx.cmd` (Start-Process encuentra mejor el ejecutable con extensión)
- `-WindowStyle Hidden` en vez de `-NoNewWindow`
- Verificación de `node_modules/.bin/tsx` antes de arrancar
- Liberación automática del puerto 3001 si está ocupado
- `try/catch/finally` para limpiar el proxy al salir

---

## 2. `server.ts` — Proxy Express (5 nuevos endpoints)

### Nuevos endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/exec` | `POST` | Ejecuta comandos bash con timeout (máx 60s, buffer 2MB) |
| `/api/files/*` | `GET` | Lee contenido de archivo o lista contenido de directorio |
| `/api/files/*` | `POST` | Crea/sobrescribe archivo con creación automática de directorios |
| `/api/files/*` | `DELETE` | Elimina archivo |
| `/api/ollama/models` | `GET` | Lista modelos disponibles en Ollama local |

### Seguridad

- **`safeResolve()`** — función que previene path traversal: resuelve la ruta contra `PROJECT_ROOT` y rechaza cualquier ruta que quede fuera del proyecto
- Timeout máximo de 60s para ejecución de comandos
- Buffer máximo de 2MB para stdout/stderr

### Portabilidad

- `import.meta.dirname` → `fileURLToPath(import.meta.url)` + `dirname()` (compatible con Node.js < 21.2)
- `mkdir` importado estáticamente desde `fs/promises` (antes era dinámico)

---

## 3. `src/lib/skills.tsx` — Sistema de herramientas completo

### De 1 a 6 herramientas reales

Antes: solo `search_web` tenía una definición de herramienta real y un executor funcional.

Ahora: **las 6 skills tienen herramientas completas** que el modelo de IA puede invocar:

| Skill | Tool Name | Función |
|-------|-----------|---------|
| Buscador Web | `search_web` | Búsqueda web vía proxy SearXNG + DuckDuckGo |
| Terminal Linux | `execute_terminal` | Ejecuta comandos shell vía `POST /api/exec` |
| Gestor de Archivos | `file_manager` | CRUD de archivos vía `/api/files/*` |
| Monitor de Sistema | `system_monitor` | CPU, memoria, plataforma desde APIs del navegador |
| Editor Pro | `code_assistant` | Carga archivos del proyecto para análisis/generación/refactor |
| Ollama Cloud | `ollama_cloud` | test_connection, list_models, switch_model |

### Restricciones eliminadas

| Antes | Ahora |
|-------|-------|
| `web` y `cloud` empezaban `active: false` | **Todas activas por defecto** |
| `num_results` era `type: 'string'` | Ahora es `type: 'integer'` |
| Solo 1 tool type definition | **6 tool definitions** completas con descripciones, parámetros y validación |
| `hasToolDefinition()` exportado sin uso | **Eliminado** (dead code) |

### Executor mejorado

Cada herramienta en `executeSkillTool()` ahora:
- Valida parámetros de entrada
- Se comunica con el proxy (`localhost:3001`) o usa APIs del navegador
- Maneja errores con mensajes descriptivos en español
- Devuelve JSON estructurado para que el modelo pueda interpretarlo

---

## 4. `src/lib/ollama.ts` — Más rondas de tool calls

| Antes | Ahora |
|-------|-------|
| Máximo **5 rondas** de tool calls | Máximo **10 rondas** |

Esto permite workflows multi-herramienta complejos (ej: buscar en web → leer archivo → ejecutar comando → generar código).

---

## 5. `README.md` — Documentación completa

### Secciones agregadas

| Sección | Contenido |
|---------|-----------|
| **Instalación Windows 11** | Paso a paso: Node.js, Ollama, clonar, Execution Policy, ejecución |
| **Configurar CORS para Ollama** | 3 opciones en español con código PowerShell |
| **Opción A — Variable permanente** | `[System.Environment]::SetEnvironmentVariable` |
| **Opción B — Variable de sesión** | `$env:OLLAMA_ORIGINS = "*"` + `ollama serve` |
| **Opción C — run.ps1 automático** | Describe el comportamiento real del script (ping → restart → poll) |
| **Banner "salta esta sección"** | Al inicio de CORS: si usas run.ps1, sáltatelo |
| **Verificar CORS** | Pasos para diagnosticar problemas de conexión |
| **Solución de problemas** | Tabla con 6 problemas comunes de Windows y soluciones |
| **Arranque manual** | Comandos PowerShell sin run.ps1 |

### Correcciones

- **Numeración duplicada**: Las secciones 4, 4, 5 → corregido a 4, 5, 6
- **Opción C desactualizada**: Ahora refleja el comportamiento real de `run.ps1` (gestión automática de Ollama)
- **Árbol de arquitectura**: Actualizado con `run.ps1`

---

## Resumen técnico

```
🔧 5 archivos modificados
➕ 5 nuevos endpoints API
🛠️  6 herramientas funcionales para el modelo de IA
🐛 5 bugs corregidos en run.ps1
🚫 2 restricciones eliminadas (skills inactivas, tipo string)
📝 +200 líneas de documentación
```
