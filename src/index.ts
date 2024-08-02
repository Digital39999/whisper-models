import { IOptions, ResponsePart, WhisperResponse } from './types';
import { createPythonCommand } from './utils';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

export * from './types';
export * from './utils';

const execPromise = promisify(exec);

export default async function whisper(file: string | Buffer, options: IOptions): Promise<WhisperResponse> {
	const { command, tempFilePath } = await createPythonCommand({
		fileOrBuffer: typeof file === 'string' ? path.normalize(file) : file,
		modelName: options.modelName,
		options: options,
	});

	const { stdout, stderr } = await execPromise(command);
	if (tempFilePath) fs.unlinkSync(tempFilePath);

	if (stderr) throw new Error(stderr);
	return { data: parseWhisperResponse(stdout) };
}

export async function rawWhisper(args?: string) {
	const whisperFile = path.join(__dirname, '..', 'scripts', 'whisper');
	if (!fs.existsSync(whisperFile)) throw new Error('Whisper not found!');

	const { stdout, stderr } = await execPromise(`${whisperFile} ${args}`);
	if (stderr) throw new Error(stderr);
	return stdout;
}

function parseWhisperResponse(response: string) {
	console.log(response);
	const regex = /\[(\d+\.\d+s)\s->\s(\d+\.\d+s)\]\s\((\d+\.\d+)%\)\s(.+)/;

	return response.trim().split('\n').map((l) => {
		const match = l.replaceAll(/\s+/g, ' ').match(regex);
		if (!match) return null;

		return {
			start: match[1],
			end: match[2],
			certainty: match[3],
			text: match[4],
		};
	}).filter((p) => p) as ResponsePart[];
}

