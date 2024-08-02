export const ModelList = [
	'tiny',
	'tiny.en',
	'base',
	'base.en',
	'small',
	'small.en',
	'medium',
	'medium.en',
	'large-v1',
	'large-v2',
	'large',
] as const;

export type IFlagTypes = {
    task?: 'transcribe' | 'translate';
    spokenLanguage?: string;
    beamSize?: number;
    patience?: number;
    temperature?: number;
    compressionRatioThreshold?: number;
    cuda?: boolean;
}

export type CppCommandTypes = {
	modelName: typeof ModelList[number];
	filePath: string;
	options?: IFlagTypes;
}

export type IOptions = {
	modelName: typeof ModelList[number];
	whisperOptions?: IFlagTypes;
}

export type WhisperResponse = {
	errors: string[];
} | {
	data: ResponsePart[];
}

export type ResponsePart = {
	start: string;
	end: string;

	text: string;
	certainty: string;
};
