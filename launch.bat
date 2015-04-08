@echo off
cd %~dp0

rem C:\Windows\System32\cmd.exe /k "C:\Program Files\nodejs\nodevars.bat"
call "C:\Program Files\nodejs\nodevars.bat"
node server\index.js
