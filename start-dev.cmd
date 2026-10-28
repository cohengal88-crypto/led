@echo off
REM Double-click to start the live dev server: opens http://localhost:5173 in your browser
cd /d "%~dp0"
if not exist node_modules call npm install
call npm run dev
