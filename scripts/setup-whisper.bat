@echo off

REM Variables
set WHISPER_REPO=https://github.com/ggerganov/whisper.cpp.git
set TEMP_DIR=%TEMP%\whisper_cpp_%RANDOM%_%RANDOM%
set SCRIPTS_DIR=%~dp0

REM Step 1: Clone whisper.cpp into the temporary directory
echo Cloning whisper.cpp into temporary directory...
git clone %WHISPER_REPO% %TEMP_DIR%

REM Step 3: Compile whisper.cpp
echo Compiling whisper.cpp...
cd /d %TEMP_DIR%
call make

REM Check if compilation was successful
if errorlevel 1 (
    echo Compilation failed. Please check for errors.
    rd /s /q %TEMP_DIR%
    exit /b 1
)

cd /d %SCRIPTS_DIR%

REM Step 4: Copy the whisper executable to the scripts directory
echo Moving whisper executable to scripts directory...

:wait_for_main
if not exist %TEMP_DIR%\main.exe (
    timeout /t 1 /nobreak >nul
    goto wait_for_main
)

copy %TEMP_DIR%\main.exe %SCRIPTS_DIR%\whisper.exe
attrib +x %SCRIPTS_DIR%\whisper.exe

REM Step 5: Clean up
echo Cleaning up...
rd /s /q %TEMP_DIR%
echo Done! The whisper executable is located in the scripts directory.
