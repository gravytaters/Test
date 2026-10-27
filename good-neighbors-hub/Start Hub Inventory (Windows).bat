@echo off
rem Starts Good Neighbors Hub Inventory on this PC and opens it in your browser.
rem Leave this window open while you use the app; close it to stop.
cd /d "%~dp0"
set PORT=8642
set URL=http://localhost:%PORT%/
where py >nul 2>nul && goto py
where python >nul 2>nul && goto python
echo Python isn't installed, so the app can't start a local server.
echo Opening the app file directly instead (live camera scanning and Install won't be available).
start "" "index.html"
exit /b
:py
echo Good Neighbors Hub Inventory is running at %URL%
echo Leave this window open while you use it.
start "" /min powershell -NoProfile -Command "Start-Sleep 2; Start-Process '%URL%'"
py -3 -m http.server %PORT% --bind 127.0.0.1
exit /b
:python
echo Good Neighbors Hub Inventory is running at %URL%
echo Leave this window open while you use it.
start "" /min powershell -NoProfile -Command "Start-Sleep 2; Start-Process '%URL%'"
python -m http.server %PORT% --bind 127.0.0.1
