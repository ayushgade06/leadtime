import React from 'react';
import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {wipe} from '@remotion/transitions/wipe';
import {TL} from './timeline';
import {Captions} from './Captions';
import {Hook} from './scenes/Hook';
import {Problem} from './scenes/Problem';
import {RevealScene} from './scenes/Reveal';
import {Wave} from './scenes/Wave';
import {Beam} from './scenes/Beam';
import {Cities} from './scenes/Cities';
import {Sensor} from './scenes/Sensor';
import {Optimizer} from './scenes/Optimizer';
import {Nearfield} from './scenes/Nearfield';
import {Verdict} from './scenes/Verdict';
import {Close} from './scenes/Close';

// Scene id (narration.json) -> component. One component per scene; add yours here.
const SCENES: Record<string, React.FC> = {
	hook: Hook,
	problem: Problem,
	reveal: RevealScene,
	wave: Wave,
	beam: Beam,
	cities: Cities,
	sensor: Sensor,
	optimizer: Optimizer,
	nearfield: Nearfield,
	proof: Verdict,
	close: Close,
};

// Transition INTO a scene. Fades by default; use a wipe only at the story's turns (≤2 per film).
const INTO: Record<string, 'fade' | 'wipe'> = {problem: 'wipe', proof: 'wipe'};

export const Film: React.FC<{captions: boolean}> = ({captions}) => {
	const timing = linearTiming({durationInFrames: TL.transition});
	return (
		<AbsoluteFill style={{backgroundColor: '#04101c'}}>
			<TransitionSeries>
				{TL.scenes.flatMap((s, i) => {
					const Scene = SCENES[s.id];
					if (!Scene) throw new Error(`No component registered for scene "${s.id}" in Film.tsx`);
					const seq = (
						<TransitionSeries.Sequence key={s.id} name={s.id} durationInFrames={s.dur}>
							<Scene />
						</TransitionSeries.Sequence>
					);
					if (i === 0) return [seq];
					const kind = INTO[s.id] ?? 'fade';
					return [
						<TransitionSeries.Transition
							key={`t-${s.id}`}
							presentation={(kind === 'wipe' ? wipe({direction: 'from-left'}) : fade()) as ReturnType<typeof fade>}
							timing={timing}
						/>,
						seq,
					];
				})}
			</TransitionSeries>

			{captions ? <Captions /> : null}

			{TL.lines.map((l) => (
				<Sequence key={l.id} name={`vo ${l.id}`} from={l.from} durationInFrames={l.dur + 6} layout="none">
					<Audio src={staticFile(l.src)} />
				</Sequence>
			))}
			<Audio name="music + sfx" src={staticFile('audio/bed.wav')} />
		</AbsoluteFill>
	);
};
