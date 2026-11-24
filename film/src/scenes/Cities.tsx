import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Backdrop, Hl, Kicker, Shot, Source} from '../ui';
import {W} from '../timeline';
import {MAPBOX, PANELBOX, mapCrop, panelCrop} from './layout';

const fadeAt = (f: number, at: number) => interpolate(f, [at, at + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// Every coastal city, its arrival time and population; and with no sensors, zero people warned.
export const Cities: React.FC = () => {
	const f = useCurrentFrame();
	const head = W('cities2', 'nobody') - 14;
	const x = fadeAt(f, head);
	return (
		<AbsoluteFill>
			<Backdrop />
			<Kicker n="03" style={{left: MAPBOX[0]}}>
				THE PEOPLE IN THE WAY
			</Kicker>
			<Source style={{right: 96, top: 62}}>LEADTIME · SENSORS TAB · 65 CITIES, SOURCED POPULATIONS</Source>
			<Shot src="shots/sensors_none.png" box={MAPBOX} keys={[[0, mapCrop(240, 160, 1100)], [300, mapCrop(300, 200, 1000)]]}>
				<Hl at={W('cities1', 'sixty-five') - 4} until={head} rect={[340, 280, 820, 620]} label="CITY DOTS, SIZED BY POPULATION" dim={0.3} />
			</Shot>
			<Shot src="shots/cities_none.png" box={PANELBOX} keys={[[0, panelCrop(280)]]} style={{opacity: 1 - x}}>
				<Hl at={W('cities1', 'arrives') - 6} until={head} rect={[1680, 340, 220, 520]} label="ARRIVAL · WARNING" dim={0.35} />
			</Shot>
			<Shot src="shots/sensors_none.png" box={PANELBOX} keys={[[head, panelCrop(110)]]} style={{opacity: x}}>
				<Hl at={head + 10} rect={[1426, 150, 476, 180]} label="NOBODY WARNED" color="#ff6b4a" dim={0.35} labelSide="bottom" />
			</Shot>
		</AbsoluteFill>
	);
};
