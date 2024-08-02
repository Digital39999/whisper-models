from faster_whisper import WhisperModel
import ctranslate2
import numpy as np
import argparse
import base64
import logging
import json
import sys
import io

ctranslate2.set_log_level(logging.ERROR)

class ModelHandler:
    def __init__(self, model_path, device):
        self.model_path = model_path
        self.device = device
        self.model = self.init_model()

    def init_model(self):
        # Initialize the Whisper model
        model = WhisperModel(self.model_path, device=self.device, local_files_only=True)
        # Send a message indicating the model is ready
        self.send_model_ready_message()
        return model

    def send_model_ready_message(self):
        # Send model ready message to Node.js
        ready_message = {"op": 4, "data": {"modelReady": True}}
        print(json.dumps(ready_message))
        sys.stdout.flush()

    def handle_message(self, message):
        op = message.get("op")
        data = message.get("data")
        id = data.get("id") if data else None
        
        if op == 1:  # Handle audio data
            return self.process_data(data, id)
        
        return {"op": 2, "data": {"error": "Unknown operation.", "id": id}}

    def process_data(self, data, id):
        buffer_or_file_path = data.get("bufferOrFilePath")
        isBuffer = data.get("isBuffer")
        options = data.get("options")
        
        task = options.get('task', 'transcribe')
        language = options.get('language', None)
        beam_size = options.get('beam_size', 5)
        patience = options.get('patience', 1)
        temperature = options.get('temperature', None)
        compression_ratio_threshold = options.get('compression_ratio_threshold', 2.4)

        if not temperature:
            temperature = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
        
        temperature = [temp for temp in temperature if temp is not None]

        if isBuffer:
            buffer_or_file_path = base64.b64decode(buffer_or_file_path)
            buffer_or_file_path = io.BytesIO(buffer_or_file_path)

        try:
            segments, _ = self.model.transcribe(
                audio=buffer_or_file_path,
                language=language,
                task=task,
                beam_size=beam_size,
                patience=patience,
                temperature=temperature,
                compression_ratio_threshold=compression_ratio_threshold,
                word_timestamps=True,
            )

            return self.process_segments(segments, id)
        except Exception as e:
            print(f"Error during transcription: {str(e)}")
            return {"op": 2, "data": {"error": "Transcription error.", "id": id}}

    def process_segments(self, segments, id):
        total_probability = 0
        word_count = 0

        segment_array = []

        for segment in segments:
            words = segment.words
            for word in words:
                total_probability += word.probability
                word_count += 1

            avg_probability = total_probability / word_count if word_count > 0 else 0
            segment_array.append({
                "start": segment.start,
                "end": segment.end,
                "probability": round(avg_probability * 100, 2),
                "text": segment.text.strip()
            })

        return {"op": 3, "data": {"segments": segment_array, "id": id}}

    def handle_error(self, data):
        error = data.get("error")
        id = data.get("id")
        print(f"Error encountered: {error}, ID: {id}")
        return {"op": 2, "data": {"error": "Handled error.", "id": id}}

def main():
    parser = argparse.ArgumentParser(description="Transcribe and translate audio files using Whisper")
    parser.add_argument('--model', type=str, required=True, help="Path to the Whisper model")
    parser.add_argument('--device', type=str, default="cpu", help="Device to run the model on (cuda or cpu)")

    args = parser.parse_args()

    model_handler = ModelHandler(args.model, args.device)

    while True:
        input_line = sys.stdin.readline().strip()
        if input_line:
            try:
                message = json.loads(input_line) 
                response = model_handler.handle_message(message)
                print(json.dumps(response))
                sys.stdout.flush()
            except json.JSONDecodeError:
                print(json.dumps({"op": 2, "data": {"error": "Invalid JSON.", "id": None}}))
                sys.stdout.flush()

if __name__ == "__main__":
    main()
