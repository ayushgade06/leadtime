import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {Backdrop, Hl, Kicker, Shot, Source} from '../ui';
import {W} from '../timeline';
import {MAPBOX, PANELBOX, mapCrop, panelCrop} from './layout';
import {Cursor, EV, Take, type Seg} from './take';

// Live recording: clicking Banda Aceh flies the map there (wave at 0:21 in the city table); then the
// Learn tab's smong card (McAdoo et al. 2006).
export const Nearfield: React.FC = () => {
	const {fps} = useVideoConfig();
	const banda = W('near1', 'banda') - Math.round(0.4 * fps);
	const src = EV.banda.t - banda / fps;
	const segs: Seg[] = [{start: 0, src, end: EV.science.t - 0.5}];
	const media = <Take segs={segs} />;
	const fly = banda + Math.round(1.1 * fps);
	return (
		<AbsoluteFill>
			<Backdrop />
			<Kicker n="06" style={{left: MAPBOX[0]}}>
				WHEN THERE IS NO TIME
			</Kicker>
			<Source style={{right: 96, top: 62}}>LEADTIME · NEAR FIELD · LEARN TAB (MCADOO ET AL. 2006)</Source>
			<Shot media={media} box={MAPBOX} keys={[[0, mapCrop(160, 120, 1100)], [fly, mapCrop(160, 200, 900)]]}>
				<Hl at={W('near1', 'twenty-one') - 6} rect={[660, 520, 120, 110]} label="BANDA ACEH · WAVE AT 0:21" color="#ff6b4a" dim={0.2} />
			</Shot>
			<Shot media={media} box={PANELBOX} keys={[[0, panelCrop(110)]]}>
				<Hl at={W('near2', 'only') - 6} rect={[1426, 254, 478, 156]} label="SMONG" dim={0.35} labelSide="bottom" />
				<Cursor segs={segs} clicks={['learn']} />
			</Shot>
		</AbsoluteFill>
	);
};
