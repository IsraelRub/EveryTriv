import { BACKGROUND_ANIMATION_CONFIG, BackgroundWordMotionPath } from '@/constants';
import type { BuildBackgroundWordPathParams, Point2d } from '@/types';

const lerpPosition = (a: Point2d, b: Point2d, t: number): Point2d => ({
	x: a.x + (b.x - a.x) * t,
	y: a.y + (b.y - a.y) * t,
});

const perpendicularUnit = (dx: number, dy: number, chord: number): Point2d => ({
	x: -dy / chord,
	y: dx / chord,
});

export function buildBackgroundWordPath(params: BuildBackgroundWordPathParams): readonly Point2d[] {
	const { start, end, motionPath } = params;
	const dx = end.x - start.x;
	const dy = end.y - start.y;
	const chord = Math.hypot(dx, dy);

	if (chord < 1e-4) {
		return [start, end];
	}

	const perp = perpendicularUnit(dx, dy, chord);

	switch (motionPath) {
		case BackgroundWordMotionPath.Straight:
			return [start, end];

		case BackgroundWordMotionPath.SineWave: {
			const steps = BACKGROUND_ANIMATION_CONFIG.path.sineSteps;
			const positions: Point2d[] = [];
			for (let i = 0; i <= steps; i += 1) {
				const t = i / steps;
				if (i === steps) {
					positions.push(end);
					break;
				}
				const wobble = Math.sin(t * Math.PI * 2 * params.waveCycles) * params.waveAmplitude;
				positions.push({
					x: start.x + dx * t + perp.x * wobble,
					y: start.y + dy * t + perp.y * wobble,
				});
			}
			return positions;
		}

		case BackgroundWordMotionPath.Arc: {
			const mid = lerpPosition(start, end, 0.5);
			return [
				start,
				{
					x: mid.x + perp.x * params.arcBulge,
					y: mid.y + perp.y * params.arcBulge,
				},
				end,
			];
		}

		case BackgroundWordMotionPath.Zigzag: {
			const z = params.zigzagAmplitude;
			const q25 = lerpPosition(start, end, 0.25);
			const q50 = lerpPosition(start, end, 0.5);
			const q75 = lerpPosition(start, end, 0.75);
			return [
				start,
				{ x: q25.x + perp.x * z, y: q25.y + perp.y * z },
				{ x: q50.x - perp.x * z, y: q50.y - perp.y * z },
				{ x: q75.x + perp.x * z, y: q75.y + perp.y * z },
				end,
			];
		}

		case BackgroundWordMotionPath.Serpentine: {
			const p1 = lerpPosition(start, end, 1 / 3);
			const p2 = lerpPosition(start, end, 2 / 3);
			return [
				start,
				{
					x: p1.x + perp.x * params.serpentineOut,
					y: p1.y + perp.y * params.serpentineOut,
				},
				{
					x: p2.x - perp.x * params.serpentineIn,
					y: p2.y - perp.y * params.serpentineIn,
				},
				end,
			];
		}

		default:
			return [start, end];
	}
}

export function motionPathKeyframeTimes(length: number): readonly number[] {
	if (length < 2) {
		return [0, 1];
	}
	return Array.from({ length }, (_, i) => i / (length - 1));
}
