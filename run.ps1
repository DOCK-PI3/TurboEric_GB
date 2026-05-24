<#
.SYNOPSIS
    Script de inicio para TurboEric_GB en Windows.
.DESCRIPTION
    Configura CORS para Ollama, instala dependencias si es necesario,
    inicia el proxy de búsqueda (server.ts) y arranca la interfaz Vite.
.NOTES
    Si al hacer doble clic la ventana se cierra inmediatamente:
      1. Abre PowerShell como Administrador y ejecuta:
         Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
      2. Vuelve a hacer doble clic en run.ps1
#>

Write-Host "🚀 Iniciando TurboEric_GB..." -ForegroundColor Cyan

# ── Ir al directorio del script ──────────────────────────────────────────────
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
Write-Host "📁 Directorio: $scriptDir" -ForegroundColor Gray

# ── Configurar CORS para Ollama ──────────────────────────────────────────────
$env:OLLAMA_ORIGINS = "*"
Write-Host "🌐 OLLAMA_ORIGINS configurado en '*'" -ForegroundColor Green

# ── Verificar/reiniciar Ollama con CORS ─────────────────────────────────────

# Primero, comprobar si ollama ya responde (para evitar reiniciar si no hace falta)
$ollamaYaResponde = $false
try {
    $ping = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -ErrorAction Stop
    if ($ping.StatusCode -eq 200) { $ollamaYaResponde = $true }
} catch { }

if (-not $ollamaYaResponde) {
    # Verificar que el ejecutable ollama existe en PATH antes de tocar nada
    $ollamaExe = Get-Command ollama -ErrorAction SilentlyContinue
    if (-not $ollamaExe) {
        Write-Host "⚠️  Ollama no encontrado en PATH. Instálalo desde: https://ollama.com/download/windows" -ForegroundColor Yellow
        Write-Host "   Puedes seguir usando la app si configuras un endpoint remoto en Ajustes." -ForegroundColor Gray
    } else {
        # Detectar si el proceso está corriendo
        $ollamaRunning = $false
        try {
            $null = Get-Process -Name ollama -ErrorAction Stop
            $ollamaRunning = $true
        } catch { }

        if ($ollamaRunning) {
            Write-Host "🔄 Ollama está corriendo pero no responde. Reiniciando con CORS..." -ForegroundColor Yellow
            Stop-Process -Name ollama -Force -ErrorAction SilentlyContinue
            # Esperar a que el proceso termine completamente (Windows puede auto-reiniciarlo)
            Start-Sleep -Seconds 1
            for ($retry = 0; $retry -lt 10; $retry++) {
                $p = Get-Process -Name ollama -ErrorAction SilentlyContinue
                if (-not $p) { break }
                Start-Sleep -Milliseconds 500
            }
        } else {
            Write-Host "⏳ Ollama no está corriendo. Arrancando..." -ForegroundColor Cyan
        }

        # Iniciar Ollama en segundo plano (hereda $env:OLLAMA_ORIGINS)
        Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden

        # Esperar a que Ollama esté listo (sondeo al puerto 11434, máx 15s)
        Write-Host "   Conectando con Ollama" -ForegroundColor Gray -NoNewline
        $ollamaReady = $false
        for ($i = 1; $i -le 15; $i++) {
            Start-Sleep -Seconds 1
            try {
                $test = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 2 -ErrorAction Stop
                if ($test.StatusCode -eq 200) {
                    $ollamaReady = $true
                    break
                }
            } catch { }
            Write-Host "." -ForegroundColor Gray -NoNewline
        }

        Write-Host ""  # Nueva línea

        if ($ollamaReady) {
            Write-Host "✅ Ollama listo en http://localhost:11434" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Ollama no respondió después de 15 segundos." -ForegroundColor Yellow
            Write-Host "   Verifica que esté instalado: https://ollama.com/download/windows" -ForegroundColor Gray
        }
    }
} else {
    Write-Host "✅ Ollama ya está disponible en http://localhost:11434" -ForegroundColor Green
}

# ── Verificar/instalar dependencias ──────────────────────────────────────────
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 No se encontraron dependencias. Instalando..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al instalar dependencias (código: $LASTEXITCODE)" -ForegroundColor Red
        Write-Host "   Revisa que tengas Node.js instalado: https://nodejs.org/" -ForegroundColor Gray
        pause
        exit 1
    }
    Write-Host "✅ Dependencias instaladas." -ForegroundColor Green
} else {
    Write-Host "✅ Dependencias detectadas." -ForegroundColor Green
}

# ── Verificar que tsx esté instalado ─────────────────────────────────────────
if (-not (Test-Path "node_modules\.bin\tsx")) {
    Write-Host "⚠️  tsx no encontrado en node_modules. Instalando..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
        pause
        exit 1
    }
}

# ── Liberar puerto 3001 si está ocupado ──────────────────────────────────────
try {
    $portLine = netstat -ano | Select-String ":3001\s"
    if ($portLine) {
        $pid = ($portLine.Line -split '\s+')[-1]
        if ($pid -and $pid -ne '0' -and $pid -ne '') {
            Write-Host "⚠️  Puerto 3001 ocupado por PID $pid, liberando..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 1
            Write-Host "✅ Puerto 3001 liberado." -ForegroundColor Green
        }
    }
} catch {
    Write-Host "⚠️  No se pudo verificar el puerto 3001: $_" -ForegroundColor Yellow
}

# ── Iniciar proxy de búsqueda (server.ts) en ventana oculta ──────────────────
Write-Host "🔍 Arrancando proxy de búsqueda en puerto 3001..." -ForegroundColor Cyan

try {
    # IMPORTANTE: -ArgumentList debe ser un ARRAY, no un solo string.
    # "npx.cmd" explícito para que Start-Process lo encuentre en Windows.
    $proxyProcess = Start-Process -FilePath "npx.cmd" `
        -ArgumentList @("--yes", "tsx", "server.ts") `
        -WindowStyle Hidden `
        -PassThru `
        -ErrorAction Stop

    Write-Host "✅ Proxy iniciado (PID: $($proxyProcess.Id))" -ForegroundColor Green
} catch {
    Write-Host "❌ Error al iniciar el proxy: $_" -ForegroundColor Red
    Write-Host "   Ejecuta manualmente: cd $scriptDir ; npx tsx server.ts" -ForegroundColor Gray
    pause
    exit 1
}

# ── Iniciar Vite (modo desarrollo) ──────────────────────────────────────────
try {
    Write-Host "🔥 Arrancando Vite en http://localhost:3000 ..." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host "   Abre http://localhost:3000 en tu navegador" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Magenta
    Write-Host ""

    npm run dev
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        Write-Host "⚠️  Vite terminó con código $exitCode" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error al ejecutar Vite: $_" -ForegroundColor Red
} finally {
    # ── Limpiar: detener el proxy ────────────────────────────────────────────
    Write-Host ""
    Write-Host "🛑 Deteniendo proxy de búsqueda..." -ForegroundColor Red
    if ($proxyProcess -and !$proxyProcess.HasExited) {
        Stop-Process -Id $proxyProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Proxy detenido." -ForegroundColor Green
    }
}

# ── Pausa final para que la ventana no se cierre sin mostrar errores ────────
Write-Host ""
Write-Host "Presiona ENTER para cerrar esta ventana..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
