@echo off
cd /d "%~dp0"
node scripts/jogar-dev.mjs
if errorlevel 1 pause
