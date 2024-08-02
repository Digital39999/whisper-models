import { exec } from 'child_process';
import { ModelList } from './types';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

const modelArg = process.argv.find((arg) => arg === '--model' || arg === '-m');
const modelValue = modelArg ? process.argv[process.argv.indexOf(modelArg) + 1] : null;
const models = modelValue ? modelValue.split(',') : [];

const invalidModels = models.filter((model) => !ModelList.includes(model as never));

if (invalidModels.length > 0) {
	console.error(`Invalid model names: ${invalidModels.join(', ')}`);
	process.exit(1);
} else if (models.length === 0) {
	const help = '| Model     | Disk   | RAM     |\n|-----------|--------|---------|\n| tiny      |  75 MB | ~390 MB |\n| tiny.en   |  75 MB | ~390 MB |\n| base      | 142 MB | ~500 MB |\n| base.en   | 142 MB | ~500 MB |\n| small     | 466 MB | ~1.0 GB |\n| small.en  | 466 MB | ~1.0 GB |\n| medium    | 1.5 GB | ~2.6 GB |\n| medium.en | 1.5 GB | ~2.6 GB |\n| large-v1  | 2.9 GB | ~4.7 GB |\n| large     | 2.9 GB | ~4.7 GB |';

	console.error(`Model name is required!\n\n${help}\n`);
	process.exit(1);
}

const canRunShell = process.platform !== 'win32';
const scriptExtension = canRunShell ? '.sh' : '.bat';
const modelsDir = path.join(__dirname, '..', 'models');

const doesWhisperExist = fs.existsSync(path.join(__dirname, '..', 'scripts', 'whisper'));
const doesFasterWhisperExist = fs.existsSync(path.join(__dirname, '..', 'scripts', 'whisper.py'));

const setupWhisper = path.join(__dirname, '..', 'scripts', `setup-whisper${scriptExtension}`);
const setupFasterWhisper = path.join(__dirname, '..', 'scripts', `setup-python${scriptExtension}`);
const script = path.join(__dirname, '..', 'scripts', `download-ggml-model${scriptExtension}`);


if (!fs.existsSync(script)) {
	console.error('Script not found!');
	process.exit(1);
}

if (!fs.existsSync(modelsDir)) {
	fs.mkdirSync(modelsDir);
}

const getErrorMessage = (error: unknown): string => {
	if (error instanceof Error) {
		return error.message;
	} else if (typeof error === 'string') {
		return error;
	} else {
		return 'Unknown error';
	}
};

(async () => {
	await downloadWhisper();
	await downloadFasterWhisper();

	await Promise.all(models.map(downloadModel));
});

// Download and compile whisper.cpp if it doesn't exist.
async function downloadWhisper() {
	try {
		if (!doesWhisperExist) {
			await execAsync(`chmod +x ${setupWhisper}`);
			await execAsync(setupWhisper);
		}
	} catch (error) {
		console.error(`Failed to execute script: ${getErrorMessage(error)}`);
		process.exit(1);
	}
}

// Download pyhton and faster-whisper if it doesn't exist.
async function downloadFasterWhisper() {
	try {
		if (!doesFasterWhisperExist) {
			await execAsync(`chmod +x ${setupFasterWhisper}`);
			const child = exec(setupFasterWhisper);

			child.stdout?.on('data', (data) => {
				process.stdout.write(data);
			});

			child.stderr?.on('data', (data) => {
				process.stderr.write(data);
			});

			child.on('close', (code) => {
				if (code !== 0) {
					console.error(`Script execution failed with code: ${code}`);
					if (code === 127) console.error('Python not found!');
					process.exit(1);
				}

				console.log('Python and faster-whisper are ready!');
			});
		}
	} catch (error) {
		console.error(`Failed to execute script: ${getErrorMessage(error)}`);
		process.exit(1);
	}
}

// Function to download a single model.
async function downloadModel(model: string) {
	try {
		await execAsync(`chmod +x ${script}`);
		const command = `${script} ${model} ${modelsDir}`;
		const child = exec(command);

		child.stdout?.on('data', (data) => {
			process.stdout.write(data);
		});

		child.stderr?.on('data', (data) => {
			process.stderr.write(data);
		});

		child.on('close', async (code) => {
			if (code !== 0) {
				console.error(`Script execution failed with code: ${code}`);
				return;
			}

			const modelFile = path.join(modelsDir, model, 'model.bin');
			if (fs.existsSync(modelFile)) {
				try {
					await execAsync(`make ${modelFile}`);
				} catch (makeError) {
					console.error(`Failed to run 'make': ${getErrorMessage(makeError)}`);
				}
			} else {
				console.error('Model file not found!');
			}
		});
	} catch (error) {
		console.error(`Failed to execute script: ${getErrorMessage(error)}`);
	}
}
