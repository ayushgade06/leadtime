import {Easing, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';

// LeadTime's own identity: Barlow (signage) + Barlow Condensed (instrument readouts),
// abyss navy, amber = warning/act, cyan = water. Taken from src/style.css of the app.
export const BRAND = {
	name: 'LeadTime',
	url: 'leadtime-liard.vercel.app',
	repo: 'github.com/ayushgade06/leadtime',
	tagline: ['EVERY MINUTE', 'COUNTS.'],
};

loadFont({family: 'Display', url: staticFile('fonts/BarlowCondensed-600.woff2'), weight: '600'});
loadFont({family: 'Text', url: staticFile('fonts/Barlow-400.woff2'), weight: '400'});
loadFont({family: 'Text', url: staticFile('fonts/Barlow-500.woff2'), weight: '500'});
loadFont({family: 'Text', url: staticFile('fonts/Barlow-600.woff2'), weight: '600'});

export const C = {
	bg: '#04101c',
	bg2: '#0b1b2c',
	panel: '#0b1b2c',
	line: '#1d3349',
	text: '#dbe8f3',
	muted: '#8199af',
	dim: '#5d7489',
	amber: '#ffb547', // THE accent: warnings, the decisive number
	amberSoft: 'rgba(255,181,71,0.16)',
	cyan: '#4cc9e0', // water
	green: '#62e0c8', // warned in time
	coral: '#ff6b4a', // not enough time
	paper: '#edf1f2', // cool "chart paper" surface, used twice
	paperLine: '#cfd8dc',
	ink: '#0b1b2c',
	inkMuted: '#4f6476',
};

export const F = {
	display: 'Display, "Arial Narrow", sans-serif',
	text: 'Text, "Segoe UI", sans-serif',
	mono: 'Display, "Arial Narrow", sans-serif', // labels: condensed caps, like the app's readouts
};

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const glide = Easing.bezier(0.65, 0, 0.35, 1);
