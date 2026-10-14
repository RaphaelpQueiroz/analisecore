@echo off
echo ==================================================
echo   Iniciando Publicacao do Dashboard DRE (Vercel)
echo ==================================================
echo.

REM Injetando o caminho do Node.js local no PATH temporariamente
set PATH=C:\Users\rqueiroz\Documents\Portal de Pedidos\node-v24.13.1-win-x64;%PATH%

echo Fazendo o upload para o ambiente de Producao...
echo.

call npx vercel --prod

echo.
echo ==================================================
echo   Processo de Publicacao Concluido!
echo ==================================================
pause
