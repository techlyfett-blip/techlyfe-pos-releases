@echo off
REM Double-click to open the Tech Lyfe TT POS desktop app (this computer).
set POS_URL=https://techlyfe-pos-production.up.railway.app
cd /d "%~dp0"
call npm start
