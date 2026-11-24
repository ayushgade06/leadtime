import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {Video} from '@remotion/media';
import {Backdrop, Badge, Hl, Kicker, Shot, Source} from '../ui';
import {W} from '../timeline';
import {FBOX} from './layout';

// Genuine motion: the app's own playback of 2004 (recorded with a fixed camera, 1× speed),
// then the 12-hour still once the narration says "twelve hours".
const CLIP_FRAMES = 325; // 10.8 s of real playback: +00:08 → +03:51 on the app's clock

export const Wave: React.FC = () => {
	const f = useCurrentFrame();
	const start = 0;
	const cut = Math.max(start + CLIP_FRAMES - 14, W('wave2', 'twelve') - 8);
	const x = interpolate(f, [cut, cut + 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const cam: [number, [number, number, number, number]][] = [
		[0, [30, 240, 1300, 731]],
		[start + CLIP_FRAMES, [30, 300, 1270, 714]],
	];
	return (
		<AbsoluteFill>
			<Backdrop />
			<Kicker n="01" style={{left: FBOX[0]}}>
				THE WAVE, ON THE REAL SEAFLOOR
			</Kicker>
			<Source style={{right: FBOX[0], top: 62}}>LEADTIME · 2004 REPLAY · 512 × 512 GRID</Source>
			<div style={{opacity: 1 - x}}>
				<Shot
					box={FBOX}
					keys={cam}
					media={
						<div style={{width: 1920, height: 1080}}>
							{f < CLIP_FRAMES - 1 ? (
								<Video src={staticFile('clips/wave2004.mp4')} style={{width: 1920, height: 1080}} muted />
							) : (
								<Img src={staticFile('shots/wave_clip_last.png')} style={{width: 1920, height: 1080}} />
							)}
						</div>
					}
				>
					<Hl at={W('wave1', 'live') - 4} until={W('wave2', 'over') + 30} rect={[36, 880, 160, 70]} label="SIMULATED TIME" dim={0.25} labelSide="top" />
				</Shot>
			</div>
			<div style={{opacity: x}}>
				<Shot src="shots/wave_end.png" box={FBOX} keys={[[cut, [30, 240, 1300, 731]], [cut + 180, [20, 200, 1380, 776]]]}>
					<Hl at={cut + 10} rect={[36, 880, 150, 70]} label="12 HOURS LATER" dim={0.3} />
				</Shot>
			</div>
			<Badge at={start + 4}>REAL PLAYBACK · 20 SIMULATED MIN PER SECOND</Badge>
		</AbsoluteFill>
	);
};
