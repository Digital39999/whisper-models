@echo off
setlocal

:: Function to handle errors
:ErrorExit
echo %1
exit /b 1

:: Check if Python is installed
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo Python could not be found. Installing Python...
    :: You can customize the download link to the latest Python installer
    start /wait "" "https://www.python.org/ftp/python/3.10.0/python-3.10.0-amd64.exe" /quiet InstallAllUsers=1 PrependPath=1 Include_test=0
    if %errorlevel% neq 0 call :ErrorExit "Failed to install Python."
) else (
    echo Python is already installed.
)

:: Check if pip is installed
python -m pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo pip could not be found. Installing pip...
    python -m ensurepip --default-pip
    if %errorlevel% neq 0 call :ErrorExit "Failed to install pip."
) else (
    echo pip is already installed.
)

:: Check if venv is available
python -m venv --help >nul 2>&1
if %errorlevel% neq 0 (
    call :ErrorExit "Python venv module is not available."
)

:: Create a virtual environment
set VENV_DIR=venv
if exist "%VENV_DIR%" (
    echo Removing existing virtual environment...
    rmdir /s /q "%VENV_DIR%"
)

echo Creating a virtual environment in the %VENV_DIR% directory...
python -m venv "%VENV_DIR%"
if %errorlevel% neq 0 call :ErrorExit "Failed to create virtual environment."

:: Activate the virtual environment
call "%VENV_DIR%\Scripts\activate.bat"
if %errorlevel% neq 0 call :ErrorExit "Failed to activate virtual environment."

:: Install required Python package in the virtual environment
echo Installing faster-whisper...
pip install faster-whisper
if %errorlevel% neq 0 call :ErrorExit "Failed to install faster-whisper."

:: Deactivate the virtual environment
echo Deactivating the virtual environment...
deactivate
if %errorlevel% neq 0 call :ErrorExit "Failed to deactivate virtual environment."

echo Python setup completed successfully.
endlocal
