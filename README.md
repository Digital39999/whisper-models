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
    "postinstall": "npx whisper-models -m small"
  }
}
```

# Transcription
```js
// import whisper from 'whisper-models';
const whisper = require('whisper-models');

(async () => {
  const transcription = await whisper('path/to/audio/file.wav', { modelName: 'tiny' });
  console.log(transcription);

  // or if you want to optimize for speed

  const transcription = await whisper('path/to/audio/file.wav', { modelName: 'tiny', spokenLanguage: 'en' });
  console.log(transcription);
})();
```

# Translation
```js
// import whisper from 'whisper-models';
const whisper = require('whisper-models');

(async () => {
  const translation = await whisper('path/to/audio/file.wav', { modelName: 'tiny', task: 'translate' });
  console.log(translation);
})();
```

# Options
- `modelName`: The model to use for transcription.
- `spokenLanguage`: The language spoken in the audio file. Default is `en`.
- `translateToEnglish`: Whether to translate the transcription to English or not.
- `threads`: The number of threads to use during computation. Default is `4`.
- `processors`: The number of processors to use during computation. Default is `1`.
- `msTimeOffset`: The time offset in milliseconds. Default is `0`.
- `beamSize`: The beam size. Default is `5`.
- `samplingTemperature`: The sampling temperature (between 0 and 1). Default is `0`.
- `incrementOfTemperature`: The increment of temperature (between 0 and 1). Default is `0.2`.
- `diarization`: Whether to diarize the audio or not. Default is `false`.
- `maxSegmentLength`: The maximum segment length. Default is `0`.
- `splitOnWordThanToken`: Whether to split on word than token. Default is `false`.
