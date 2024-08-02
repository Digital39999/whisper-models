import { CppCommandTypes, IFlagTypes, ModelListNames } from './types';
import { existsSync } from 'fs';
import path from 'path';

export function createCppCommand({
	modelName,
	filePath,
	options,
}: CppCommandTypes) {
	if (!filePath || !existsSync(filePath)) throw new Error(`'${filePath}' not found!`);
	else if (!modelName || !existsSync(path.join(__dirname, '..', 'models', ModelListNames[modelName]))) throw new Error(`'${modelName}' not downloaded! Run 'npx whisper-models -m ${modelName}'`);

	const whisperFile = path.join(__dirname, '..', 'scripts', 'whisper');
	if (!existsSync(whisperFile)) throw new Error('Whisper not found!');

	const modelPath = path.join(__dirname, '..', 'models', ModelListNames[modelName]);
	if (!existsSync(modelPath)) throw new Error(`'${modelName}' not downloaded! Run 'npx whisper-models -m ${modelName}'`);

	return `${whisperFile} ${getFlags(options)} -m ${modelPath} -f "${filePath}" -np`;
}

export function getFlags(flags?: IFlagTypes) {
	if (!flags) return '';
	let s = '';

	if (flags.threads) s += ` -t ${flags.threads}`;
	if (flags.processors) s += ` -p ${flags.processors}`;
	if (flags.translateToEnglish) s += ' -tr';
	if (flags.spokenLanguage) s += ` -l ${flags.spokenLanguage}`;
	if (flags.msTimeOffset) s += ` -ot ${flags.msTimeOffset}`;

	return s;
}
