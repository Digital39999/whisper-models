# Whisper Models

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
| large     | 2.9 GB | ~4.7 GB |

# Usage

In your project's `package.json` file, add the following line to the `devDependencies` object like so:
```json
{
  "devDependencies": {
	  "whisper-models": "latest"
  }
}
```

and also add the following line to the `scripts` object depending on the package manager you are using and the model you want to download:
```json
{
  "scripts": {
	  "postinstall": "npx whisper-models -m small"
  }
}
