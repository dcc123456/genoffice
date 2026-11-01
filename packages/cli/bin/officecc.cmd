@echo off
rem officecc launcher for the packaged Windows app: <install>\resources\cli\officecc.cmd
setlocal
set ELECTRON_RUN_AS_NODE=1
"%~dp0..\..\Office-cc.exe" "%~dp0officecc.cjs" %*
endlocal
