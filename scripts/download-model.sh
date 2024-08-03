#!/bin/sh

src="https://huggingface.co/Systran/faster-whisper"
files="config.json
model.bin
tokenizer.json
vocabulary.txt"

BOLD="\033[1m"
RESET='\033[0m'

# Whisper models
models="tiny
tiny.en
base
base.en
small
small.en
medium
medium.en
large-v1
large-v2
large-v3"

# list available models
list_models() {
    printf "\n"
    printf "Available models:"
    model_class=""
    for model in $models; do
        this_model_class="${model%%[.-]*}"
        if [ "$this_model_class" != "$model_class" ]; then
            printf "\n "
            model_class=$this_model_class
        fi
        printf " %s" "$model"
    done
    printf "\n"
}

# Check arguments
if [ "$#" -ne 2 ]; then
    printf "Usage: %s <model> <output_directory>\n" "$0"
    list_models
    printf "___________________________________________________________\n"
    printf "${BOLD}.en${RESET} = english-only\n"

    exit 1
fi

model=$1
models_path=$2

if ! echo "$models" | grep -q -w "$model"; then
    printf "Invalid model: %s\n" "$model"
    list_models

    exit 1
fi

# Check if output directory is valid
if [ ! -d "$models_path" ]; then
    printf "Output directory '%s' does not exist.\n" "$models_path"
    exit 1
elif [ ! -w "$models_path" ]; then
    printf "Output directory '%s' is not writable.\n" "$models_path"
    exit 1
fi

# create model-specific directory
mkdir -p "$models_path/$model"

# download specified files
for file in $files; do
    printf "Downloading %s for model %s from '%s' to '%s'..\n" "$file" "$model" "$src" "$models_path/$model"
    
    if [ -f "$models_path/$model/$file" ]; then
        printf "File %s already exists at %s, skipping.\n" "$file" "$models_path/$model"
        continue
    fi

    if [ -x "$(command -v wget)" ]; then
        wget --no-config --quiet --show-progress -O "$models_path/$model/$file" "$src-$model/resolve/main/$file"
    elif [ -x "$(command -v curl)" ]; then
        curl -L --output "$models_path/$model/$file" "$src-$model/resolve/main/$file"
    else
        printf "Either wget or curl is required to download models.\n"
        exit 1
    fi

    if [ $? -ne 0 ]; then
        printf "Failed to download %s for model %s\n" "$file" "$model"
        exit 1
    fi
done
