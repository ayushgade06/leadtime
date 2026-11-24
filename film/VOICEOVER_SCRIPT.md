# Voiceover script: LeadTime film (2:09)

Voice: edge-tts `en-US-AndrewMultilingualNeural` (synthetic; Microsoft Edge neural TTS), rate +6%, closing line −2%. "LeadTime" is spoken as "Lead Time". Timestamps are where each line starts in the final film.

| Time | Scene | Line |
|---|---|---|
| 0:01.2 | hook | On 26 December 2004, a magnitude 9.1 earthquake broke the seafloor off Sumatra. |
| 0:10.0 | problem | The tsunami took 2 hours 36 minutes to reach Chennai, and almost three hours to reach Colombo. |
| 0:16.8 | problem | The Indian Ocean had no warning system. More than 227,000 people died. |
| 0:23.2 | reveal | This is LeadTime. It asks one question: how many minutes does a coastal city get to run? |
| 0:29.3 | wave | Replay 2004, and a shallow-water solver carries the wave across the real ocean floor, live in your browser. |
| 0:37.9 | wave | Over deep water it moves as fast as a jet, and twelve hours of tsunami play out in under a minute. |
| 0:44.7 | beam | The seafloor bends it into beams. Here's where it hit hardest, and when, hour by hour. |
| 0:51.2 | cities | For 65 cities on the coast, you see when the wave arrives, and how many people live there. |
| 0:56.9 | cities | With no sensors, nobody gets a confirmed warning. |
| 1:00.7 | sensor | Now you're the engineer. Drop one deep-ocean sensor west of Sumatra, and 73.1 million people get at least fifteen minutes to evacuate. |
| 1:10.4 | sensor | Chennai, with 6.7 million people, gets 101 minutes. |
| 1:15.0 | optimizer | The optimizer tests 15 possible earthquakes along the trenches, and places six sensors. |
| 1:21.1 | optimizer | The first warns about 53 million people per quake. The sixth adds nothing. |
| 1:26.7 | optimizer | Real networks also weigh cost and upkeep, but now you can see what each sensor buys. |
| 1:32.4 | nearfield | And the honest part: Banda Aceh is hit in 21 minutes. No sensor can save it. |
| 1:38.2 | nearfield | On nearby Simeulue Island, an oral tradition did. Only seven of more than 78,000 people died there. |
| 1:46.7 | proof | Can you trust the physics? Against 13 tide gauges from 2004, our arrival times are off by 20 minutes on average, and mostly early. |
| 1:56.0 | proof | So the warning times you see err on the safe side. |
| 1:59.9 | close | LeadTime. Free, open source, no login. Every minute counts. |

## Fact sources (every number spoken or shown)

| Claim | Source |
|---|---|
| 26 December 2004, Mw 9.1, off Sumatra, 00:58 UTC | USGS ComCat event official20041226005853450_30 (`src/data/physics.json` → `rupture2004.MwUSGS`, `originTimeUTC`, `epicenterUSGS`) |
| Chennai 2 h 36 min (156 min) | Nagarajan et al. 2006, Earth Planets Space 58, Table 2 (`src/data/obs2004.json`) |
| Colombo "almost three hours" / 2 h 53 min (173 min) | Merrifield et al. 2005, GRL 32, L09603, Table 1 (`obs2004.json`) |
| No warning system in the Indian Ocean in 2004 | Merrifield et al. 2005 para [3] (`physics.json` → `facts.noWarningSystem2004`) |
| More than 227,000 died | Wikipedia 227,898; USGS 283,100+ (`physics.json` → `facts.deathToll`) |
| "As fast as a jet" | NOAA NWS Tsunami Safety: "over 500 mph … as fast as a jet plane" (`facts.deepOceanSpeed`) |
| 12 hours of tsunami in under a minute | App playback at 20 simulated min per second plays 12 h in ~36–45 s (measured in Chrome, BUILDLOG M5) |
| 512 × 512 grid (kicker label) | `src/geo.ts` `INDIAN_OCEAN.N = 512` |
| 65 coastal cities | `src/data/cities.json` (65 entries; captured page text) |
| No sensors → 0 people warned | Captured page text `capture/sensors_none.txt` ("Confirmed warning time … 0") |
| One sensor at 4.5° N 90.5° E, 3,101 m deep → 73.1 M people with ≥ 15 min | `capture/sensor_one.txt` ("73.1 M", "1. 4.5°, 90.5°, 3101 m deep") |
| Chennai 6.7 M people, ✓ 101 min | `capture/far_one.txt` ("Chennai India 6.7 M 2:16 181 cm ✓ 101 min") |
| 15 hypothetical earthquakes, six sensors | `capture/optimized.txt`; `src/main.ts` library (`scenarioLibrary(8.8, 300)` minus the sponge one) |
| First sensor warns "about 53 million" per quake; the sixth adds nothing | Gain chart in `public/shots/optimized.png`: 52.9 M, 7.1 M, 943 k, 438 k, 69 k, **0**. (Desktop Chrome 158 shows 53.0 M: last-bit floating-point differences between browser builds flip one city at the 5 cm threshold; "about 53 million" is true for both.) |
| Real network comparison (on screen) | `capture/optimized.txt`: "The 13 real stations we have positions for score 58.7 M" |
| Banda Aceh hit in 21 minutes | `capture/cities_one.txt` ("Banda Aceh … 0:21") |
| Simeulue: only 7 of 78,128 died | McAdoo et al. 2006, Earthquake Spectra 22(S3) (`facts.smongSimeulue`); shown in the app's Learn card |
| 13 tide gauges, mean error 20 min, mostly early (12 of 13) | `capture/scatter.txt` ("Mean absolute error 20 min over 13 tide gauges … on average 11 min early"); per-gauge table in `docs/VALIDATION.md` (only Zanzibar is late) |
| 6 / 6 physics tests pass (on screen) | `capture/tests.txt` ("6 of 6 checks passed") |
| Free, open source, no login | MIT license in the repo; static site, no accounts |
