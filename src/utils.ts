import { existsSync, promises as fs } from 'fs';
import path from 'path';

export type ConvertToWavOptions = {
	channels?: number;
	bitDepth?: number;
};

export function convertMonoBufferToWav(monoBuffer: Buffer, sampleRate: number, options: ConvertToWavOptions = {}): Buffer {
	const numChannels = options.channels || 1;
	const bitDepth = options.bitDepth || 16;
	const byteRate = sampleRate * numChannels * (bitDepth / 8);
	const blockAlign = numChannels * (bitDepth / 8);

	const dataChunkSize = monoBuffer.length;
	const fileSize = 36 + dataChunkSize;

	const wavBuffer = Buffer.alloc(44 + dataChunkSize);

	wavBuffer.write('RIFF', 0);
	wavBuffer.writeUInt32LE(fileSize, 4); // File size
	wavBuffer.write('WAVE', 8); // WAVE header
	wavBuffer.write('fmt ', 12); // fmt chunk
	wavBuffer.writeUInt32LE(16, 16); // Subchunk1Size for PCM
	wavBuffer.writeUInt16LE(1, 20); // Audio format (PCM)
	wavBuffer.writeUInt16LE(numChannels, 22); // Number of channels
	wavBuffer.writeUInt32LE(sampleRate, 24); // Sample rate
	wavBuffer.writeUInt32LE(byteRate, 28); // Byte rate
	wavBuffer.writeUInt16LE(blockAlign, 32); // Block align
	wavBuffer.writeUInt16LE(bitDepth, 34); // Bits per sample
	wavBuffer.write('data', 36); // data chunk header
	wavBuffer.writeUInt32LE(dataChunkSize, 40); // Data size

	monoBuffer.copy(wavBuffer, 44, 0, dataChunkSize);

	return wavBuffer;
}

export function getDurationFromBuffer(buffer: Buffer, sampleRate: number): number {
	const bytesPerSample = 2;
	const numberOfSamples = buffer.length / bytesPerSample;

	return numberOfSamples / sampleRate;
}

export async function saveWavFile(monoBuffer: Buffer, outputDir: string, sampleRate: number = 48000) {
	const duration = getDurationFromBuffer(monoBuffer, sampleRate);
	if (duration < 2) return;

	if (!existsSync(outputDir)) throw new Error('Output directory does not exist.');

	const filePath = path.join(outputDir, `${Date.now()}-${Math.random()}.wav`);
	const wavData = convertMonoBufferToWav(monoBuffer, sampleRate);

	await fs.writeFile(filePath, wavData);
	return { filePath, duration };
}
