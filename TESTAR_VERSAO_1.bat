@echo off
setlocal enabledelayedexpansion
title Hell Survivor - Teste de Producao (Versao 1)
chcp 65001 >nul
color 0C

echo ===================================================================
echo        HELL SURVIVOR - TESTE DE VERSAO 1 (PRODUCAO / PWA)
echo ===================================================================
echo.

:: 1. Garantir que estamos na pasta raiz do projeto
cd /d "%~dp0"

:: 2. Encerrar instâncias anteriores na porta 8080 para evitar conflitos
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING 2^>nul') do (
    echo [*] Liberando porta 8080 ocupada por processo anterior (PID %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

:: 3. Gerar o build de producao
echo [*] Gerando versao compilada de producao (npm run build)...
call npm.cmd run build
if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao compilar o jogo!
    pause
    exit /b 1
)

:: 4. Validar integridade do build
echo [*] Validando integridade atomica do Service Worker e Index...
call node scripts/verify-build.mjs
if errorlevel 1 (
    echo.
    echo [ERRO] O build falhou na verificacao de integridade!
    pause
    exit /b 1
)

:: 5. Agendar abertura no navegador padrao apos subir o servidor
echo [*] Agendando abertura automatica no navegador...
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8080"

:: 6. Subir o servidor de preview na porta 8080
echo.
echo ===================================================================
echo  SERVIDOR DE TESTE ATIVO EM: http://localhost:8080
echo ===================================================================
echo.
echo  INSTRUCOES PARA O TESTE:
echo  1. O jogo abrira no seu navegador em instantes.
echo  2. Olhe no canto inferior direito da tela e anote o codigo do build.
echo  3. DEIXE ESTA JANELA ABERTA enquanto testa.
echo  4. Para testar a atualizacao automatica, va na pasta e de dois
echo     cliques em "TESTAR_ATUALIZACAO.bat".
echo ===================================================================
echo.

call npx.cmd vite preview --port 8080 --host 127.0.0.1
if errorlevel 1 (
    echo.
    echo [!] Servidor finalizado.
)
pause
