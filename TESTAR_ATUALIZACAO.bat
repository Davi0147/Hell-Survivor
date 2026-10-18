@echo off
title Hell Survivor - Simulador de Atualizacao (Nova Versao)
color 0A

echo ===================================================================
echo     HELL SURVIVOR - SIMULADOR DE ATUALIZACAO EM PRODUCAO
echo ===================================================================
echo.

REM 1. Garantir que estamos na pasta raiz do projeto
cd /d "%~dp0"

REM 2. Configurar gerador para incluir segundos (garantindo timestamp novo mesmo no mesmo minuto)
set INCLUDE_BUILD_SECONDS=1

REM 3. Recompilar o jogo na pasta dist com o servidor ainda em execucao
echo [*] Recompilando o jogo para simular publicacao de nova versao...
call npm.cmd run build
if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao recompilar o jogo.
    pause
    exit /b 1
)

REM 4. Validar integridade do novo build
echo [*] Validando nova integridade atomica...
call node scripts/verify-build.mjs
if errorlevel 1 (
    echo.
    echo [ERRO] O novo build falhou na verificacao.
    pause
    exit /b 1
)

echo.
echo ===================================================================
echo  SUCESSO: NOVA VERSAO GERADA NA PASTA DIST.
echo ===================================================================
echo.
echo  O QUE FAZER AGORA NO SEU NAVEGADOR:
echo.
echo  1. Volte para a aba do jogo que ja esta aberta no navegador.
echo  2. Se estiver em combate, pause ou aguarde terminar.
echo  3. Em alguns segundos, o aviso "NOVA VERSAO DISPONIVEL" aparecera
echo     no topo da tela.
echo  4. Clique no botao vermelho [ RECARREGAR ].
echo  5. A pagina vai recarregar e o codigo do canto direito de baixo
echo     mudara para a nova data/hora.
echo.
echo ===================================================================
echo.
pause