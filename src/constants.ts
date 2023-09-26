// Should match max-width value used in style.css
export const MINIMUM_SCREEN_WIDTH_FOR_MOBILE = 768;

export const DEFAULT_ZOOM_LEVEL = 1;
export const MIN_ZOOM_LEVEL = 0.01;
export const MAX_ZOOM_LEVEL = 10;
export const GRID_LINE_FREQUENCY = 50;
export const MINOR_GRID_LINE_ALPHA = 0.2;
export const MAJOR_GRID_LINE_ALPHA = 0.5;

export const SCREENSHOT_GENEREATION_CHECK_INTERVAL = 1000;

export enum AssetType {
	Circle,
	Polygon,
}

export enum VertexRuleEquationType {
	Equation,
	Number,
	Variable,
}

export enum PointsWorkerMessage {
	LoadingProgress,
	ImpossibleRules,
	Points,
}

export enum SetupStage {
	Reset,
	ShapeType,
	ShapeSettings,
	GeneratePoints,
	Playback,
}

export const polygonShapeNames = {
	3: 'triangle',
	4: 'square',
	5: 'pentagon',
	6: 'hexagon',
	7: 'heptagon',
	8: 'octagon',
	9: 'nonagon',
	10: 'decagon',
	11: 'hendecagon',
	12: 'dodecagon',
	13: 'tridecagon',
	14: 'tetradecagon',
	15: 'pentadecagon',
	16: 'hexadecagon',
	17: 'heptadecagon',
	18: 'octadecagon',
	19: 'enneadecagon',
	20: 'icosagon',
};

// Needs to match backend in github.com/danielhoward-me/chaos-backend/screenshot/status
export enum ScreenshotStatus {
	Generated,
	Failed,
	Generating,
	InQueue,
	NotInQueue,
}
