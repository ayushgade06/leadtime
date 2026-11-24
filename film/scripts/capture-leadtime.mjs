// Capture REAL footage of LeadTime from the deployed site (no mockups).
//   node scripts/capture-leadtime.mjs [url]
// 1536×864 CSS viewport at deviceScaleFactor 1.25 → crisp 1920×1080 stills; page text dumped per state
// into capture/*.txt so every number in the narration can be checked against what the app showed.
import {chromium} from 'playwright';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const URL_ = process.argv[2] ?? 'https://leadtime-liard.vercel.app/';
for (const d of ['public/shots', 'public/clips', 'capture']) fs.mkdirSync(path.join(root, d), {recursive: true});

const browser = await chromium.launch({args: ['--enable-unsafe-swiftshader']});
const ctx = await browser.newContext({viewport: {width: 1536, height: 864}, deviceScaleFactor: 1.25, colorScheme: 'dark'});
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('console error:', m.text()));
const cdp = await ctx.newCDPSession(page);

const shot = async (name) => {
	await page.waitForTimeout(500);
	await page.screenshot({path: path.join(root, `public/shots/${name}.png`)});
	fs.writeFileSync(path.join(root, `capture/${name}.txt`), await page.evaluate(() => document.body.innerText));
	console.log('shot', name, await page.evaluate(() => document.getElementById('clock')?.textContent));
};
const clock = () => page.evaluate(() => document.getElementById('clock').textContent);
const untilClock = async (hhmm) => { while ((await clock()) < `+${hhmm}`) await page.waitForTimeout(100); };
const js = (f, a) => page.evaluate(f, a);
const layers = (wave, max, iso) => js(([w, m, i]) => {
	for (const [id, on] of [['lyr-wave', w], ['lyr-max', m], ['lyr-iso', i]]) {
		const c = document.getElementById(id);
		if (c.checked !== on) { c.checked = on; c.dispatchEvent(new Event('change')); }
	}
}, [wave, max, iso]);
const panelTo = (sel) => js((s) => {
	const p = document.querySelector('.panel');
	if (!s) { p.scrollTop = 0; return; }
	const el = document.querySelector(s);
	p.scrollTop += el.getBoundingClientRect().top - p.getBoundingClientRect().top - 56;
}, sel);

// fixed-camera screencast of genuine motion (the simulated wave)
let rec = null;
cdp.on('Page.screencastFrame', async ({data, metadata, sessionId}) => {
	if (rec) {
		const f = path.join(rec.dir, `${String(rec.frames.length).padStart(6, '0')}.jpg`);
		fs.writeFileSync(f, Buffer.from(data, 'base64'));
		rec.frames.push({f, t: metadata.timestamp});
	}
	await cdp.send('Page.screencastFrameAck', {sessionId}).catch(() => {});
});
async function record(name) {
	const dir = path.join(root, `capture/frames_${name}`);
	fs.rmSync(dir, {recursive: true, force: true});
	fs.mkdirSync(dir, {recursive: true});
	rec = {name, dir, frames: []};
	await cdp.send('Page.startScreencast', {format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080});
}
async function stop() {
	await cdp.send('Page.stopScreencast');
	const lines = ['ffconcat version 1.0'];
	rec.frames.forEach((fr, i) => {
		const next = rec.frames[i + 1]?.t ?? fr.t + 0.5;
		lines.push(`file '${fr.f.replaceAll('\\', '/')}'`, `duration ${Math.max(0.001, next - fr.t).toFixed(4)}`);
	});
	const list = path.join(rec.dir, 'list.ffconcat');
	fs.writeFileSync(list, lines.join('\n'));
	execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-safe', '0', '-f', 'concat', '-i', list, '-vf', 'fps=30,scale=1920:1080:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-crf', '16', path.join(root, `public/clips/${rec.name}.mp4`)]);
	console.log('clip', rec.name, rec.frames.length, 'frames');
	rec = null;
}

// 1. First visit: the guide
await page.goto(URL_, {waitUntil: 'networkidle'});
await page.locator('#loading').waitFor({state: 'hidden'});
await shot('guide');

// 2. Replay 2004; record the wave crossing the ocean at the default 20 sim-min per second
await record('wave2004');
await page.click('#guide-2004');
await untilClock('00:40'); await shot('wave_0040');
await untilClock('01:50'); await shot('wave_0150');
await untilClock('02:50'); await shot('wave_0250');
await untilClock('04:00');
await stop();
await page.click('[data-rate="1e9"]');
await untilClock('12:00');
await page.waitForTimeout(800);
await shot('wave_end');

// 3. Energy beams + hourly arrival lines
await layers(false, true, true);
await shot('beam');

// 4. Sensors tab, no sensors yet: everything red
await page.click('#next-sensors');
await layers(false, false, false);
await panelTo(null);
await shot('sensors_none');
await panelTo('table.cities');
await shot('cities_none');

// 5. One sensor west of Sumatra (a real click on the map)
const pt = await js(() => { const m = window.leadtime.map; const p = m.latLngToContainerPoint([4.5, 90.5]); const r = m.getContainer().getBoundingClientRect(); return [p.x + r.left, p.y + r.top]; });
await page.mouse.click(pt[0], pt[1]);
await panelTo(null);
await shot('sensor_one');
await panelTo('table.cities');
await shot('cities_one');

// 6. Optimizer
await page.click('#clear-buoys');
await panelTo('#optimize');
await page.click('#optimize');
await page.locator('#opt-compare').filter({hasText: 'Across'}).waitFor({timeout: 240000});
await page.waitForTimeout(800);
await panelTo('#gain-chart');
await shot('optimized');
await panelTo(null);
await shot('optimized_top');

// 7. Near field: Banda Aceh (click its row; the map flies there)
await panelTo('table.cities');
await page.locator('#city-rows tr', {hasText: 'Banda Aceh'}).click();
await page.waitForTimeout(1500);
await shot('banda');

// 8. Learn: smong
await page.click('#tab-learn');
await panelTo('.learn:nth-of-type(4)');
await shot('learn_smong');

// 9. Science: live tests, then the 2004 tide-gauge check
await page.click('#tab-science');
await panelTo(null);
await page.click('#run-tests');
await page.locator('#tests-summary').filter({hasText: 'passed'}).waitFor({timeout: 120000});
await panelTo('#tests');
await shot('tests');
await page.click('#run-2004');
await page.locator('#v2004').waitFor({state: 'visible', timeout: 240000});
await panelTo('#v2004-summary');
await shot('scatter');

await browser.close();
console.log('CAPTURE_DONE');
