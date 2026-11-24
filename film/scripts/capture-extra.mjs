// Supplementary real captures: the far-field rows of the city table, before and after one sensor.
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const browser = await chromium.launch();
const page = await (await browser.newContext({viewport: {width: 1536, height: 864}, deviceScaleFactor: 1.25, colorScheme: 'dark'})).newPage();
const shot = async (name) => {
	await page.waitForTimeout(600);
	await page.screenshot({path: path.join(root, `public/shots/${name}.png`)});
	fs.writeFileSync(path.join(root, `capture/${name}.txt`), await page.evaluate(() => document.body.innerText));
	console.log('shot', name);
};
const toRow = (name) => page.evaluate((n) => {
	const p = document.querySelector('.panel'), tw = document.querySelector('.table-wrap');
	p.scrollTop += tw.getBoundingClientRect().top - p.getBoundingClientRect().top - 120;
	const row = [...document.querySelectorAll('#city-rows tr')].find((r) => r.innerText.startsWith(n));
	tw.scrollTop += row.getBoundingClientRect().top - tw.getBoundingClientRect().top - 34;
}, name);
await page.goto('https://leadtime-liard.vercel.app/#q=2004', {waitUntil: 'networkidle'});
await page.locator('#loading').waitFor({state: 'hidden'});
await page.click('[data-rate="1e9"]');
await page.locator('#next-sensors').waitFor({state: 'visible', timeout: 180000});
await page.click('#next-sensors');
await toRow('Galle');
await shot('far_none');
const pt = await page.evaluate(() => { const m = window.leadtime.map; const p = m.latLngToContainerPoint([4.5, 90.5]); const r = m.getContainer().getBoundingClientRect(); return [p.x + r.left, p.y + r.top]; });
await page.mouse.click(pt[0], pt[1]);
await toRow('Galle');
await shot('far_one');
await browser.close();
