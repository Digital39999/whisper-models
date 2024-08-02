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

    # debian based
    if command -v apt-get &>/dev/null; then
        apt-get install -y python3 python3-venv || error_exit "Failed to install Python3 and python3-venv."
    elif command -v yum &>/dev/null; then
        yum install -y python3 python3-venv || error_exit "Failed to install Python3 and python3-venv."
    else
        error_exit "Failed to install Python3 and python3-venv. Unsupported package manager. Please install Python3 and python3-venv manually."
    fi
else
    echo "Python3 is already installed."
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

# Check if pip is installed
if ! command -v pip3 &>/dev/null; then
    echo "pip3 could not be found. Installing pip3..."
    
    # debian based
    if command -v apt-get &>/dev/null; then
        apt-get install -y python3-pip || error_exit "Failed to install pip3."
    elif command -v yum &>/dev/null; then
        yum install -y python3-pip || error_exit "Failed to install pip3."
    else
        error_exit "Failed to install pip3. Unsupported package manager. Please install pip3 manually."
    fi
else
    echo "pip3 is already installed."
fi

# Install required Python package in the virtual environment
echo "Installing faster-whisper..."
pip install faster-whisper pydub av || error_exit "Failed to install faster-whisper."

# Deactivate the virtual environment
echo "Deactivating the virtual environment..."
deactivate || error_exit "Failed to deactivate virtual environment."

echo "Python setup completed successfully."
