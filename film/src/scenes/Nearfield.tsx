import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Backdrop, Hl, Kicker, Shot, Source} from '../ui';
import {W} from '../timeline';
import {MAPBOX, PANELBOX, mapCrop, panelCrop} from './layout';

// The honest limit: Banda Aceh stays red; the Learn card's smong story (McAdoo et al. 2006).
export const Nearfield: React.FC = () => {
	const f = useCurrentFrame();
	const learn = W('near2', 'simeulue') - 14;
	const x = interpolate(f, [learn, learn + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill>
			<Backdrop />
			<Kicker n="06" style={{left: MAPBOX[0]}}>
				WHEN THERE IS NO TIME
			</Kicker>
			<Source style={{right: 96, top: 62}}>LEADTIME · NEAR FIELD · LEARN TAB (MCADOO ET AL. 2006)</Source>
			<Shot src="shots/banda.png" box={MAPBOX} keys={[[0, mapCrop(160, 240, 760)], [W('near1', 'banda') + 30, mapCrop(300, 330, 640)]]}>
				<Hl at={W('near1', 'banda') - 4} rect={[680, 553, 48, 48]} label="BANDA ACEH" color="#ff6b4a" dim={0.2} />
			</Shot>
			<Shot src="shots/banda.png" box={PANELBOX} keys={[[0, panelCrop(300)]]} style={{opacity: 1 - x}}>
				<Hl at={W('near1', 'twenty-one') - 6} rect={[1430, 645, 468, 86]} label="WAVE AT 0:21" color="#ff6b4a" dim={0.4} />
			</Shot>
			<Shot src="shots/learn_smong.png" box={PANELBOX} keys={[[learn, panelCrop(180)]]} style={{opacity: x}}>
				<Hl at={W('near2', 'only') - 6} rect={[1426, 254, 478, 156]} label="SMONG" dim={0.35} labelSide="bottom" />
			</Shot>
		</AbsoluteFill>
	);
};
