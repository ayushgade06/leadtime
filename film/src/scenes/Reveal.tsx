import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {Backdrop, Hl, Reveal as Up, Shot, Source, useIn} from '../ui';
import {C, F} from '../theme';
import {W} from '../timeline';
import {FBOX} from './layout';
import {Cursor, EV, Take, type Seg} from './take';

const Mark: React.FC<{size: number}> = ({size}) => (
	<svg width={size} height={size} viewBox="0 0 32 32">
		<circle cx="16" cy="16" r="11" fill="none" stroke="#4cc9e0" strokeOpacity=".45" strokeWidth="1.6" />
		<circle cx="16" cy="16" r="7" fill="none" stroke="#4cc9e0" strokeWidth="2" />
		<circle cx="16" cy="16" r="3" fill="#ffb547" />
	</svg>
);

// The name, then the real first-run screen (live recording) asking the product's question,
// ending on the real click on "Replay the 2004 tsunami".
export const RevealScene: React.FC = () => {
	const f = useCurrentFrame();
	const {fps, durationInFrames} = useVideoConfig();
	const shotAt = W('reveal1', 'asks') - 12;
	const x = interpolate(f, [shotAt, shotAt + 0.3 * fps], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const logo = useIn(4, 20);
	// land the real click ~0.9 s before the scene ends
	const clickAt = durationInFrames - Math.round(0.9 * fps);
	const src = Math.max(3.6, EV.replay.t - (clickAt - shotAt) / fps);
	const segs: Seg[] = [{start: shotAt, src, end: EV.replay.t + 1.5}];
	return (
		<AbsoluteFill>
			<Backdrop glow="radial-gradient(ellipse 45% 40% at 50% 45%, rgba(255,181,71,0.10) 0%, rgba(0,0,0,0) 70%)" />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - x, paddingBottom: 80}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 40, opacity: logo, scale: String(0.94 + 0.06 * logo)}}>
					<Mark size={150} />
					<div style={{fontFamily: F.display, fontSize: 210, color: C.text, lineHeight: 1}}>
						<Up at={W('reveal1', 'leed') - 2}>LeadTime</Up>
					</div>
				</div>
			</AbsoluteFill>
			<div style={{opacity: x}}>
				<Shot media={<Take segs={segs} />} box={FBOX} keys={[[shotAt, [180, 200, 1240, 698]], [shotAt + 4 * fps, [250, 280, 1100, 619]]]}>
					<Hl at={W('reveal1', 'how') - 6} until={clickAt - 0.6 * fps} rect={[380, 370, 310, 140]} label="THE QUESTION" dim={0.4} />
					<Cursor segs={segs} clicks={['replay']} />
				</Shot>
				<Source at={shotAt + 8} style={{right: FBOX[0], top: 62}}>
					LEADTIME · FIRST VISIT · LIVE SCREEN RECORDING
				</Source>
			</div>
		</AbsoluteFill>
	);
};
