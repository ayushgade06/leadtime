# LeadTime demo film (Remotion)

A 2:09 product film built only from real footage of https://leadtime-liard.vercel.app.

| File | What it is |
|---|---|
| `out/film.mp4` | Final film, captions burned in (git-ignored; upload this one) |
| `out/film_clean.mp4` | Same film without captions |
| `captions/film.srt` | Captions as a separate track |
| `PRODUCTION_PLAN.md` | Scene-by-scene plan, rubric mapping, honesty notes |
| `VOICEOVER_SCRIPT.md` | Narration with timestamps and a source for every number |
| `QA_REPORT.md` | Checks run on the render and their results |
| `narration.json` | Narration source (drives all timing) |
| `src/scenes/*.tsx` | One component per scene |
| `scripts/capture-leadtime.mjs`, `scripts/capture-extra.mjs` | Playwright capture of the live site (stills, page text, one fixed-camera clip) |

## Reproduce

```bash
npm install
npm i -D playwright && npx playwright install chromium
node scripts/capture-leadtime.mjs && node scripts/capture-extra.mjs   # real footage -> public/shots, public/clips, capture/*.txt
python scripts/voiceover.py      # edge-tts narration -> public/vo, src/timeline.json, captions/film.srt
python scripts/audio.py          # original music bed + SFX -> public/audio/bed.wav
npx tsc -p .
node scripts/stills.mjs && python scripts/sheet.py   # QA stills
bash scripts/master.sh           # renders and masters out/film.mp4 (+ out/film_clean.mp4)
python scripts/asr_check.py out/film.mp4
```

## Credits and licences
- Footage: LeadTime itself (MIT). The basemap in the footage is © Esri, HERE, Garmin, © OpenStreetMap contributors; bathymetry is from Terrain Tiles (Mapzen / AWS Open Data).
- Voice: Microsoft Edge neural TTS via `edge-tts` (en-US-AndrewMultilingualNeural).
- Music and sound effects: original, synthesized by `scripts/audio.py`. No third-party audio.
- Fonts: Barlow and Barlow Condensed (SIL OFL 1.1).
- Built with Remotion 4.
