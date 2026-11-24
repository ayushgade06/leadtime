import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop, Hl, Kicker, Shot, Source} from '../ui';
import {W} from '../timeline';
import {MAPBOX, PANELBOX, mapCrop, panelCrop} from './layout';

// The greedy optimizer's real output: six sensors on the map, the diminishing-returns chart.
export const Optimizer: React.FC = () => {
	return (
		<AbsoluteFill>
			<Backdrop />
			<Kicker n="05" style={{left: MAPBOX[0]}}>
				THE OPTIMIZER PLACES SIX
			</Kicker>
			<Source style={{right: 96, top: 62}}>LEADTIME · 15 HYPOTHETICAL Mw 8.8 QUAKES · GREEDY PLACEMENT</Source>
			<Shot src="shots/optimized_top.png" box={MAPBOX} keys={[[0, mapCrop(160, 160, 1200)], [W('opt1', 'places') + 40, mapCrop(420, 220, 900)]]}>
				<Hl at={W('opt1', 'six') - 6} until={W('opt2', 'first') - 8} rect={[590, 280, 540, 420]} label="SIX SENSORS, PICKED IN ORDER" dim={0.3} />
			</Shot>
			<Shot src="shots/optimized.png" box={PANELBOX} keys={[[0, panelCrop(90)]]}>
				<Hl at={W('opt2', 'first') - 4} until={W('opt2', 'sixth') - 6} rect={[1438, 168, 86, 168]} label="SENSOR 1" dim={0.35} labelSide="bottom" />
				<Hl at={W('opt2', 'sixth') - 4} until={W('opt3', 'real') - 8} rect={[1814, 290, 76, 52]} label="SENSOR 6" dim={0.35} />
				<Hl at={W('opt3', 'real') - 4} rect={[1424, 374, 480, 200]} label="AGAINST THE REAL NETWORK" dim={0.35} />
			</Shot>
		</AbsoluteFill>
	);
};
