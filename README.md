# Whisper Models
Simple package to download and/or use whisper models in your project, wether for transcription, translation, or any other purpose.

|   Model   |  Disk  |   RAM   |
|-----------|--------|---------|
| tiny      |  75 MB | ~390 MB |
| tiny.en   |  75 MB | ~390 MB |
| base      | 142 MB | ~500 MB |
| base.en   | 142 MB | ~500 MB |
| small     | 466 MB | ~1.0 GB |
| small.en  | 466 MB | ~1.0 GB |
| medium    | 1.5 GB | ~2.6 GB |
| medium.en | 1.5 GB | ~2.6 GB |
| large-v1  | 2.9 GB | ~4.7 GB |
| large-v2  | 2.9 GB | ~4.7 GB |
| large-v3  | 2.9 GB | ~4.7 GB |

# Usage

Install the package using your package manager of choice:
```bash
npm install whisper-models
yarn add whisper-models
pnpm add whisper-models
```

and also add the following line to the `scripts` object of the `package.json` depending on the package manager you are using and the model you want to download:
```json
{
  "scripts": {
    "postinstall": "pnpm whisper-models -m small"
  }
}
```

# Transcription
```js
// import whisper from 'whisper-models';
const Whisper = require('whisper-models');

(async () => {
  const whisper = new Whisper('tiny');
	await whisper.run();

  const transcription = await whisper.sendData('path/to/audio/file.wav');
  console.log(transcription);

  // or if you already know the spoken language

  const transcription = await whisper.sendData('path/to/audio/file.wav', { spokenLanguage: 'en' });
  console.log(transcription);
})();
```

# Translation
```js
// import whisper from 'whisper-models';
const Whisper = require('whisper-models');

(async () => {
  const whisper = new Whisper('tiny');
  await whisper.run();

  const translation = await whisper.sendData('path/to/audio/file.wav', { task: 'translate' });
  console.log(translation);
})();
```

# Options
- `task`: The task to perform. Default is `transcribe`.
- `spokenLanguage`: The language spoken in the audio file. Default is `en`.
- `beamSize`: The beam size. Default is `5`.
- `temperature`: The sampling temperature (between 0 and 1). Default is `0`.
- `patience`: The patience for early stopping.
- `maxSegmentLength`: The maximum segment length. Default is `0`.
- `compressionRatioThreshold`: The compression ratio threshold.
- `cuda`: The Nvidia CUDA device to use. Default is `false`.
