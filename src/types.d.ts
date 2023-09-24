import type {AssetType, SetupStage, VertexRuleEquationType, PointsWorkerMessage} from './constants';
import type TagInput from './tag-input';

export type Coordinate = number[];

export type InputElement = HTMLInputElement | HTMLSelectElement | TagInput;

interface AssetBase {
	fillStyle?: string | CanvasGradient | CanvasPattern;
	strokeStyle?: string | CanvasGradient | CanvasPattern;
	lineWidth?: number;
	fill?: boolean;
	stroke?: boolean;
	hidden?: boolean;
	id?: string;
}
interface CircleAsset extends AssetBase {
	type: AssetType.Circle;
	center: Coordinate;
	radius: number;
}
interface PolygonAsset extends AssetBase {
	type: AssetType.Polygon;
	points: Coordinate[];
}
export type Asset = CircleAsset | PolygonAsset;

interface ParsedVertexRuleVariable {
	type: VertexRuleEquationType.Variable;
	variable: string;
}
interface ParsedVertexRuleNumber {
	type: VertexRuleEquationType.Number;
	number: number;
}
interface ParsedVertexRuleEquation {
	type: VertexRuleEquationType.Equation;
	left: ParsedVertexRule;
	operator: string;
	right: ParsedVertexRule;
}
export type ParsedVertexRule = ParsedVertexRuleEquation | ParsedVertexRuleVariable | ParsedVertexRuleNumber;

export interface SaveConfig {
	version: number;
	stages: {
		[stage in SetupStage]?: {
			[inputName: string]: string | number | boolean | string[];
		};
	};
}

export interface PointsWorkerStartMessage {
	vertices: Coordinate[];
	startPoint: Coordinate;
	pointsCount: number;
	lineProportion: number;
	rawVertexRules: string[];
}

interface PointsWorkerMessagePoints {
	type: PointsWorkerMessage.Points;
	data: ChaosGamePoint[];
}
interface PointsWorkerMessageImpossibleRules {
	type: PointsWorkerMessage.ImpossibleRules;
	data: number;
}
interface PointsWorkerMessageLoadingProgress {
	type: PointsWorkerMessage.LoadingProgress;
	data: number;
}
export type PointsWorkerMessageResponse =
	PointsWorkerMessagePoints |
	PointsWorkerMessageImpossibleRules |
	PointsWorkerMessageLoadingProgress;

export interface ChaosGamePoint {
	point: Coordinate;
	vertexIndex: number;
}

export interface PointsWorkerRandomVertex {
	vertex: Coordinate;
	index: number;
}

export interface RandomPointBoundData {
	min: Coordinate;
	max: Coordinate;
}

export interface SingleStageElementInput {
	element: HTMLInputElement | HTMLSelectElement;
	sanitisation: {
		default: string | number | boolean;
		isFloat?: boolean;
		isInt?: boolean;
		lte?: number;
		mte?: number;
		lt?: number;
		mt?: number;
	};
}
interface SingleStageElementTagInput {
	element: TagInput;
	sanitisation: {
		default: string[];
	};
}
export interface SingleStageData {
	elements?: {
		[name: string]: SingleStageElementInput | SingleStageElementTagInput;
	};
	onStageReset?: () => void;
	onStageExit?: () => void;
}
export type StageData = {
	[stage in SetupStage]?: SingleStageData;
};

export interface Keybinds {
	[key: string]: () => void;
}

export interface NewTagEventDetails {
	tag: string;
	changeTag: (newRule: string) => void;
}

export interface ShapeSettingsInputEvent {
	element: HTMLElement;
	updateGraph: boolean;
}

export interface Account {
	userId: string;
	username: string;
	email: string;
	profilePicture: string;
}
export interface Save {
	id: string;
	name: string;
	data: string;
	screenshot?: string;
}
export interface BackendResponse {
	account: Account;
	saves: Save[];
}

export interface LocalStorageAuth {
	accessToken: string;
	expires: number;
}
