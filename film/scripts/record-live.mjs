// Record ONE continuous real take of the live site at 60 fps.
// A visible (headed, GPU) Chromium runs in kiosk full-screen; ffmpeg ddagrab records the screen
// (physical 1920×1080) with NVENC. Every action is logged with its time relative to a magenta sync
// flash, plus pointer positions (video pixels), so the film can cut the take and draw the cursor.
//   node scripts/record-live.mjs [url]
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const URL_ = process.argv[2] ?? 'https://leadtime-liard.vercel.app/';
const OUT = path.join(root, 'capture/rec/take.mkv'); // MKV survives an interrupted run
fs.mkdirSync(path.dirname(OUT), {recursive: true});
const DPR = 1.25; // Windows display scaling: CSS px × 1.25 = screen px

const browser = await chromium.launch({
	headless: false,
	args: ['--kiosk', '--start-fullscreen', '--hide-scrollbars', '--disable-infobars', '--no-first-run', '--disable-features=Translate'],
});
const ctx = await browser.newContext({viewport: null, colorScheme: 'dark'});
const page = await ctx.newPage();
await page.setContent('<body style="margin:0;background:#04101c"></body>');
await page.bringToFront();
await page.waitForTimeout(1500);

const ff = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'ddagrab=framerate=60:draw_mouse=0',
	'-vf', 'hwdownload,format=bgra', '-fps_mode', 'cfr', '-r', '60', '-c:v', 'h264_nvenc', '-preset', 'p5', '-rc', 'vbr', '-cq', '17', '-pix_fmt', 'yuv420p', OUT], {stdio: ['pipe', 'inherit', 'inherit']});
await page.waitForTimeout(2500);

// sync flash: 0.4 s of pure magenta, then back to navy
await page.evaluate(() => (document.body.style.background = '#ff00ff'));
const T0 = Date.now();
await page.waitForTimeout(400);
await page.evaluate(() => (document.body.style.background = '#04101c'));

const log = [];
let pointer = [960, 540];
const mark = (name, extra = {}) => { log.push({t: (Date.now() - T0) / 1000, name, ...extra}); console.log(((Date.now() - T0) / 1000).toFixed(2), name); };
const wait = (ms) => page.waitForTimeout(ms);
async function moveTo(x, y, ms = 700) {
	const steps = Math.max(8, Math.round(ms / 16));
	log.push({t: (Date.now() - T0) / 1000, name: 'move', from: pointer, to: [x * DPR, y * DPR], dur: ms / 1000});
	await page.mouse.move(x, y, {steps});
	pointer = [x * DPR, y * DPR];
}
async function center(sel) {
	const b = await page.locator(sel).first().boundingBox();
	if (!b) throw new Error('no box for ' + sel);
	return [b.x + b.width / 2, b.y + b.height / 2];
}
async function click(sel, name, ms = 700) {
	const [x, y] = await center(sel);
	await moveTo(x, y, ms);
	await wait(120);
	mark(name, {click: [x * DPR, y * DPR]});
	await page.mouse.click(x, y);
}
async function clickAt(x, y, name, ms = 800) {
	await moveTo(x, y, ms);
	await wait(150);
	mark(name, {click: [x * DPR, y * DPR]});
	await page.mouse.click(x, y);
}
const clock = () => page.evaluate(() => document.getElementById('clock')?.textContent ?? '');
const untilClock = async (hhmm) => { while ((await clock()) < `+${hhmm}`) await wait(80); };
/** Smooth real wheel scrolling inside the panel until `sel` sits `offset` px below the panel top. */
async function scrollPanelTo(sel, offset = 70) {
	const [px, py] = await center('.panel');
	await moveTo(px + 60, py, 500);
	for (let i = 0; i < 60; i++) {
		const d = await page.evaluate(([s, o]) => {
			const p = document.querySelector('.panel'), el = s ? document.querySelector(s) : null;
			return el ? el.getBoundingClientRect().top - p.getBoundingClientRect().top - o : -p.scrollTop;
		}, [sel, offset]);
		if (Math.abs(d) < 12) break;
		await page.mouse.wheel(0, Math.sign(d) * Math.min(Math.abs(d), 90));
		await wait(45);
	}
}
async function scrollTableTo(rowText) {
	const [tx, ty] = await center('.table-wrap');
	await moveTo(tx, ty, 400);
	for (let i = 0; i < 60; i++) {
		const d = await page.evaluate((n) => {
			const tw = document.querySelector('.table-wrap');
			const row = [...document.querySelectorAll('#city-rows tr')].find((r) => r.innerText.startsWith(n));
			return row.getBoundingClientRect().top - tw.getBoundingClientRect().top - 120;
		}, rowText);
		if (Math.abs(d) < 12) break;
		await page.mouse.wheel(0, Math.sign(d) * Math.min(Math.abs(d), 80));
		await wait(45);
	}
}
async function setLayer(id, on, name) {
	const checked = await page.isChecked(`#${id}`);
	if (checked !== on) await click(`label:has(#${id})`, name, 450);
}

