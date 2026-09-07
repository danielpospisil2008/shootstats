@echo off
rem Serve the app locally at http://localhost:8000 -- Windows counterpart of dev.sh
rem
rem Why a server instead of opening index.html directly: with a file:// URL the
rem page has an opaque origin, so Firebase Auth (and localStorage) refuse to work.
rem http://localhost is already an authorized domain in Firebase Auth by default,
rem so sign-in behaves the same as production.
rem
rem Usage:  dev.cmd        -> port 8000
rem         dev.cmd 3000   -> port 3000
rem Double-clicking it in Explorer works too.

setlocal
cd /d "%~dp0"

set "PORT=%~1"
if "%PORT%"=="" set "PORT=8000"

echo Shootstats -^> http://localhost:%PORT%  (Ctrl+C to stop)
echo.

rem The py launcher ships with python.org installs and is the most reliable.
py -3 -c "" >nul 2>&1
if not errorlevel 1 (
    py -3 -m http.server %PORT% --bind 127.0.0.1
    goto :end
)

rem A bare "python" may be the Microsoft Store stub, which exits non-zero
rem without running anything -- the -c probe filters that out.
python -c "" >nul 2>&1
if not errorlevel 1 (
    python -m http.server %PORT% --bind 127.0.0.1
    goto :end
)

rem No Python: fall back to Node. First run downloads http-server (~1 MB).
where node >nul 2>&1
if not errorlevel 1 (
    echo Python not found, falling back to Node's http-server.
    call npx --yes http-server . -p %PORT% -a 127.0.0.1 -c-1
    goto :end
)

echo Neither Python nor Node was found on PATH.
echo.
echo Install Python from https://www.python.org/downloads/
echo and tick "Add python.exe to PATH" during setup, then run this again.
echo.
pause

:end
endlocal
