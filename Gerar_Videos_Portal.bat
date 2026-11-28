@echo off
rem Esteira offline de pilulas (Portal). Le fila_producao\*.md e grava saida_pronta\nome\. Nao publica nada.
cd /d "%~dp0"
set PY=C:\DRSAUDEMENTAL\.tmp\piloto-video-20261110\kokoro-venv\Scripts\python.exe
if not exist "%PY%" set PY=python
"%PY%" scripts\esteira\gerar_lote_offline.py
echo.
echo Concluido. Veja saida_pronta\ e fila_producao\concluidos\.
pause