// ---- the take -------------------------------------------------------------------------------
try {
await page.goto(URL_, {waitUntil: 'networkidle'});
await page.locator('#loading').waitFor({state: 'hidden'});
mark('guide');
await wait(3500);
await click('#guide-2004', 'replay', 900);
await untilClock('04:40');
mark('wave_440');
await click('[data-rate="1e9"]', 'max', 600);
await page.locator('#next-sensors').waitFor({state: 'visible', timeout: 240000});
mark('done');
await wait(1500);
await setLayer('lyr-wave', false, 'wave_off');
await wait(300);
await setLayer('lyr-max', true, 'max_on');
await wait(1500);
await setLayer('lyr-iso', true, 'iso_on');
await wait(4500);
await click('#next-sensors', 'sensors_tab', 800);
await wait(500);
await setLayer('lyr-max', false, 'max_off');
await setLayer('lyr-iso', false, 'iso_off');
await moveTo(700, 420, 600);
mark('cities');
await wait(2500);
await scrollPanelTo('table.cities', 40);
mark('table_none');
await wait(3000);
await scrollPanelTo(null);
mark('headline_zero');
await wait(1800);
const pt = await page.evaluate(() => { const m = window.leadtime.map; const p = m.latLngToContainerPoint([4.5, 90.5]); const r = m.getContainer().getBoundingClientRect(); return [p.x + r.left, p.y + r.top]; });
await clickAt(pt[0], pt[1], 'drop', 1000);
await wait(3500);
await scrollPanelTo('table.cities', 40);
await scrollTableTo('Galle');
mark('chennai');
await wait(4000);
await scrollPanelTo('#optimize', 160);
await click('#optimize', 'optimize', 700);
await page.locator('#opt-compare').filter({hasText: 'Across'}).waitFor({timeout: 300000});
mark('opt_done');
await wait(1200);
await scrollPanelTo('#gain-chart', 90);
mark('chart');
await wait(5000);
await scrollPanelTo('table.cities', 40);
await scrollTableTo('Meulaboh');
await click('#city-rows tr:has-text("Banda Aceh")', 'banda', 800);
await wait(4500);
await click('#tab-learn', 'learn', 800);
await wait(600);
await scrollPanelTo('.learn:nth-of-type(4)', 40);
mark('smong');
await wait(5000);
await click('#tab-science', 'science', 800);
await wait(500);
await click('#run-tests', 'tests', 700);
await wait(1500);
if (!(await page.evaluate(() => document.getElementById('tests-summary').textContent))) { console.log('retry run-tests'); await page.click('#run-tests'); }
console.log('tests-summary:', await page.evaluate(() => document.getElementById('tests-summary').textContent));
await page.locator('#tests-summary').filter({hasText: 'passed'}).waitFor({timeout: 120000});
mark('tests_done');
await scrollPanelTo('#tests', 60);
await wait(3000);
await scrollPanelTo(null);
await click('#run-2004', 'v2004', 700);
await page.locator('#v2004').waitFor({state: 'visible', timeout: 300000});
mark('v2004_done');
await wait(800);
await scrollPanelTo('#v2004-summary', 40);
mark('scatter');
await wait(6000);
mark('end');
} catch (e) {
	console.log('STEP FAILED:', e.message);
	await page.screenshot({path: path.join(root, 'capture/rec/failure.png')}).catch(() => {});
	mark('failed');
} finally {
ff.stdin.write('q');
await new Promise((r) => ff.on('close', r));
fs.writeFileSync(path.join(root, 'capture/rec/take.json'), JSON.stringify({dpr: DPR, url: URL_, log}, null, 1));
await browser.close();
}
console.log('RECORD_DONE');
