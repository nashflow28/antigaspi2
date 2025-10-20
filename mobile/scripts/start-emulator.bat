@echo off
REM Start Android Emulator for Antigaspi Testing
REM Usage: start-emulator.bat [AVD_NAME]

SET DEFAULT_AVD=Antigaspi_Test_Emulator
SET AVD_NAME=%1

IF "%AVD_NAME%"=="" (
    SET AVD_NAME=%DEFAULT_AVD%
)

echo.
echo ======================================
echo   Antigaspi Mobile - Emulator Launcher
echo ======================================
echo.
echo Target AVD: %AVD_NAME%
echo.

REM Check if ADB is available
where adb >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: ADB not found in PATH
    echo.
    echo Please ensure ANDROID_HOME is set and:
    echo   %%ANDROID_HOME%%\platform-tools is in PATH
    echo.
    exit /b 1
)

REM Check if emulator command is available
where emulator >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo ERROR: Emulator command not found in PATH
    echo.
    echo Please ensure ANDROID_HOME is set and:
    echo   %%ANDROID_HOME%%\emulator is in PATH
    echo.
    exit /b 1
)

REM Check if device already running
echo Checking for running devices...
adb devices | findstr /C:"emulator-" >nul 2>nul
IF %ERRORLEVEL% EQU 0 (
    echo.
    echo Emulator is already running:
    adb devices | findstr /C:"device"
    echo.
    echo Use existing emulator or close it first with: adb emu kill
    exit /b 0
)

REM List available AVDs
echo.
echo Available AVDs:
emulator -list-avds
echo.

REM Start emulator
echo Starting emulator: %AVD_NAME%
echo.
echo This will open in a new window...
echo Please wait for the device to boot (may take 1-2 minutes)
echo.

start "Antigaspi Emulator" emulator -avd %AVD_NAME% -no-snapshot-load

REM Wait a few seconds for emulator to initialize
timeout /t 5 /nobreak >nul

REM Wait for device to be ready
echo.
echo Waiting for device to be ready...
call node scripts\wait-for-device.ts 120

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================
    echo   Emulator is ready for testing!
    echo ======================================
    echo.
    exit /b 0
) ELSE (
    echo.
    echo ERROR: Emulator failed to start within timeout
    echo.
    exit /b 1
)
