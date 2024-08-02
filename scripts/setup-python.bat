@echo off
setlocal

:: Function to handle errors
:ErrorExit
echo %1
exit /b 1

:: Check if a directory argument is provided
if "%~1"=="" (
    echo Usage: %0 ^<SCRIPTS_DIR^>
    exit /b 1
)

set "SCRIPTS_DIR=%~1"
set "VENV_DIR=%SCRIPTS_DIR%\venv"

:: Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Python could not be found. Installing Python...
    powershell -Command "Start-Process 'msiexec.exe' -ArgumentList '/i, https://www.python.org/ftp/python/3.11.4/python-3.11.4-amd64.exe, /quiet, InstallAllUsers=1, PrependPath=1' -NoNewWindow -Wait"
    if %errorlevel% neq 0 call :ErrorExit "Failed to install Python."
) else (
    echo Python is already installed.
)

:: Check if pip is installed
where pip >nul 2>nul
if %errorlevel% neq 0 (
    echo pip could not be found. Installing pip...
    python -m ensurepip
    if %errorlevel% neq 0 call :ErrorExit "Failed to install pip."
) else (
    echo pip is already installed.
)

:: Check if python-venv is available (it comes with Python 3.3+)
python -m venv --help >nul 2>nul
if %errorlevel% neq 0 (
    echo python -m venv is not available. Please ensure Python 3.3+ is installed.
    call :ErrorExit "Failed to verify venv availability."
)

:: Create a virtual environment
if exist "%VENV_DIR%" (
    echo Removing existing virtual environment...
    rmdir /s /q "%VENV_DIR%"
    if %errorlevel% neq 0 call :ErrorExit "Failed to remove existing virtual environment."
)

echo Creating a virtual environment in the %VENV_DIR% directory...
python -m venv "%VENV_DIR%"
if %errorlevel% neq 0 call :ErrorExit "Failed to create virtual environment."

:: Activate the virtual environment
call "%VENV_DIR%\Scripts\activate.bat"
if %errorlevel% neq 0 call :ErrorExit "Failed to activate virtual environment."

:: Install required Python package in the virtual environment
echo Installing faster-whisper...
pip install faster-whisper pydub
if %errorlevel% neq 0 call :ErrorExit "Failed to install faster-whisper."

:: Deactivate the virtual environment
echo Deactivating the virtual environment...
deactivate
if %errorlevel% neq 0 call :ErrorExit "Failed to deactivate virtual environment."

echo Python setup completed successfully.
endlocal
