@echo off
echo ==================================================
echo   Iniciando Servidor Local DRE
echo ==================================================
echo.

set PATH=C:\Users\rqueiroz\Documents\Portal de Pedidos\node-v24.13.1-win-x64;%PATH%

echo Iniciando... (Pressione Ctrl+C duas vezes para parar)
call npm run dev
pause
