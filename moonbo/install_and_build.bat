@echo off
pushd "%~dp0"
cd ..

echo ==========================================
echo Moonbo Android Build Setup Script
echo ==========================================
echo.
echo 1. Installing dependencies (Capacitor)...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. Please make sure Node.js is installed.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Initializing Android platform...
call npx cap add android
if %errorlevel% neq 0 (
    echo [INFO] Android platform might already exist. Syncing instead...
)

echo.
echo 3. Syncing web assets to Android project...
call npx cap sync

echo.
echo ==========================================
echo Setup Complete!
echo Opening Android Studio...
echo ==========================================
call npx cap open android

pause
