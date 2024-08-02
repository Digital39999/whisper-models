import { existsSync, promises as fsPromises } from 'fs';
import { CppCommandTypes, IFlagTypes } from './types';
import { tmpdir } from 'os';
import path from 'path';

export async function bufferToFile(buffer: Buffer) {
	const tempFilePath = path.join(tmpdir(), `audio_${Date.now()}.wav`);
	await fsPromises.writeFile(tempFilePath, buffer);
	return tempFilePath;
}

export async function createPythonCommand({
	modelName,
	fileOrBuffer,
	options,
}: CppCommandTypes) {
	if (typeof fileOrBuffer === 'string' && !existsSync(fileOrBuffer)) throw new Error(`'${fileOrBuffer}' not found!`);
	else if (!modelName || !existsSync(path.join(__dirname, '..', 'models', modelName, 'model.bin'))) throw new Error(`'${modelName}' not downloaded! Run 'npx whisper-models -m ${modelName}'`);

	const venvDir = path.join(__dirname, '..', 'scripts', 'venv');
	if (!existsSync(venvDir)) throw new Error('Virtual environment not found!');

	const whisperFile = path.join(__dirname, '..', 'scripts', 'whisper.py');
	if (!existsSync(whisperFile)) throw new Error('Whisper not found!');

	const venv = {
		activate: `source ${path.join(venvDir, 'bin', 'activate')}`,
		deactivate: 'deactivate',
	};

	const whisperCommand = (path: string) => `${pythonPath} ${whisperFile} ${getFlags(options)} -m "${modelName}" -f "${path}"`;
	const bashCommand = (command: string) => `bash -c '${venv.activate} && ${command} && ${venv.deactivate}'`;

	const pythonPath = path.join(venvDir, 'bin', 'python3');
	const tempFilePath = Buffer.isBuffer(fileOrBuffer) ? await bufferToFile(fileOrBuffer) : fileOrBuffer;
	const command = bashCommand(whisperCommand(tempFilePath));

	return {
		command,
		tempFilePath: Buffer.isBuffer(fileOrBuffer) ? tempFilePath : undefined,
	};
}

export function getFlags(flags?: IFlagTypes) {
	if (!flags) return '';
	let s = '';

	if (flags.task) s += ` --task ${flags.task}`;
	if (flags.spokenLanguage) s += ` --language ${flags.spokenLanguage}`;
	if (flags.beamSize) s += ` --beam-size ${flags.beamSize}`;
	if (flags.patience) s += ` --patience ${flags.patience}`;
	if (flags.temperature) {
		if (Array.isArray(flags.temperature)) {
			if (flags.temperature.some((t) => t < 0 || t > 1)) throw new Error('Temperature must be between 0 and 1');
			else s += ` --temperature ${flags.temperature.join(' ')}`;
		} else {
			if (flags.temperature < 0 || flags.temperature > 1) throw new Error('Temperature must be between 0 and 1');
			else s += ` --temperature ${flags.temperature}`;
		}
	}
	if (flags.compressionRatioThreshold) s += ` --compression-ratio-threshold ${flags.compressionRatioThreshold}`;
	if (flags.cuda) s += ' --cuda';

	return s;
}

