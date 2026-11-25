@echo off
cd /d "%~dp0"
where node >NUL 2>NUL || (echo Please install Node.js 20 or later from nodejs.org & pause & exit /b)
start "" http://localhost:4173
node server/gateway.js
pause
