@echo off
pushd "%~dp0"
cd ..

echo ==========================================
echo Moonbo Direct APK Builder
echo ==========================================

echo.
echo 1. Checking dependencies...
if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
)

echo.
echo 2. Setting up Android project...
if not exist "android" (
    echo Creating Android platform...
    call npx cap add android
)

echo.
echo 3. Syncing code...
call npx cap sync

echo.
echo 4. Building APK (This may take a few minutes)...
echo If this fails, you might need to install Java (JDK).
echo.

cd android
if exist "gradlew.bat" (
    call gradlew.bat assembleDebug
) else (
    echo [ERROR] Gradle wrapper not found. 'npx cap add android' might have failed.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ==========================================
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo [SUCCESS] APK Build Successful!
    echo Copying APK to moonbo folder...
    copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "moonbo\moonbo_app.apk"
    echo.
    echo APK File: moonbo\moonbo_app.apk
    echo.
    echo Opening folder...
    explorer moonbo
) else (
    echo [ERROR] APK build failed.
    echo.
    echo Possible reasons:
    echo 1. Java (JDK) is not installed or JAVA_HOME is not set.
    echo 2. Android SDK is missing.
    echo.
    echo Try installing Android Studio manually if you haven't.
)
echo ==========================================
pause
