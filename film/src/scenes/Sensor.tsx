import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Backdrop, Hl, Kicker, Shot, Source} from '../ui';
import {W} from '../timeline';
import {MAPBOX, PANELBOX, mapCrop, panelCrop} from './layout';

const fadeAt = (f: number, at: number) => interpolate(f, [at, at + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

// One real sensor click: dots flip from coral to mint, the headline from 0 to 73.1 M,
// and Chennai's row shows its 101 minutes.
export const Sensor: React.FC = () => {
	const f = useCurrentFrame();
	const drop = W('sensor1', 'drop') - 2;
	const num = W('sensor1', 'seventy-three') - 8;
	const table = W('sensor2', 'chennai') - 12;
	const after = fadeAt(f, drop + 6);
	const panelB = fadeAt(f, num);
	const panelC = fadeAt(f, table);
	return (
		<AbsoluteFill>
			<Backdrop />
			<Kicker n="04" style={{left: MAPBOX[0]}}>
				YOU PLACE ONE SENSOR
			</Kicker>
			<Source style={{right: 96, top: 62}}>LEADTIME · ONE CLICK AT 4.5° N, 90.5° E (3,101 M DEEP)</Source>
			<Shot src="shots/sensors_none.png" box={MAPBOX} keys={[[0, mapCrop(420, 230, 900)], [drop + 60, mapCrop(520, 260, 760)]]} />
			<Shot src="shots/sensor_one.png" box={MAPBOX} keys={[[0, mapCrop(420, 230, 900)], [drop + 60, mapCrop(520, 260, 760)]]} style={{opacity: after}}>
				<Hl at={drop + 8} until={table + 20} rect={[912, 508, 46, 46]} label="SENSOR 1" dim={0.15} />
			</Shot>
			<Shot src="shots/sensors_none.png" box={PANELBOX} keys={[[0, panelCrop(110)]]} style={{opacity: 1 - panelB}} />
			<Shot src="shots/sensor_one.png" box={PANELBOX} keys={[[0, panelCrop(110)]]} style={{opacity: panelB * (1 - panelC)}}>
				<Hl at={num + 6} until={table} rect={[1426, 195, 476, 135]} label="PEOPLE WITH ≥ 15 MIN" dim={0.35} />
			</Shot>
			<Shot src="shots/far_one.png" box={PANELBOX} keys={[[table, panelCrop(280)]]} style={{opacity: panelC}}>
				<Hl at={W('sensor2', 'chennai') - 2} rect={[1430, 782, 468, 62]} label="CHENNAI" dim={0.4} />
			</Shot>
		</AbsoluteFill>
	);
};
