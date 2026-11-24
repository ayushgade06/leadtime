import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, Badge, Hl, Kicker, Shot, Source} from '../ui';
import {W} from '../timeline';
import {FBOX} from './layout';
import {EV, Take, type Seg} from './take';

// Live recording: the app's own playback at 20 simulated min per second, then (sped up 2×, labelled)
// the rest of the 12 hours after "Max" was pressed.
export const Wave: React.FC = () => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const cut = Math.min(W('wave2', 'twelve') - Math.round(0.3 * fps), Math.round((EV.max.t - EV.replay.t - 0.3) * fps));
	const segs: Seg[] = [
		{start: 0, src: EV.replay.t + 0.1, end: EV.max.t - 0.1},
		{start: cut, src: 26.0, end: EV['lyr-wave_off'].t - 0.2, rate: 2},
	];
	const sped = f >= cut;
	const flash = interpolate(f, [cut - 6, cut, cut + 10], [0, 0.6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill>
			<Backdrop />
			<Kicker n="01" style={{left: FBOX[0]}}>
				THE WAVE, ON THE REAL SEAFLOOR
			</Kicker>
			<Source style={{right: FBOX[0], top: 62}}>LEADTIME · 2004 REPLAY · LIVE SCREEN RECORDING</Source>
			<Shot media={<Take segs={segs} />} box={FBOX} keys={[[0, [16, 236, 1344, 756]], [cut, [24, 246, 1320, 743]], [cut + 1, [16, 236, 1344, 756]]]}>
				<Hl at={W('wave1', 'lyve') - 6} until={cut - 10} rect={[36, 878, 150, 70]} label="SIMULATED TIME" dim={0.2} />
				<Hl at={cut + 10} rect={[36, 878, 150, 70]} label="TO 12 HOURS" dim={0.2} />
			</Shot>
			<div style={{position: 'absolute', left: FBOX[0], top: FBOX[1], width: FBOX[2], height: FBOX[3], borderRadius: 14, background: '#04101c', opacity: flash}} />
			{sped ? <Badge at={cut} style={{top: FBOX[1] + 18, right: FBOX[0] + 18}}>SPED UP 2× · AFTER PRESSING "MAX"</Badge> : <Badge at={8} style={{top: FBOX[1] + 18, right: FBOX[0] + 18}}>REAL TIME · 20 SIMULATED MIN PER SECOND</Badge>}
		</AbsoluteFill>
	);
};
