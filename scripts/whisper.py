from faster_whisper import WhisperModel
import ctranslate2
import argparse
import logging
import os

ctranslate2.set_log_level(logging.ERROR)

def transcribe_and_translate(file_path, model_name, options):
    device = 'cpu'
    if options.get('cuda', False):
        device = 'cuda'

    current_dir = os.path.dirname(os.path.abspath(__file__))
    full_path = os.path.join(current_dir, '..', 'models', model_name)

    if not os.path.exists(full_path):
        raise ValueError("Model not found: %s" % full_path)
    
    model = WhisperModel(full_path, device=device, local_files_only=True)
     
    task = options.get('task', 'transcribe')
    language = options.get('language', None)
    beam_size = options.get('beam_size', 5)
    patience = options.get('patience', 1)
    temperature = options.get('temperature', None)
    compression_ratio_threshold = options.get('compression_ratio_threshold', 2.4)
    
    if not temperature:
        temperature = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
    
    temperature = [temp for temp in temperature if temp is not None]

    segments, _ = model.transcribe(
        audio=file_path,
        language=language,
        task=task,
        beam_size=beam_size,
        patience=patience,
        temperature=temperature,
        compression_ratio_threshold=compression_ratio_threshold,
        word_timestamps=True,
    )

    return segments

def main():
    parser = argparse.ArgumentParser(description="Transcribe and translate audio files using Whisper")
    parser.add_argument('-f', '--file-path', type=str, required=True, help="Path to the audio file")
    parser.add_argument('-m', '--model-name', type=str, required=True, help="Name of the model to use")
    parser.add_argument('--task', choices=['transcribe', 'translate'], default='transcribe', help="Task to perform")
    parser.add_argument('--language', type=str, help="Language spoken in the audio")
    parser.add_argument('--beam-size', type=int, default=5, help="Beam size for decoding")
    parser.add_argument('--patience', type=float, default=1.0, help="Beam search patience factor")
    parser.add_argument('--temperature', type=float, nargs='+', help="Temperature for sampling, e.g., -temperature 0.1 0.2 0.3")
    parser.add_argument('--compression-ratio-threshold', type=float, default=2.4, help="Compression ratio threshold")
    parser.add_argument('--cuda', action='store_true', help="Use CUDA if available")

    args = parser.parse_args()

    options = {
        'task': args.task,
        'language': args.language,
        'beam_size': args.beam_size,
        'patience': args.patience,
        'temperature': args.temperature,
        'compression_ratio_threshold': args.compression_ratio_threshold,
        'cuda': args.cuda,
    }
    
    total_probability = 0
    word_count = 0

    result = transcribe_and_translate(args.file_path, args.model_name, options)
    
    for segment in result:
        words = segment.words
		
        for word in words:
            total_probability += word.probability
            word_count += 1

        if word_count > 0:
            avg_probability = total_probability / word_count
        else:
            avg_probability = 0
            
        print("[%.2fs -> %.2fs] (%s%%) %s" % (segment.start, segment.end, round(avg_probability * 100, 2), segment.text.strip()))

if __name__ == "__main__":
    main()
