import React from 'react';
import {Freeze, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Video} from '@remotion/media';
import take from '../take.json';
import {glide} from '../theme';

// ONE continuous 60 fps screen recording of the real site in Brave (capture/rec/take.mkv),
// driven in-page; events are logged in source seconds with click points in source pixels.
export const EV = take.events as Record<string, {t: number; at: number[] | null}>;
export type Seg = {start: number; src: number; end: number; rate?: number};

/** Which source second is on screen at scene frame f. */
export const srcTime = (segs: Seg[], f: number, fps: number) => {
	const s = [...segs].reverse().find((x) => f >= x.start) ?? segs[0];
	return Math.min(s.end, s.src + ((f - s.start) / fps) * (s.rate ?? 1));
};

/** Plays the take through a list of segments (each may be sped up), holding on a segment's last frame. */
export const Take: React.FC<{segs: Seg[]}> = ({segs}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const i = segs.reduce((k, x, j) => (f >= x.start ? j : k), 0);
	const s = segs[i];
	const rate = s.rate ?? 1;
	const holdAt = s.start + Math.floor(((s.end - s.src) / rate) * fps);
	const video = <Video src={staticFile(take.file)} trimBefore={Math.round(s.src * fps)} playbackRate={rate} muted style={{width: 1920, height: 1080}} />;
	return (
		<div style={{width: 1920, height: 1080, background: '#04101c'}}>
			<Sequence key={i} from={s.start} layout="none">
				{f >= holdAt ? <Freeze frame={holdAt - s.start - 1}>{video}</Freeze> : video}
			</Sequence>
		</div>
	);
};

/** A pointer that glides to each logged click and shows a ripple (source coordinates, inside a Shot). */
export const Cursor: React.FC<{segs: Seg[]; clicks: string[]}> = ({segs, clicks}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const t = srcTime(segs, f, fps);
	const pts = clicks.map((n) => EV[n]).filter((e) => e?.at) as {t: number; at: number[]}[];
	if (!pts.length) return null;
	const next = pts.find((p) => p.t > t);
	const prev = [...pts].reverse().find((p) => p.t <= t);
	let x: number, y: number;
	if (next) {
		const from = prev?.at ?? [next.at[0] + 220, next.at[1] + 160];
		const k = interpolate(t, [next.t - 0.8, next.t - 0.1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: glide});
		x = from[0] + (next.at[0] - from[0]) * k;
		y = from[1] + (next.at[1] - from[1]) * k;
	} else [x, y] = prev!.at;
	const since = prev ? t - prev.t : 99;
	const ring = since < 0.6 ? since / 0.6 : 1;
	const last = pts[pts.length - 1];
	// fade in before the first click, fade out after the last one
	const show = interpolate(t, [pts[0].t - 1.4, pts[0].t - 0.9, last.t + 0.9, last.t + 1.4], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<div style={{position: 'absolute', left: x, top: y, opacity: show, pointerEvents: 'none'}}>
			{ring < 1 ? <div style={{position: 'absolute', left: -28 * ring - 6, top: -28 * ring - 6, width: 56 * ring + 12, height: 56 * ring + 12, borderRadius: '50%', border: '3px solid #ffb547', opacity: 1 - ring}} /> : null}
			<svg width="30" height="36" viewBox="0 0 24 30" style={{position: 'absolute', left: -3, top: -2, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))'}}>
				<path d="M2 2 L2 24 L8 18 L12 28 L16 26 L12 17 L20 17 Z" fill="#ffffff" stroke="#0b1b2c" strokeWidth="1.6" strokeLinejoin="round" />
			</svg>
		</div>
	);
};
