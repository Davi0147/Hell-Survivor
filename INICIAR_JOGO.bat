@echo off
setlocal enabledelayedexpansion
title Hell Survivor - Inicializador e Servidor Local
chcp 65001 >nul
color 0C

echo ===================================================================
echo               HELL SURVIVOR - INICIANDO JOGO
echo ===================================================================
echo.

:: 1. Garantir que estamos na pasta raiz do jogo
cd /d "%~dp0"

:: 2. Encerrar instâncias anteriores que possam estar travando a porta 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    echo [*] Liberando porta 3000 ocupada por processo anterior (PID %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

:: 3. Limpeza profunda de cache do Vite para garantir versão atualizada
echo [*] Limpando cache compilado do Vite (node_modules\.vite)...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite" >nul 2>&1
    echo [OK] Cache antigo do Vite removido com sucesso.
) else (
    echo [OK] Nenhum cache residual encontrado.
)

if exist "dist" (
    rmdir /s /q "dist" >nul 2>&1
)

:: 4. Abrir automaticamente a página no navegador padrão (com delay de 1s para o servidor subir)
echo [*] Agendando abertura automatica no navegador padrao...
start "" cmd /c "timeout /t 1 /nobreak >nul & start http://localhost:3000"

:: 5. Iniciar o servidor Vite forçando reconstrução limpa de bundles (--force)
echo [*] Iniciando servidor Vite na porta 3000...
echo.
echo ===================================================================
echo  Servidor ativo! Para encerrar, feche esta janela ou aperte CTRL + C
echo ===================================================================
echo.

call npx vite --force --port 3000

if errorlevel 1 (
    echo.
    echo [!] Falha ao iniciar via npx. Tentando com npm start...
    call npm start
)

pause
