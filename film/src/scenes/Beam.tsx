import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop, Hl, Kicker, Shot, Source} from '../ui';
import {W} from '../timeline';
import {FBOX} from './layout';

// The app's "Highest wave" + "Hourly arrival lines" layers after the 12-hour run.
export const Beam: React.FC = () => {
	const a = W('beam1', 'beams') - 6;
	const b = W('beam1', 'hour') - 6;
	return (
		<AbsoluteFill>
			<Backdrop />
			<Kicker n="02" style={{left: FBOX[0]}}>
				WHERE IT HIT HARDEST, AND WHEN
			</Kicker>
			<Source style={{right: FBOX[0], top: 62}}>LEADTIME · HIGHEST WAVE + HOURLY ARRIVAL LINES</Source>
			<Shot src="shots/beam.png" box={FBOX} keys={[[0, [40, 120, 1400, 788]], [a, [220, 200, 1150, 647]], [b + 20, [300, 300, 1000, 563]]]}>
				<Hl at={a} until={b - 8} rect={[520, 430, 600, 230]} label="STRONGEST BEAM: SRI LANKA AND INDIA" dim={0.35} />
				<Hl at={b} rect={[830, 590, 180, 400]} label="1 H, 2 H, 3 H…" dim={0.35} />
			</Shot>
		</AbsoluteFill>
	);
};
