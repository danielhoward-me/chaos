// Should match max-width value used in style.css
export const MINIMUM_SCREEN_WIDTH_FOR_MOBILE = 768;

export const DEFAULT_ZOOM_LEVEL = 1;
export const MIN_ZOOM_LEVEL = 0.01;
export const MAX_ZOOM_LEVEL = 10;
export const GRID_LINE_FREQUENCY = 50;
export const MINOR_GRID_LINE_ALPHA = 0.2;
export const MAJOR_GRID_LINE_ALPHA = 0.5;

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
	ShapeType,
	ShapeSettings,
	GeneratePoints,
	Playback,
}
