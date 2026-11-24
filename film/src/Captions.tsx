import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {TL} from './timeline';
import {BRAND, C, F} from './theme';

const phrases = TL.lines.flatMap((l) =>
	l.phrases.map((p) => ({text: p.text, from: l.from + Math.round(p.start * TL.fps), to: l.from + Math.round(p.end * TL.fps) + 4})),
);

// Only the product name gets the brand accent; everything else stays white for contrast.
const ACCENT = new RegExp(`\\b(${BRAND.name})\\b`, 'g');

/** Burned-in captions: phrase by phrase, from the voice engine's own word timings. */
export const Captions: React.FC = () => {
	const f = useCurrentFrame();
	const cur = phrases.find((p) => f >= p.from && f < p.to);
	if (!cur) return null;
	const o = interpolate(f, [cur.from, cur.from + 4, cur.to - 3, cur.to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const parts = cur.text.split(ACCENT);
	return (
		<div style={{position: 'absolute', left: 0, right: 0, top: 944, display: 'flex', justifyContent: 'center', opacity: o}}>
			<div
				style={{
					maxWidth: 1400,
					padding: '12px 28px 14px',
					borderRadius: 10,
					background: 'rgba(4,16,28,0.86)',
					boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
					fontFamily: F.text,
					fontWeight: 600,
					fontSize: 42,
					lineHeight: 1.2,
					color: C.text,
					textAlign: 'center',
					letterSpacing: '0.005em',
				}}
			>
				{parts.map((p, i) => (i % 2 ? <span key={i} style={{color: C.amber}}>{p}</span> : <React.Fragment key={i}>{p}</React.Fragment>))}
			</div>
		</div>
	);
};
