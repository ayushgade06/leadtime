import {chromium} from 'playwright';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const dir = path.resolve(import.meta.dirname);
const b = await chromium.launch();
const p = await b.newPage({viewport: {width: 794, height: 1123}, deviceScaleFactor: 2});
await p.goto(pathToFileURL(path.join(dir, 'brief.html')).href);
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(500);
const pages = await p.$$('.page');
for (let i = 0; i < pages.length; i++) await pages[i].screenshot({path: path.join(dir, `page${i + 1}.png`)});
// overflow check: any element extending past its page?
const over = await p.evaluate(() => [...document.querySelectorAll('.page')].map((pg) => { const r = pg.getBoundingClientRect(); return [...pg.querySelectorAll('*')].filter((e) => { const q = e.getBoundingClientRect(); return q.height && q.bottom > r.bottom - 22; }).map((e) => e.className || e.tagName).slice(0, 5); }));
console.log('near-bottom elements:', JSON.stringify(over));
await p.pdf({path: path.join(dir, 'LeadTime_judges_brief.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true});
await b.close();
console.log('PDF ok');
