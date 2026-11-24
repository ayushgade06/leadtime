import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Backdrop, Kicker, Reveal, Source, useIn} from '../ui';
import {C, F} from '../theme';
import {L, W} from '../timeline';

// Paper scene: the hours that existed, and the warning that didn't. Observed tide-gauge times.
const Gauge: React.FC<{at: number; city: string; h: string; m: string; src: string}> = ({at, city, h, m, src}) => {
	const p = useIn(at, 20);
	return (
		<div style={{width: 640, opacity: p, translate: `0 ${(1 - p) * 30}px`, borderTop: `6px solid ${C.ink}`, paddingTop: 22}}>
			<div style={{fontFamily: F.display, fontSize: 40, letterSpacing: '0.08em', color: C.inkMuted}}>{city}</div>
			<div style={{fontFamily: F.display, fontSize: 190, lineHeight: 0.95, color: C.ink, marginTop: 6}}>
				{h}
				<span style={{fontSize: 80, color: C.inkMuted}}> h </span>
				{m}
				<span style={{fontSize: 80, color: C.inkMuted}}> min</span>
			</div>
			<div style={{fontFamily: F.text, fontSize: 24, color: C.inkMuted, marginTop: 8}}>{src}</div>
		</div>
	);
};

export const Problem: React.FC = () => {
	const none = W('problem2', 'no') - 4;
	const died = W('problem2', 'more') - 2;
	return (
		<AbsoluteFill>
			<Backdrop paper />
			<Kicker paper n="2004">
				TIME TO THE FIRST WAVE, MEASURED AT TIDE GAUGES
			</Kicker>
			<div style={{position: 'absolute', left: 120, right: 120, top: 190, display: 'flex', justifyContent: 'space-between'}}>
				<Gauge at={W('problem1', 'two') - 4} city="CHENNAI, INDIA" h="2" m="36" src="Nagarajan et al. 2006, Earth Planets Space" />
				<Gauge at={W('problem1', 'colombo') - 10} city="COLOMBO, SRI LANKA" h="2" m="53" src="Merrifield et al. 2005, GRL" />
			</div>
			<div style={{position: 'absolute', left: 120, top: 610, display: 'flex', alignItems: 'baseline', gap: 48}}>
				<div style={{fontFamily: F.display, fontSize: 132, lineHeight: 1, color: '#c4502f'}}>
					<Reveal at={none}>NO WARNING SYSTEM.</Reveal>
				</div>
				<div style={{fontFamily: F.display, fontSize: 64, lineHeight: 1, color: C.ink}}>
					<Reveal at={died}>227,000+ PEOPLE DIED.</Reveal>
				</div>
			</div>
			<Source paper at={L('problem2') + 20} style={{left: 120, top: 790}}>
				MERRIFIELD ET AL. 2005: "NO TSUNAMI WARNING SYSTEM IN THE INDIAN OCEAN" · DEATH TOLL: WIKIPEDIA 227,898; USGS 283,100+
			</Source>
		</AbsoluteFill>
	);
};
