import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {Backdrop, Hl, Kicker, Shot, Source} from '../ui';
import {W} from '../timeline';
import {MAPBOX, PANELBOX, mapCrop, panelCrop} from './layout';
import {Cursor, EV, Take, type Seg} from './take';

// Live recording: one sensor dropped west of Sumatra. Dots flip, the headline jumps from 0 to 73.1 M,
// then the panel scrolls to Chennai's row (✓ 101 min).
export const Sensor: React.FC = () => {
	const {fps} = useVideoConfig();
	const drop = W('sensor1', 'drop') + Math.round(0.25 * fps);
	const src = EV.drop.t - drop / fps;
	const segs: Seg[] = [{start: 0, src, end: EV.chennai.t + 4.3}];
	const media = <Take segs={segs} />;
	const chennai = Math.round((EV.chennai.t - src) * fps);
	return (
		<AbsoluteFill>
			<Backdrop />
			<Kicker n="04" style={{left: MAPBOX[0]}}>
				YOU PLACE ONE SENSOR
			</Kicker>
			<Source style={{right: 96, top: 62}}>LEADTIME · ONE SENSOR AT 4.5° N, 90.5° E · LIVE SCREEN RECORDING</Source>
			<Shot media={media} box={MAPBOX} keys={[[0, mapCrop(420, 230, 900)], [drop + 60, mapCrop(520, 260, 760)]]}>
				<Hl at={drop + 10} until={W('sensor2', 'chennai') - 10} rect={[912, 508, 46, 46]} label="SENSOR 1" dim={0.12} />
				<Cursor segs={segs} clicks={['drop']} />
			</Shot>
			<Shot media={media} box={PANELBOX} keys={[[0, panelCrop(110)], [chennai - 40, panelCrop(110)], [chennai + 20, panelCrop(290)]]}>
				<Hl at={W('sensor1', 'seventy-three') - 4} until={chennai - 30} rect={[1426, 195, 476, 135]} label="PEOPLE WITH ≥ 15 MIN" dim={0.35} />
				<Hl at={Math.max(chennai + 10, W('sensor2', 'chennai') - 4)} rect={[1428, 830, 472, 50]} label="CHENNAI" dim={0.4} />
			</Shot>
		</AbsoluteFill>
	);
};
