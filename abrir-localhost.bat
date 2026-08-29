@echo off
REM Si WAMP (Apache) esta apagado, use el servidor PHP en el puerto 8765.
start http://localhost:8765/
if exist "C:\wamp64\bin\php\php8.3.28\php.exe" (
  start "ovaHogar servidor local" /MIN "C:\wamp64\bin\php\php8.3.28\php.exe" -S localhost:8765 -t "C:\wamp64\www\ovahogar-distribuidora"
)
