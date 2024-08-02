@echo off
setlocal enabledelayedexpansion

set "src=https://huggingface.co/Systran/faster-whisper"
set "files=config.json model.bin tokenizer.json vocabulary.txt"

set "BOLD=^[[1m"
set "RESET=^[[0m"

rem Whisper models
set "models=tiny tiny.en base base.en small small.en medium medium.en large-v1 large-v2 large-v3"

rem list available models
:ListModels
echo.
echo Available models:
set "model_class="
for %%m in (%models%) do (
    set "this_model_class=%%~m"
    for /f "tokens=1 delims=.-" %%c in ("!this_model_class!") do set "this_model_class=%%c"
    if not "!this_model_class!"=="!model_class!" (
        echo.
        set "model_class=!this_model_class!"
    )
    echo %%m
)
echo.

rem Check arguments
if "%~2"=="" (
    echo Usage: %0 ^<model^> ^<output_directory^>
    call :ListModels
    echo ___________________________________________________________
    echo %BOLD%.en%RESET% = english-only
    exit /b 1
)

set "model=%~1"
set "models_path=%~2"

echo %models% | findstr /w /c:"%model%" >nul
if errorlevel 1 (
    echo Invalid model: %model%
    call :ListModels
    exit /b 1
)

rem Check if output directory is valid
if not exist "%models_path%" (
    echo Output directory '%models_path%' does not exist.
    exit /b 1
) else (
    >nul 2>&1 (
        echo test > "%models_path%\test.txt"
        del "%models_path%\test.txt"
    ) || (
        echo Output directory '%models_path%' is not writable.
        exit /b 1
    )
)

rem create model-specific directory
mkdir "%models_path%\%model%" 2>nul

rem download specified files
for %%f in (%files%) do (
    echo Downloading %%f for model %model% from '%src%' ...
    
    if exist "%models_path%\%model%\%%f" (
        echo File %%f already exists at '%models_path%\%model%', skipping.
        goto :continue
    )

    set "download_url=%src%-!model!/resolve/main/%%f"

    if exist "%ProgramFiles%\GnuWin32\bin\wget.exe" (
        "C:\Program Files\GnuWin32\bin\wget.exe" --no-verbose --show-progress -O "%models_path%\%model%\%%f" "!download_url!"
    ) else if exist "%ProgramFiles%\Git\mingw64\bin\curl.exe" (
        "C:\Program Files\Git\mingw64\bin\curl.exe" -L --output "%models_path%\%model%\%%f" "!download_url!"
    ) else (
        echo Either wget or curl is required to download models.
        exit /b 1
    )

    if errorlevel 1 (
        echo Failed to download %%f for model %model%
        exit /b 1
    )

    :continue
)

endlocal
