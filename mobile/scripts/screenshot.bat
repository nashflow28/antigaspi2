@echo off
REM Quick screenshot capture and resize for Antigaspi Mobile
REM Usage: screenshot.bat [filename]

cd %~dp0..

if "%1"=="" (
    python scripts/capture-and-resize.py
) else (
    python scripts/capture-and-resize.py %1
)
