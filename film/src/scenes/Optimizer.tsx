import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, Badge, Hl, Kicker, Shot, Source} from '../ui';
import {W} from '../timeline';
import {MAPBOX, PANELBOX, mapCrop, panelCrop} from './layout';
import {Cursor, EV, Take, type Seg} from './take';

// Live recording: "Optimize" simulates 15 quakes (shown 2× faster, labelled), then six sensors drop in
// and the diminishing-returns chart draws itself.
export const Optimizer: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const start = EV.optimize.t - 0.9;
	const fastLen = Math.round(((EV.opt_done.t - start) / 2) * fps);
	const segs: Seg[] = [
		{start: 0, src: start, end: EV.opt_done.t, rate: 2},
		{start: fastLen, src: EV.opt_done.t, end: EV.banda.t - 2.8},
	];
	const media = <Take segs={segs} />;
	return (
		<AbsoluteFill>
			<Backdrop />
			<Kicker n="05" style={{left: MAPBOX[0]}}>
				THE OPTIMIZER PLACES SIX
			</Kicker>
			<Source style={{right: 96, top: 62}}>LEADTIME · 15 HYPOTHETICAL Mw 8.8 QUAKES · LIVE SCREEN RECORDING</Source>
			<Shot media={media} box={MAPBOX} keys={[[0, mapCrop(160, 140, 1200)], [fastLen, mapCrop(420, 200, 900)]]}>
				<Hl at={W('opt1', 'six') - 6} until={W('opt2', 'first') - 8} rect={[590, 280, 560, 440]} label="SIX SENSORS, PICKED IN ORDER" dim={0.25} />
			</Shot>
			<Shot media={media} box={PANELBOX} keys={[[0, panelCrop(90)]]}>
				<Hl at={W('opt2', 'first') - 4} until={W('opt2', 'sixth') - 6} rect={[1438, 168, 86, 168]} label="SENSOR 1" dim={0.35} labelSide="bottom" />
				<Hl at={W('opt2', 'sixth') - 4} until={W('opt3', 'real') - 8} rect={[1814, 290, 76, 52]} label="SENSOR 6" dim={0.35} />
				<Hl at={W('opt3', 'real') - 4} rect={[1424, 374, 480, 200]} label="AGAINST THE REAL NETWORK" dim={0.35} />
				<Cursor segs={segs} clicks={['optimize']} />
			</Shot>
			{f < fastLen ? <Badge at={6} style={{top: MAPBOX[1] + 18, right: 1920 - MAPBOX[0] - MAPBOX[2] + 18}}>SPED UP 2× · SIMULATING 15 EARTHQUAKES</Badge> : null}
		</AbsoluteFill>
	);
};
