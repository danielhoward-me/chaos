export type Coordinate = number[];

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
	type: 'circle';
	center: Coordinate;
	radius: number;
}
interface PolygonAsset extends AssetBase {
	type: 'polygon';
	points: Coordinate[];
}
export type Asset = CircleAsset | PolygonAsset;
