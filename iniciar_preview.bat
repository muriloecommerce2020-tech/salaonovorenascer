@echo off
title Salao Novo Renascer - Preview
echo ======================================================
echo   Iniciando o servidor em http://localhost:5173
echo   Pressione Ctrl+C para encerrar o servidor
echo ======================================================
start http://localhost:5173
call npm run dev
pause
