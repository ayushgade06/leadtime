import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Backdrop, Hl, Reveal as Up, Shot, Source, useIn} from '../ui';
import {C, F} from '../theme';
import {W} from '../timeline';
import {FBOX} from './layout';

// The name, then the real first-run screen asking the product's question.
const Mark: React.FC<{size: number}> = ({size}) => (
	<svg width={size} height={size} viewBox="0 0 32 32">
		<circle cx="16" cy="16" r="11" fill="none" stroke="#4cc9e0" strokeOpacity=".45" strokeWidth="1.6" />
		<circle cx="16" cy="16" r="7" fill="none" stroke="#4cc9e0" strokeWidth="2" />
		<circle cx="16" cy="16" r="3" fill="#ffb547" />
	</svg>
);

export const RevealScene: React.FC = () => {
	const f = useCurrentFrame();
	const shotAt = W('reveal1', 'asks') - 6;
	const x = interpolate(f, [shotAt, shotAt + 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const logo = useIn(4, 20);
	return (
		<AbsoluteFill>
			<Backdrop glow="radial-gradient(ellipse 45% 40% at 50% 45%, rgba(255,181,71,0.10) 0%, rgba(0,0,0,0) 70%)" />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', opacity: 1 - x, paddingBottom: 80}}>
				<div style={{display: 'flex', alignItems: 'center', gap: 40, opacity: logo, scale: String(0.94 + 0.06 * logo)}}>
					<Mark size={150} />
					<div style={{fontFamily: F.display, fontSize: 210, color: C.text, lineHeight: 1}}>
						<Up at={W('reveal1', 'lead') - 2}>LeadTime</Up>
					</div>
				</div>
			</AbsoluteFill>
			<div style={{opacity: x}}>
				<Shot src="shots/guide.png" box={FBOX} keys={[[shotAt, [120, 80, 1500, 844]], [shotAt + 150, [250, 240, 1000, 563]]]}>
					<Hl at={W('reveal1', 'how') - 4} rect={[380, 335, 310, 145]} label="THE QUESTION" dim={0.4} />
				</Shot>
				<Source at={shotAt + 8} style={{right: FBOX[0], top: 62}}>
					LEADTIME · FIRST VISIT (LIVE SITE)
				</Source>
			</div>
		</AbsoluteFill>
	);
};
