# Production plan: LeadTime film

**One scenario:** the real 2004 Sumatra–Andaman replay on the deployed app. We follow it from the wave, to one sensor, to the optimizer, to the city no sensor can save, to the check against 2004's tide gauges.
**Length:** 2:09 (the rules recommend about 2–3 minutes). 1920×1080, 30 fps.
**Footage:** every product frame is a real capture of https://leadtime-liard.vercel.app, taken with Playwright at a 1536×864 CSS viewport and 1.25× device scale (`scripts/capture-leadtime.mjs`, `scripts/capture-extra.mjs`). The page text for each still is in `capture/*.txt`.

## Rubric mapping
| Criterion (weight) | Scene that earns it |
|---|---|
| Technical implementation (30%) | Wave (real solver playback), Beam (recorders), Optimizer (multi-scenario greedy), Proof (tide-gauge check, tests) |
| Innovation (25%) | Reveal (the question), Sensor + Optimizer (turning a simulator into a sensor-placement decision) |
| Real-world impact (25%) | Hook, Problem (2004, no warning system), Nearfield (honest limits, smong) |
| Presentation (20%) | The whole film: captions, pacing, consistent identity, sources on screen |

## Scenes
| # | Time | Scene | Visuals | Motion | Honesty notes |
|---|---|---|---|---|---|
| 1 | 0:00 | Hook | Kinetic type: 26 DECEMBER 2004 / MAGNITUDE 9.1 / OFF SUMATRA, plus "00:58 UTC · USGS" | Words rise on their spoken word; slow drift | USGS values |
| 2 | 0:09 | Problem (paper, wipe in) | Two observed arrival times: Chennai 2 h 36 min, Colombo 2 h 53 min; NO WARNING SYSTEM; 227,000+ died | Cards rise on the spoken numbers | Each figure has its citation printed under it |
| 3 | 0:22 | Reveal | Wordmark, then the real first-run guide with its question highlighted | Crossfade; one slow push | Live-site still |
| 4 | 0:29 | Wave | Real playback clip (10.8 s, fixed camera, 1×) from +00:08 to +03:51, then the +12:00 still | One slow push; clock highlighted | Badge: "REAL PLAYBACK · 20 SIMULATED MIN PER SECOND" (the app's own speed setting) |
| 5 | 0:44 | Beam | Highest-wave + hourly-arrival layers | Three slow camera keys; two highlights in turn | Real layer output |
| 6 | 0:51 | Cities | Map (coral dots) + city table, then headline "0" | Crossfade in the panel box | Real stills with no sensors |
| 7 | 1:00 | Sensor | Same map before/after one click; headline 0 → 73.1 M; Chennai row ✓ 101 min | Crossfades keyed to "drop", "seventy-three", "Chennai" | Real click at 4.5° N 90.5° E (3,101 m) |
| 8 | 1:15 | Optimizer | Six amber sensors; gain chart 52.9 M → 0; the comparison paragraph | Highlights on the first and sixth bar, then the paragraph | Narration says "about 53 million" (see VOICEOVER_SCRIPT for the 52.9/53.0 note) |
| 9 | 1:32 | Nearfield | Banda Aceh dot + row (wave at 0:21, ✕); the smong Learn card | Crossfade on "Simeulue" | McAdoo et al. 2006, as cited in the app |
| 10 | 1:46 | Proof (paper, wipe in) | CLAIM → EVIDENCE (the app's real scatter, MAE 20 min, 12 of 13 early) → VERDICT "errs on the safe side" | Cards land on spoken words; stamp | We report the error as measured and don't hide it |
| 11 | 1:59 | Close | LeadTime / EVERY MINUTE COUNTS. / free, open source, no login / URL + repo | Reveal, then fade to black | |

## Cut on purpose
- A Mw 9.5 "what if" scenario: it isn't validated, so we didn't dramatize it.
- Spoken numbers for the real-network score (58.7 M): it's on screen with its caveats, but the narration keeps to the qualitative point.
