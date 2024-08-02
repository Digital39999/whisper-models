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
	'large-v3',
] as const;

export type ModelType = typeof ModelList[number];

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
	modelName: ModelType;
	fileOrBuffer: string | Buffer;
	options?: IFlagTypes;
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
}

export type SendData = {
	bufferOrFilePath: string | Buffer;
	options?: IFlagTypes;
	isBuffer: boolean;
}

export type WhisperMessage = {
	op: 1;
	data: SendData & {
		id: number;
	};
} | {
	op: 2;
	data: {
		id: number;
		error: string;
	};
} | {
	op: 3;
	data: {
		id: number;
		segments: ResponsePart[];
	};
} | {
	op: 4;
	data: {
		modelReady: boolean;
	};
}
