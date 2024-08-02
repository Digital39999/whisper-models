@echo off
setlocal enabledelayedexpansion

set "src=https://huggingface.co/Systran/faster-whisper"
set "files=config.json model.bin tokenizer.json vocabulary.txt"

set "BOLD="
set "RESET="

REM Whisper models
set "models=tiny tiny.en base base.en small small.en medium medium.en large-v1 large-v2 large-v3"

REM Function to list available models
:ListModels
echo.
echo Available models:
set "model_class="
for %%m in (%models%) do (
    set "this_model_class=%%~m"
    set "this_model_class=!this_model_class:~0,-2!"
    if not "!model_class!"=="!this_model_class!" (
        echo.
        set "model_class=!this_model_class!"
    )
    echo %%m
)
exit /b

REM Check arguments
if "%~2"=="" (
    echo Usage: %0 ^<model^> ^<output_directory^>
    call :ListModels
    echo ___________________________________________________________
    echo %BOLD%.en%RESET% = english-only
    exit /b
)

set "model=%~1"
set "models_path=%~2"

REM Check if the model is valid
echo %models% | findstr /i /c:"%model%" >nul
if errorlevel 1 (
    echo Invalid model: %model%
    call :ListModels
    exit /b
)

REM Check if output directory is valid
if not exist "%models_path%" (
    echo Output directory '%models_path%' does not exist.
    exit /b
) else (
    >nul 2>&1 (
        echo test > "%models_path%\test.txt"
        del "%models_path%\test.txt"
    ) || (
        echo Output directory '%models_path%' is not writable.
        exit /b
    )
)

REM Create model-specific directory
mkdir "%models_path%\%model%" 2>nul

REM Download specified files
for %%f in (%files%) do (
    echo Downloading %%f for model %model% from '%src%' ...
    
    if exist "wget.exe" (
        wget --no-config --quiet --show-progress -O "%models_path%\%model%\%%f" "%src%-%model%/resolve/main/%%f"
    ) else if exist "curl.exe" (
        curl -L --output "%models_path%\%model%\%%f" "%src%-%model%/resolve/main/%%f"
    ) else (
        echo Either wget or curl is required to download models.
        exit /b
    )

    if errorlevel 1 (
        echo Failed to download %%f for model %model%
        exit /b
    )
)

echo Download completed successfully!
