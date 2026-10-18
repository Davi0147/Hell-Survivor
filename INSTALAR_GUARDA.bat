@echo off
cd /d "%~dp0"
node scripts/install-hooks.mjs
if errorlevel 1 pause
