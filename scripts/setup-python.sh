#!/bin/bash

# Function to handle errors
function error_exit {
    echo "$1" 1>&2
    exit 1
}

# Check if a directory argument is provided
if [ $# -ne 1 ]; then
    echo "Usage: $0 <SCRIPTS_DIR>"
    exit 1
fi

SCRIPTS_DIR="$1"
VENV_DIR="$SCRIPTS_DIR/venv"

# Check if Python3 is installed
if ! command -v python3 &>/dev/null; then
    echo "Python3 could not be found. Installing Python3..."
    sudo apt-get install -y python3 python3-pip python3-venv python3-full || error_exit "Failed to install Python3 and required packages."
else
    echo "Python3 is already installed."
fi

# Check if pip is installed
if ! command -v pip3 &>/dev/null; then
    echo "pip3 could not be found. Installing pip3..."
    sudo apt-get install -y python3-pip || error_exit "Failed to install pip3."
else
    echo "pip3 is already installed."
fi

# Check if python3-venv is installed, and install if missing
if ! dpkg -l | grep -q python3-venv; then
    echo "python3-venv not found. Installing it..."
    sudo apt-get install -y python3-venv || error_exit "Failed to install python3-venv."
fi

# Create a virtual environment
if [ -d "$VENV_DIR" ]; then
    echo "Removing existing virtual environment..."
    rm -rf "$VENV_DIR" || error_exit "Failed to remove existing virtual environment."
fi

echo "Creating a virtual environment in the $VENV_DIR directory..."
python3 -m venv "$VENV_DIR" || error_exit "Failed to create virtual environment."

# Activate the virtual environment
echo "Activating the virtual environment..."
source "$VENV_DIR/bin/activate" || error_exit "Failed to activate virtual environment."

# Install required Python package in the virtual environment
echo "Installing faster-whisper..."
pip install faster-whisper pydub || error_exit "Failed to install faster-whisper."

# Deactivate the virtual environment
echo "Deactivating the virtual environment..."
deactivate || error_exit "Failed to deactivate virtual environment."

echo "Python setup completed successfully."
