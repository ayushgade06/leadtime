import React from 'react';
import {AbsoluteFill, useVideoConfig} from 'remotion';
import {Backdrop, Hl, Kicker, Shot, Source} from '../ui';
import {W} from '../timeline';
import {FBOX} from './layout';
import {Cursor, EV, Take, type Seg} from './take';

// Live recording: switching to the "Highest wave" and "Hourly arrival lines" layers.
export const Beam: React.FC = () => {
	const {fps} = useVideoConfig();
	const a = W('beam1', 'beams') - 6;
	const b = W('beam1', 'hour') - 6;
	// the "Highest wave" click lands just before "beams" is spoken
	const src = EV['lyr-max_on'].t - (a - 0.5 * fps) / fps;
	const segs: Seg[] = [{start: 0, src, end: EV.sensors_tab.t - 1}];
	return (
		<AbsoluteFill>
			<Backdrop />
			<Kicker n="02" style={{left: FBOX[0]}}>
				WHERE IT HIT HARDEST, AND WHEN
			</Kicker>
			<Source style={{right: FBOX[0], top: 62}}>LEADTIME · HIGHEST WAVE + HOURLY ARRIVAL LINES</Source>
			<Shot media={<Take segs={segs} />} box={FBOX} keys={[[0, [16, 210, 1384, 778]], [b + 20, [60, 250, 1310, 737]]]}>
				<Hl at={a + 12} until={b - 8} rect={[520, 430, 600, 230]} label="STRONGEST BEAM: SRI LANKA AND INDIA" dim={0.3} />
				<Hl at={b + 6} rect={[830, 590, 180, 330]} label="1 H, 2 H, 3 H…" dim={0.3} />
				<Cursor segs={segs} clicks={['lyr-wave_off', 'lyr-max_on', 'lyr-iso_on']} />
			</Shot>
		</AbsoluteFill>
	);
};
