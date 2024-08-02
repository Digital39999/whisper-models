import { CppCommandTypes, IFlagTypes } from './types';
import { existsSync } from 'fs';
import path from 'path';

export async function createPythonCommand({
	modelName,
	filePath,
	options,
}: CppCommandTypes) {
	if (!filePath || !existsSync(filePath)) throw new Error(`'${filePath}' not found!`);
	else if (!modelName || !existsSync(path.join(__dirname, '..', 'models', modelName, 'model.bin'))) throw new Error(`'${modelName}' not downloaded! Run 'npx whisper-models -m ${modelName}'`);

	const venvDir = path.join(__dirname, '..', 'scripts', 'venv');
	if (!existsSync(venvDir)) throw new Error('Virtual environment not found!');

	const whisperFile = path.join(__dirname, '..', 'scripts', 'whisper.py');
	if (!existsSync(whisperFile)) throw new Error('Whisper not found!');

	const venv = {
		activate: `source ${path.join(venvDir, 'bin', 'activate')}`,
		deactivate: 'deactivate',
	};

	const pythonPath = path.join(venvDir, 'bin', 'python3');
	const whisperCommand = `${pythonPath} ${whisperFile} ${getFlags(options)} -m "${modelName}" -f "${filePath}"`;

	return `bash -c '${venv.activate} && ${whisperCommand} && ${venv.deactivate}'`;
}

export function getFlags(flags?: IFlagTypes) {
	if (!flags) return '';
	let s = '';

	if (flags.task) s += ` --task ${flags.task}`;
	if (flags.spokenLanguage) s += ` --language ${flags.spokenLanguage}`;
	if (flags.beamSize) s += ` --beam_size ${flags.beamSize}`;
	if (flags.patience) s += ` --patience ${flags.patience}`;
	if (flags.temperature) {
		if (flags.temperature < 0 || flags.temperature > 1) throw new Error('Temperature must be between 0 and 1');
		s += ` --temperature ${flags.temperature}`;
	}
	if (flags.compressionRatioThreshold) s += ` --compression_ratio_threshold ${flags.compressionRatioThreshold}`;
	if (flags.cuda) s += ' --cuda true';

	return s;
}

