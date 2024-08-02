import { exec } from 'child_process';
import { ModelList } from './types';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const execAsyncRealTime = (cmd: string, onClose: (code: number | null) => void) => {
	return new Promise<void>((resolve, reject) => {
		const child = exec(cmd);

		child.stdout?.on('data', (data) => {
			process.stdout.write(data);
		});

		child.stderr?.on('data', (data) => {
			process.stderr.write(data);
		});

		child.on('close', (code) => {
			if (code !== 0) {
				console.error(`Script execution failed with code: ${code}`);
				reject(code);
			}

			onClose(code);
			resolve();
		});
	});
};

const purgeAll = process.argv.find((arg) => arg === '--purge-all');

const modelArg = process.argv.find((arg) => arg === '--model' || arg === '-m');
const modelValue = modelArg ? process.argv[process.argv.indexOf(modelArg) + 1] : null;
const models = modelValue ? modelValue.split(',') : [];

const invalidModels = models.filter((model) => !ModelList.includes(model as never));

if (invalidModels.length > 0 && !purgeAll) {
	console.error(`Invalid model names: ${invalidModels.join(', ')}`);
	process.exit(1);
} else if (models.length === 0 && !purgeAll) {
	const help = '| Model     | Disk   | RAM     |\n|-----------|--------|---------|\n| tiny      |  75 MB | ~390 MB |\n| tiny.en   |  75 MB | ~390 MB |\n| base      | 142 MB | ~500 MB |\n| base.en   | 142 MB | ~500 MB |\n| small     | 466 MB | ~1.0 GB |\n| small.en  | 466 MB | ~1.0 GB |\n| medium    | 1.5 GB | ~2.6 GB |\n| medium.en | 1.5 GB | ~2.6 GB |\n| large-v1  | 2.9 GB | ~4.7 GB |\n| large     | 2.9 GB | ~4.7 GB |';

	console.error(`Model name is required!\n\n${help}\n`);
	process.exit(1);
}

const canRunShell = process.platform !== 'win32';
const scriptExtension = canRunShell ? '.sh' : '.bat';

const modelsDir = path.join(__dirname, '..', 'models');
const scriptsDir = path.join(__dirname, '..', 'scripts');
const venvDir = path.join(scriptsDir, 'venv');

const doesPythonVenvExist = fs.existsSync(path.join(__dirname, '..', 'scripts', 'venv'));
const setupFasterWhisper = path.join(__dirname, '..', 'scripts', `setup-python${scriptExtension}`);
const script = path.join(__dirname, '..', 'scripts', `download-model${scriptExtension}`);

if (purgeAll) {
	if (fs.existsSync(modelsDir)) fs.rmdirSync(modelsDir, { recursive: true });
	if (fs.existsSync(venvDir)) fs.rmdirSync(venvDir, { recursive: true });
	process.exit(0);
}

if (!fs.existsSync(script)) {
	console.error('Script not found!');
	process.exit(1);
}

if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir);
if (!fs.existsSync(scriptsDir)) fs.mkdirSync(scriptsDir);

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
	await downloadFasterWhisper();
	await Promise.all(models.map(downloadModel));
})();

// Download pyhton and faster-whisper if it doesn't exist.
async function downloadFasterWhisper() {
	try {
		if (!doesPythonVenvExist) {
			await execAsync(`chmod +x ${setupFasterWhisper}`);

			await execAsyncRealTime(`${setupFasterWhisper} ${scriptsDir}`, (code) => {
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

		await execAsyncRealTime(`${script} ${model} ${modelsDir}`, async (code) => {
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
