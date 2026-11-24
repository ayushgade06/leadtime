import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Backdrop, Reveal, Rise} from '../ui';
import {C, F} from '../theme';
import {W} from '../timeline';

// Cold open: the date, the magnitude, the place, each landing on its spoken word.
export const Hook: React.FC = () => {
	const f = useCurrentFrame();
	const drift = interpolate(f, [0, 300], [0, 1]);
	const big = {fontFamily: F.display, lineHeight: 0.9, letterSpacing: '0.01em', color: C.text};
	return (
		<AbsoluteFill>
			<Backdrop glow={`radial-gradient(ellipse 50% 55% at ${50 + drift * 3}% 46%, rgba(76,201,224,0.10) 0%, rgba(0,0,0,0) 70%)`} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', scale: String(1 + drift * 0.025), paddingBottom: 60}}>
				<div style={{...big, fontSize: 210, display: 'flex', gap: 40}}>
					<Reveal at={W('hook1', 'twenty-sixth') - 2}>26</Reveal>
					<Reveal at={W('hook1', 'december') - 2}>DECEMBER</Reveal>
					<Reveal at={W('hook1', 'two') - 2}>2004</Reveal>
				</div>
				<div style={{display: 'flex', gap: 60, marginTop: 40, alignItems: 'baseline'}}>
					<div style={{...big, fontSize: 120, color: C.amber}}>
						<Reveal at={W('hook1', 'nine') - 2}>MAGNITUDE 9.1</Reveal>
					</div>
					<div style={{...big, fontSize: 120, color: C.muted}}>
						<Reveal at={W('hook1', 'sumatra') - 4}>OFF SUMATRA</Reveal>
					</div>
				</div>
				<Rise at={W('hook1', 'earthquake')} style={{marginTop: 44, fontFamily: F.text, fontSize: 30, color: C.dim, letterSpacing: '0.06em'}}>
					00:58 UTC · USGS
				</Rise>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};
