export const ModelListNames = {
	'tiny': 'ggml-tiny.bin',
	'tiny.en': 'ggml-tiny.en.bin',
	'base': 'ggml-base.bin',
	'base.en': 'ggml-base.en.bin',
	'small': 'ggml-small.bin',
	'small.en': 'ggml-small.en.bin',
	'medium': 'ggml-medium.bin',
	'medium.en': 'ggml-medium.en.bin',
	'large-v1': 'ggml-large-v1.bin',
	'large-v2': 'ggml-large-v2.bin',
	'large': 'ggml-large.bin',
} as const;

export const ModelList = Object.keys(ModelListNames);

export type IFlagTypes = {
	threads?: number; // Number of threads to use.
	processors?: number; // Number of processors to use.
	translateToEnglish?: boolean; // Translate to English.
	spokenLanguage?: string; // Spoken language.
	msTimeOffset?: number; // Millisecond time offset.
}

export type CppCommandTypes = {
	modelName: keyof typeof ModelListNames;
	filePath: string;
	options?: IFlagTypes;
}

export type IOptions = {
	modelName: keyof typeof ModelListNames;
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
};
