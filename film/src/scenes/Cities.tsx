import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {Backdrop, Hl, Kicker, Shot, Source} from '../ui';
import {W} from '../timeline';
import {MAPBOX, PANELBOX, mapCrop, panelCrop} from './layout';
import {EV, Take, type Seg} from './take';

// Live recording: Sensors tab, no sensors yet. The panel scrolls to the city table and back to "0".
export const Cities: React.FC = () => {
	const {fps} = useVideoConfig();
	const nobody = W('cities2', 'nobody');
	// the panel is back on the headline (0 people) as "nobody" is spoken
	const src = EV.headline_zero.t - nobody / fps + 0.2;
	const segs: Seg[] = [{start: 0, src, end: EV.drop.t - 0.4}];
	const media = <Take segs={segs} />;
	return (
		<AbsoluteFill>
			<Backdrop />
			<Kicker n="03" style={{left: MAPBOX[0]}}>
				THE PEOPLE IN THE WAY
			</Kicker>
			<Source style={{right: 96, top: 62}}>LEADTIME · SENSORS TAB · LIVE SCREEN RECORDING</Source>
			<Shot media={media} box={MAPBOX} keys={[[0, mapCrop(240, 150, 1100)], [nobody, mapCrop(300, 190, 1000)]]}>
				<Hl at={W('cities1', 'sixty-five') - 4} until={nobody - 10} rect={[340, 280, 820, 620]} label="CITY DOTS, SIZED BY POPULATION" dim={0.25} />
			</Shot>
			<Shot media={media} box={PANELBOX} keys={[[0, panelCrop(110)]]}>
				<Hl at={nobody + 4} rect={[1426, 150, 476, 180]} label="NOBODY WARNED" color="#ff6b4a" dim={0.35} labelSide="bottom" />
			</Shot>
		</AbsoluteFill>
	);
};
