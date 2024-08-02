#!/bin/bash

# Variables
WHISPER_REPO="https://github.com/ggerganov/whisper.cpp.git"
TEMP_DIR="$(mktemp -d)" # Create a temporary directory
SCRIPTS_DIR="$(dirname "$0")" # Get the directory where the script is located

# Step 1: Clone whisper.cpp into the temporary directory
echo "Cloning whisper.cpp into temporary directory..."
git clone "$WHISPER_REPO" "$TEMP_DIR"

# # Step 3: Compile whisper.cpp
echo "Compiling whisper.cpp..."
cd "$TEMP_DIR"
make

# Check if compilation was successful
if [ $? -ne 0 ]; then
    echo "Compilation failed. Please check for errors."
    rm -rf "$TEMP_DIR" # Clean up the temporary directory
    exit 1
fi

cd ..

# Step 4: Copy the whisper executable to the scripts directory
echo "Moving whisper executable to scripts directory..."

while [ ! -f "$TEMP_DIR/main" ]; do
    sleep 1  # Wait for 1 second before checking again
done

cp "$TEMP_DIR/main" "$SCRIPTS_DIR/whisper"
chmod +x "$SCRIPTS_DIR/whisper"

# Step 5: Clean up
echo "Cleaning up..."
rm -rf "$TEMP_DIR" # Remove the temporary directory
echo "Done! The whisper executable is located in the scripts directory."
