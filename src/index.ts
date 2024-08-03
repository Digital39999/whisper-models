import { WhisperResponse, ModelType, WhisperMessage, IFlagTypes } from './types';
import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

export * from './types';
export * from './utils';

export default class Whisper {
	public isReady = false;
	private pythonProcess: ChildProcessWithoutNullStreams | null = null;
	private promises = new Map<number,(response: WhisperResponse) => void>();

	constructor (readonly modelName: ModelType, readonly device: 'cpu' | 'cuda' = 'cpu', private log = false) {}

	async run() {
		const venvDir = path.join(__dirname, '..', 'scripts', 'venv');
		if (!existsSync(venvDir)) throw new Error('Virtual environment not found!');

		const whisperFile = path.join(__dirname, '..', 'scripts', 'whisper.py');
		if (!existsSync(whisperFile)) throw new Error('Whisper not found!');

		const modelPath = path.join(__dirname, '..', 'models', this.modelName);
		if (!existsSync(path.join(modelPath, 'model.bin'))) throw new Error(`Model not found at ${modelPath}!`);

		const venv = {
			activate: `source ${path.join(venvDir, 'bin', 'activate')}`,
			deactivate: 'deactivate',
		};

		const whisperCommand = (device: 'cpu' | 'cuda') => `${pythonPath} "${whisperFile}" --model "${modelPath}" --device ${device}`;
		const bashCommand = (command: string) => `bash -c '${venv.activate} && ${command} && ${venv.deactivate}'`;

		if (this.log) console.log('[whisper-models]', { venvDir, whisperFile, modelPath, venv });

		const pythonPath = path.join(venvDir, 'bin', 'python3');
		const command = bashCommand(whisperCommand(this.device));

		this.pythonProcess = spawn('bash', ['-c', command]);

		this.pythonProcess.stdout.on('data', (data) => {
			const messages = data.toString().trim().split('\n');
			for (const msg of messages) {
				if (msg) {
					try {
						const response: WhisperMessage = JSON.parse(msg);
						this.handleResponse(response);
					} catch (e) {
						console.error(`Failed to parse response: ${msg}`);
					}
				}
			}
		});

		this.pythonProcess.stderr.on('data', (data) => {
			console.error(`Python error: ${data.toString()}`);
		});

		this.pythonProcess.on('exit', (code) => {
			console.log(`Python process exited with code ${code}`);
		});

		this.isReady = true;
	}

	async sendData(bufferOrFilePath: string | Buffer, options: IFlagTypes = {}) {
		if (!this.isReady || !this.pythonProcess) {
			throw new Error('Whisper process is not ready. Make sure to run() first.');
		}

		if (!bufferOrFilePath) {
			throw new Error('bufferOrFilePath must not be null or undefined.');
		}

		if (this.log) console.log('[whisper-models]', { bufferOrFilePath, options });

		const message: WhisperMessage = {
			op: 1,
			data: {
				options,
				bufferOrFilePath: Buffer.isBuffer(bufferOrFilePath) ? bufferOrFilePath.toString('base64') : bufferOrFilePath,
				isBuffer: Buffer.isBuffer(bufferOrFilePath),
				id: Date.now() + Math.random(),
			},
		};

		return new Promise<WhisperResponse>((resolve) => {
			this.promises.set(message.data.id, resolve);
			this.send(message);
		});
	}

	private send(message: WhisperMessage) {
		if (!this.pythonProcess) throw new Error('Python process is not ready!');
		this.pythonProcess.stdin.write(JSON.stringify(message) + '\n');
	}

	private handleResponse(response: WhisperMessage) {
		const { op, data } = response;

		if (this.log) console.log('[whisper-models]', { op, data });

		switch (op) {
			case 2: {
				const promise = this.promises.get(data.id);
				if (!promise) return;
				promise({ errors: [data.error] });
				this.promises.delete(data.id);
				break;
			}
			case 3: {
				const promise = this.promises.get(data.id);
				if (!promise) return;
				promise({ data: data.segments });
				this.promises.delete(data.id);
				break;
			}
			case 4: {
				this.isReady = data.modelReady;
				break;
			}
		}
	}
}
