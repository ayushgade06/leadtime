import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Backdrop, Reveal, useIn} from '../ui';
import {BRAND, C, F} from '../theme';
import {E, L, TL, W} from '../timeline';

// End card: name, promise, where to try it.
export const Close: React.FC = () => {
	const f = useCurrentFrame();
	const dur = TL.scenes[TL.scenes.length - 1].dur;
	const a = L('end1');
	const url = useIn(E('end1') + 8, 20);
	const meta = useIn(W('end1', 'free') - 2, 16);
	const glow = useIn(a, 60);
	const black = interpolate(f, [dur - 30, dur - 2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill>
			<Backdrop glow={`radial-gradient(ellipse 45% 38% at 50% 40%, rgba(76,201,224,${0.12 * glow}) 0%, rgba(0,0,0,0) 70%)`} />
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', paddingBottom: 110}}>
				<div style={{fontFamily: F.display, fontSize: 220, lineHeight: 0.85, color: C.text}}>
					<Reveal at={a}>{BRAND.name}</Reveal>
				</div>
				<div style={{fontFamily: F.display, fontSize: 92, lineHeight: 1, marginTop: 30, textAlign: 'center'}}>
					<Reveal at={W('end1', 'every') - 2} style={{color: C.text}}>
						{BRAND.tagline[0]}
					</Reveal>{' '}
					<Reveal at={W('end1', 'counts') - 2} style={{color: C.amber}}>
						{BRAND.tagline[1]}
					</Reveal>
				</div>
				<div style={{marginTop: 34, opacity: meta, fontFamily: F.text, fontSize: 32, color: C.muted, letterSpacing: '0.04em'}}>Free · open source · no login · runs in your browser</div>
				<div style={{marginTop: 40, opacity: url, translate: `0 ${(1 - url) * 14}px`, textAlign: 'center'}}>
					<div style={{fontFamily: F.text, fontWeight: 600, fontSize: 44, color: C.cyan}}>{BRAND.url}</div>
					<div style={{fontFamily: F.text, fontSize: 28, color: C.muted, marginTop: 10}}>{BRAND.repo}</div>
				</div>
			</AbsoluteFill>
			<AbsoluteFill style={{backgroundColor: '#000', opacity: black}} />
		</AbsoluteFill>
	);
};
