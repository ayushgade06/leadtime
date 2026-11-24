import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Backdrop, Crop, Kicker, useIn} from '../ui';
import {C, F, ease} from '../theme';
import {L, W} from '../timeline';

// CLAIM → EVIDENCE → VERDICT on paper. Evidence is the app's own scatter (Science tab, live site)
// and its numbers: MAE 20 min over 13 gauges, 12 of 13 early (docs/VALIDATION.md).
const Card: React.FC<{at: number; k: string; tone?: string; w?: number; children: React.ReactNode}> = ({at, k, tone = C.ink, w = 470, children}) => {
	const p = useIn(at, 18);
	return (
		<div
			style={{
				width: w,
				height: 470,
				boxSizing: 'border-box',
				background: '#f7f9fa',
				border: `2px solid ${C.paperLine}`,
				borderTop: `6px solid ${tone}`,
				borderRadius: 12,
				padding: '26px 30px',
				opacity: p,
				translate: `0 ${(1 - p) * 30}px`,
				boxShadow: '0 24px 60px rgba(20,40,60,0.12)',
			}}
		>
			<div style={{fontFamily: F.mono, fontSize: 26, letterSpacing: '0.16em', color: C.inkMuted}}>{k}</div>
			<div style={{marginTop: 18}}>{children}</div>
		</div>
	);
};

export const Verdict: React.FC = () => {
	const f = useCurrentFrame();
	const ev = W('proof1', 'against') - 6;
	const v = W('proof2', 'safe') - 10;
	const stamp = interpolate(f, [v, v + 8], [1.6, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
	return (
		<AbsoluteFill>
			<Backdrop paper />
			<Kicker paper n="07">
				CLAIM → EVIDENCE → VERDICT
			</Kicker>
			<div style={{position: 'absolute', left: 120, top: 120, fontFamily: F.display, fontSize: 96, color: C.ink, lineHeight: 1}}>CAN YOU TRUST THE PHYSICS?</div>
			<div style={{position: 'absolute', left: 120, right: 120, top: 270, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
				<Card at={L('proof1')} k="CLAIM" w={430}>
					<div style={{fontFamily: F.text, fontWeight: 600, fontSize: 44, lineHeight: 1.2, color: C.ink}}>The simulated 2004 wave arrives when the real one did.</div>
				</Card>
				<div style={{fontSize: 56, color: C.inkMuted, opacity: useIn(ev - 4, 14)}}>→</div>
				<Card at={ev} k="EVIDENCE · 13 TIDE GAUGES" w={600}>
					<div style={{display: 'flex', gap: 22, alignItems: 'flex-start'}}>
						<Crop src="shots/scatter.png" rect={[1430, 330, 470, 470]} size={300} radius={8} />
						<div>
							<div style={{fontFamily: F.display, fontSize: 80, lineHeight: 0.95, whiteSpace: 'nowrap', color: C.ink, opacity: useIn(W('proof1', 'twenty') - 4, 14)}}>20 min</div>
							<div style={{fontFamily: F.text, fontSize: 24, color: C.inkMuted, marginTop: 6}}>mean absolute error</div>
							<div style={{fontFamily: F.display, fontSize: 56, lineHeight: 1, color: '#b8741a', marginTop: 26, opacity: useIn(W('proof1', 'early') - 4, 14)}}>12 of 13</div>
							<div style={{fontFamily: F.text, fontSize: 24, color: C.inkMuted, marginTop: 6}}>arrive early</div>
						</div>
					</div>
				</Card>
				<div style={{fontSize: 56, color: C.inkMuted, opacity: useIn(v - 4, 14)}}>→</div>
				<Card at={v} k="VERDICT" tone="#2f7d6c" w={430}>
					<div style={{display: 'inline-block', marginTop: 30, border: '6px solid #2f7d6c', borderRadius: 10, padding: '14px 22px', fontFamily: F.display, fontSize: 58, lineHeight: 1.05, color: '#2f7d6c', rotate: '-3deg', scale: String(stamp)}}>
						ERRS ON THE SAFE SIDE
					</div>
					<div style={{fontFamily: F.text, fontSize: 24, color: C.inkMuted, marginTop: 30, opacity: useIn(v + 10, 14)}}>Mostly early arrivals mean the warning times shown lean short.</div>
				</Card>
			</div>
			<div style={{position: 'absolute', left: 120, top: 790, fontFamily: F.mono, fontSize: 24, color: C.inkMuted, letterSpacing: '0.06em'}}>
				LEADTIME SCIENCE TAB · GAUGES: MERRIFIELD 2005, NAGARAJAN 2006 · ALSO 6 / 6 PHYSICS TESTS PASS LIVE
			</div>
		</AbsoluteFill>
	);
};
