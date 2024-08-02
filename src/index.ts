import { IOptions, ResponsePart, WhisperResponse } from './types';
import { createCppCommand } from './utils';
import ffmpegPath from 'ffmpeg-static';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

export default async function whisper(filePath: string, options: IOptions): Promise<WhisperResponse> {
	await checkAudio(filePath);

	const command = createCppCommand({
		filePath: path.normalize(filePath),
		modelName: options.modelName,
		options: options.whisperOptions,
	});

	const { stdout, stderr } = await execPromise(command);
	if (stderr) return { errors: stderr.split('\n').map((e) => e.trim()).filter((e) => e) };
	return { data: parseWhisperResponse(stdout) };
}

export async function rawWhisper(args?: string) {
	const whisperFile = path.join(__dirname, '..', 'scripts', 'whisper');
	if (!fs.existsSync(whisperFile)) throw new Error('Whisper not found!');

	const { stdout, stderr } = await execPromise(`${whisperFile} ${args}`);
	if (stderr) throw new Error(stderr);
	return stdout;
}

async function checkAudio(filePath: string) {
	if (!filePath) throw new Error('No file path provided.');
	if (!fs.existsSync(filePath)) throw new Error(`'${filePath}' not found!`);

	const fileExtension = path.extname(filePath).toLowerCase();
	if (fileExtension !== '.wav' || await isSampleRateNot16000(filePath)) await convertToWav(filePath);
}

async function convertToWav(inputFilePath: string) {
	const tempFilePath = inputFilePath.replace(path.extname(inputFilePath), '_temp.wav');
	const command = `ffmpeg -y -i "${inputFilePath}" -acodec pcm_s16le -ac 1 -ar 16000 "${tempFilePath}"`;

	try {
		const { stderr } = await execPromise(command);

		if (stderr && stderr.toLowerCase().includes('error')) {
			throw new Error(stderr);
		}

		fs.unlinkSync(inputFilePath);
		fs.renameSync(tempFilePath, inputFilePath);
	} catch (error) {
		console.error('Error converting file:', error);
		throw error;
	}
}


async function isSampleRateNot16000(filePath: string) {
	const { stdout } = await execPromise(`${ffmpegPath} -y -i "${filePath}" 2>&1 | grep "Hz"`);
	if (!stdout) return false;

	const sampleRate = stdout.match(/(\d+) Hz/);
	return sampleRate ? sampleRate[1] !== '16000' : false;
}

function parseWhisperResponse(response: string) {
	const regex = /\[(\d{2}:\d{2}:\d{2}\.\d{3})\s-->\s(\d{2}:\d{2}:\d{2}\.\d{3})\]\s(.+)/;

	return response.trim()?.split('\n')?.map((l) => {
		const match = l.replaceAll(/\s+/g, ' ').match(regex);
		if (!match) return null;

		return {
			start: match[1],
			end: match[2],
			text: match[3],
		};
	}).filter((p) => p) as ResponsePart[];
}
