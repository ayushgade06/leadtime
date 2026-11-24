# LeadTime: build plan for GSIC 2026

> **For the building session:** You are building a hackathon entry from scratch in a single session. Read this whole file first, then work through the milestones in order.
> - Commit after each milestone.
> - Don't ask questions you can answer with a sensible default. Only ask the user for credentials (GitHub or Vercel login).
> - Finish **every P0 milestone and deploy** before you start any P1 work.
> - The user is in India (IST).

---

## 0. Competition facts (they drive every decision)

- **Event:** "STEM Innovation Challenge 2026" (GSIC) on Devpost: https://stem-innovation-challenge-2026.devpost.com/ . It is student-only and virtual, with about 222 participants. Best Overall wins **$100**. There are four category awards.
- **Hard deadline:** treat the earliest published date as the real one. That is the Devpost deadline field: **Nov 26 2026, 01:30 IST (Nov 25, 12:00 PM PST)**. The page schedule (Nov 25, 11:59 PM PST) and the rules page (Nov 29) are later and should be ignored. **Submit by Nov 25, 22:30 IST at the latest.**
- **Judging weights:**
  - Technical Implementation: 30%
  - Innovation & Creativity: 25%
  - Real-World Impact: 25%
  - Presentation & Documentation: 20%
- **Judges:** John Dang, Kevin Chieng, Alex Chong. The page shows only their names and photos, and no public profiles could be found. They are most likely students or young technologists from the organizers' circle, so assume technically literate generalists. They will spend about 3–5 minutes per project: video first, then maybe the live link, then a skim of the README. **Design for that.** The project must be understandable in 10 seconds, impressive in 60, and credible when someone digs in.
- **What you must submit:**
  - title and description (problem, solution, audience, tech, features, challenges, what's next)
  - a live demo and a video of about 2–3 minutes
  - a **public GitHub repo** with docs
  - team roles
- **Rules:**
  - Build everything after Nov 23. Nothing pre-existing.
  - **Disclose AI-assisted development** in the README and on Devpost. The team must be able to explain the code, so keep it readable.
  - Attribute every data source and library.
  - No fabricated demos. Every number in the video must come from the running app.

---

## 1. The idea

### LeadTime: every minute of tsunami warning, simulated.

**One-liner:** Pick any undersea earthquake, real or hypothetical. Watch the tsunami cross a real ocean, with physics running live in your browser. Then answer the question warning-system designers face: **where should the sensors go so the most people get enough time to run?**

**The flow judges will see:**
1. Pick an ocean basin. The 2004 Indian Ocean basin is the default. The app loads real seafloor depth (bathymetry) for that ocean.
2. Click to place an earthquake, or pick a historical preset (2004 Sumatra–Andaman M9.1). The fault's size and slip come from published magnitude scaling laws.
3. A shallow-water solver propagates the tsunami across the ocean live. It runs fast in deep water and slows near coasts, so waves bend around islands. You see 12 hours of tsunami in about 25 seconds, along with a **max-wave-height "energy beam" map** and **hourly arrival-time isochrones**.
4. **Coastal city panel:** every coastal city, with population, wave arrival time and offshore wave height.
5. **Be the warning-system engineer:** drop up to 8 deep-ocean pressure sensors (DART-style buoys). Each city's **confirmed warning time** updates instantly: arrival time minus when the first buoy detects the wave minus processing delay. Cities with less time than they need to evacuate (default 15 min) turn red.
6. **Optimize:** a greedy optimizer runs across a library of about 15 plausible earthquakes along the subduction trenches. It finds the sensor layout that gives the most people at least 15 minutes, in every scenario. It shows a diminishing-returns curve ("sensor #4 protects 1.2 M more people; sensor #7 only 40k") and compares the result with existing DART station locations.
7. **The honest lesson:** near-field cities such as Banda Aceh get hit in about 20–30 minutes, so no buoy can save them. Only education and natural warning signs help there. A Learn card tells the Simeulue *smong* story (sourced in data/physics.json: 7 deaths among 78,128 people on Simeulue).

**Audience:** STEM students and teachers (wave physics, PDEs, optimization), disaster-risk-reduction educators, and coastal communities. Also anyone in the Indian Ocean region, which had **no tsunami warning system in 2004**. Verify this and source it.

### Why this was chosen (research summary, 2026-11-24)

**Past winners at similar student Devpost STEM hackathons** (ImpactX 2025, Girls In STEM Global, STEMist Hacks IV):
- Mostly **AI-wrapper apps**: tutors, safety apps, crop-disease detectors.
- Standouts included a "verified" or "trust" angle: *Taxiway Reliability* ("tells you when not to believe it"), and *Forever* ("every claim cites your own source").
- Interactive STEM simulators also won: *Lala Land* turned hand-drawn circuits into simulations, and *sign2graph* is "Draw it. See it. Understand it."
- **Lesson:** a validated, interactive science simulator stands out among dozens of chatbots, and visible verification wins trust.

**Our first idea was flood simulation ("Runnel"). We killed it.** *Deluge* (devpost.com/software/deluge) won "No Wrapper" at SteelHacks XIII in 2026. It is essentially the same project, but bigger: WebGPU on a 1024² grid, levee drawing, evacuation routing and 385 tests. Judges searching Devpost would see us as a copy.

**Tsunami prior art:** there are browser tsunami simulators (academic TsunamiLab/Nami, Terramoto). **No Devpost project was found that combines simulation with sensor-placement optimization and warning lead time.** The optimizer and the "minutes of warning" framing are the original contribution. The simulator is only the engine.

**Rubric-weighted ranking** of all ideas considered (1–10 per criterion):

| Idea | Tech 30 | Innov 25 | Impact 25 | Pres 20 | **Weighted** | Verdict |
|---|---|---|---|---|---|---|
| **LeadTime**: tsunami sim + warning-sensor optimizer | 9 | 9 | 8 | 9 | **8.75** | ✅ Build |
| Runnel: neighborhood flood sim + levees | 9 | 5 | 9 | 9 | 8.0 | ❌ Deluge already won with it |
| Wildfire spread + firebreak drawing (Rothermel) | 8 | 6 | 8 | 8 | 7.5 | Backup idea |
| Graph sonification for blind STEM students | 6 | 7 | 8 | 6 | 6.75 | Too small a wow factor |
| Hand-drawn diagram → simulation | 7 | 5 | 6 | 8 | 6.45 | Already won at STEMist |
| AI study tutor / AI safety app | 6 | 4 | 6 | 7 | 5.7 | Saturated |

**How it maps to the rubric:**
- **Technical:** a real PDE solver on a sphere-projected grid with per-row Mercator cell sizes, plus a physics source model, plus a combinatorial optimizer. It is checked against **real 2004 observed arrival times** in a scatter plot.
- **Innovation:** turns a simulator into a decision tool, the "minutes of warning" optimizer.
- **Impact:** the 2004 tsunami killed more than 227,000 people (sourced in data/physics.json); the region now has a warning system, and this teaches why sensor layout matters.
- **Presentation:** the energy-beam map and isochrones look striking, which makes a strong video.

### What we do NOT claim
LeadTime is educational. It is not an operational forecast. Show this disclaimer in the UI:

*"Educational model: about 20 km grid, simplified earthquake source, no coastal inundation. Real warnings come from national tsunami warning centres."*

Also state that real systems issue a first warning from seismic data within minutes. Buoys *confirm* the tsunami and measure its size, and confirmation is what makes evacuation orders trustworthy and prevents false alarms. Call the metric **"confirmed warning time"** and explain it in a Learn card.

---

## 2. Decisions already made (don't re-debate)

### Stack
- **Vite + TypeScript, no UI framework.** Use plain DOM and CSS.
- **Leaflet** for the map: dark basemap, markers, clicks. Draw the simulation onto a canvas laid over the map; it lines up exactly because the domain is Mercator-tile-aligned.
- **vitest** for tests.
- No backend; it is a static site. Run the simulation in a **Web Worker** for batch runs (needed for the optimizer). Live playback can run on the main thread or in the same worker.
- **Deploy** to Vercel with `npx vercel@latest --prod` (the Vercel CLI is not installed globally; the user logs in). GitHub Pages via Actions also works; use whichever gets authenticated first.
- Node 22+.

### Data (verified 2026-11-24)
| Purpose | Source | Notes |
|---|---|---|
| **Bathymetry + topography** | `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` | CORS `*` verified. **Verified that ocean depths are included:** z4/11/7 decodes to −3776 m in the open Indian Ocean. Decode with `h = R*256 + G + B/256 - 32768`. Load the image with `crossOrigin="anonymous"`, then read pixels with `getImageData`. Attribution: "Terrain Tiles (Mapzen / AWS Open Data); ETOPO1, SRTM, GMTED and others". |
| Basemap (display only) | CARTO dark `https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png` or Esri Ocean Base | Display only, so CORS is not needed. Attribute © OpenStreetMap, © CARTO. |
| Coastal cities | Hand-curated `src/data/cities.json` with about 60 cities in the Indian Ocean basin (later about 40 in the NW Pacific): name, lat, lon, population, population year, source URL | Use Wikipedia or official census figures. Keep each population source URL in the JSON. |
| Existing tsunami buoys (P1) | NOAA NDBC active station list (DART type) plus INCOIS (India) published buoy positions | Bake these into `src/data/buoys.json` with a source URL. Do not fetch them at runtime. |
| Observed 2004 arrival times (validation) | Published tide-gauge analyses, e.g. Rabinovich & Thomson 2007 (Pure Appl. Geophys.), Titov et al. 2005 (Science), Merrifield et al. 2005 (GRL) | **Get 6–12 stations with real sources.** Never invent values. Store them in `src/data/obs2004.json` with citations. |

### Domain
- A **4×4 window of z4 Terrarium tiles**, giving 1024×1024 pixels, box-downsampled to **N=512** (try 1024 if performance allows).
- The **Indian Ocean preset** uses tiles x=9..12, y=6..9. That covers roughly 41°N to 41°S and 22.5°E to 112.5°E, from East Africa to Java.
- The **NW Pacific preset** (P1) is a z4 window around Japan for 2011 Tōhoku. Compute the tile range with the tile math.
- **Mercator cell size per row:** `s_j = (40075016.686 / (256 * 2^z)) * (1024/N) * cos(lat_j)`. That is about 19.6 km at the equator at N=512. Cells are square (Mercator is conformal), so only the **cell area `s_j²` changes per row**.

### Solver: virtual-pipe shallow water, reused and adapted for ocean scale
**Land and water:**
- `b` = bed elevation (negative in the ocean). Land cells, where `b ≥ 0`, are **walls**: no flux crosses into them.
- `d` = water column, initialized to `max(0, -b) + η0`.
- `η = b + d` (the sea-surface displacement, with mean sea level at 0).

**Per step:**
1. **Flux to each ocean neighbour k:** `Δη = η_i − η_k`, `hf = upwind depth`, then `f_k = max(0, f_k + dt·g·hf·Δη)`. The pipe area-to-length ratio is about 1 for square cells. Write a code comment showing that this gives wave speed √(g·h).
2. **Friction is optional** in deep water. Use Manning n = 0.025, applied only where `hf < 200 m`, to tame unstable shallow cells.
3. **Flux limiter** for positivity: `K = min(1, d_i·s_j² / (ΣfOut·dt))`.
4. **Depth update:** `d += dt·(ΣfIn − ΣfOut) / s_j²`.
5. **Adaptive dt:** `dt = 0.4 · min_j(s_j) / sqrt(g · d_max)`. This works out to about 14–19 s.
6. **Sponge boundary:** within 20 cells of the domain edge, relax η toward 0 and damp the fluxes, so waves leave the domain without reflecting.
7. **Recorders:**
   - per cell `tArrive` = first time `|η| > 0.01 m` (Float32, initialized to Infinity)
   - per cell `etaMax`
   - total-volume tracking for the mass test

Coriolis and dispersion are ignored. Document both as limitations; they are fine for arrival times.

### Earthquake source (simplified Okada-style dipole)
**Inputs:** epicenter, Mw, strike (degrees), and optionally L, W and slip.

**Scaling** (Strasser et al. 2010, subduction interface; **verify the coefficients before use**):
- `log10 L[km] = −2.477 + 0.585·Mw`
- `log10 W[km] = −0.882 + 0.351·Mw`
- Slip comes from `M0 = 10^(1.5·Mw + 9.1)` N·m and `D = M0 / (μ·L·W)`, with μ = 3×10¹⁰ Pa.

**Initial surface:** use fault coordinates, where `u` runs along strike and `v` runs across strike, positive toward the trench (ocean side).

`η0 = U · taper(u, L) · [ G(v − W/4, W/4) − 0.6·G(v + W/4, W/4) ]`

- `U ≈ 0.3·D` gives seaward uplift and landward subsidence.
- `G` is a Gaussian and `taper` is a smooth boxcar.

This is a documented simplification. Show the formula in the Science tab.

**2004 preset:** use literature values: rupture about 1300 km long and about 150–200 km wide, curving from about 330° to 350° strike. Model it as **2–3 segments**, each a dipole, and sum them. **Source every number** (e.g. Lay et al. 2005, Science).

### Warning metric
For city c, buoy set B and scenario s:

`lead(c) = tArrive_s(c) − ( min_{b∈B} tArrive_s(b) + T_proc )`

- `T_proc` defaults to 10 min and has a slider.
- A city is "safe" when `lead ≥ T_evac` (default 15 min, slider).
- City arrival is read at the **nearest ocean cell with depth > 50 m** (no inundation modelling).
- Buoys must sit on cells with depth > 1000 m (DART is a deep-water system).

### Optimizer
- **Candidates:** every 6th ocean cell with depth > 1000 m (a few thousand). Exclude candidates inside the domain sponge.
- **Scenario library:** about 15 synthetic Mw 8.8 events spaced roughly 200 km apart along hand-digitized trench polylines (Sunda + Andaman + Makran). Store the polylines in `scenarios.ts` with a source note, e.g. the USGS Slab2 figure or a plate-boundary map. Strike follows the polyline.
- **Precompute** each scenario's `tArrive` at candidate cells and city cells only. That is about 15 × (3000 + 60) floats, which is tiny.
  - Option A: run all 15 in the Web Worker with a progress bar ("Simulating 15 earthquakes…", about 10 s each).
  - Option B, if that is too slow: bake them with a Node script (`scripts/bake.ts`, using the same `solver.ts` via `npx tsx`) into `public/scenarios.json`.
  - **Start with A.**
- **Greedy algorithm:** for K = 1..8, add the candidate that maximizes `Σ_s Σ_c pop_c · [lead_s,c ≥ T_evac]`, with ties broken by people-minutes.
- **Outputs:** buoy markers numbered in pick order, a gain-per-buoy bar chart, and a comparison against the existing-buoy layout (P1).
- **Unit test:** on a tiny synthetic case with a known best answer, greedy must find the obvious best candidate.

### Not doing (YAGNI)
- 3D globe (P2 at most)
- inundation or run-up
- Boussinesq dispersion
- full Okada model (P2)
- any backend, accounts or AI/LLM features. Judges have seen enough chatbots, and "no wrapper" is part of the pitch.

---

## 3. File layout (target)

```
/index.html
/src/main.ts          app wiring, URL-hash state (#basin,lat,lon,mw,strike,buoys...)
/src/geo.ts           tile math, Mercator row sizes, lat/lon <-> cell
/src/bathy.ts         fetch + stitch + decode Terrarium window -> {b, N, rowSize[], bbox}
/src/source.ts        earthquake scaling + dipole initial condition (multi-segment)
/src/solver.ts        PURE ocean solver (no DOM): createSim, step, recorders, stats
/src/worker.ts        runs solver for playback + scenario batches; transferable buffers
/src/render.ts        Leaflet map + canvas overlay: eta colormap, etaMax, isochrones, land mask
/src/warning.ts       lead-time calc, city snapping, greedy optimizer (pure, tested)
/src/ui.ts            panels, city table, sliders, charts (plain canvas), aria-live summaries
/src/science.ts       in-browser validation runner + 2004 observed-vs-simulated scatter
/src/scenarios.ts     presets (2004, 2011...) + trench polylines + synthetic library
/src/data/*.json      cities, buoys, obs2004 (each with source URLs)
/test/*.test.ts       solver, source, warning/optimizer tests
/README.md /docs/ARCHITECTURE.md /docs/VALIDATION.md /docs/screenshots/ /BUILDLOG.md
```

---

## 4. Milestones

Time budgets assume an agent working steadily. **P0 = must ship. P1 = what wins. P2 = only if time is left.**

### Pre-collected data (already in `D:\gsic\data\`, sourced on 2026-11-24)
Use these files. Don't re-research them. Copy them into `src/data/` at M0. Ignore `data/_raw/`, which holds downloads kept for traceability.
- `obs2004.json`: observed 2004 arrival times, for the M7 validation scatter
- `physics.json`: Strasser 2010 scaling coefficients, 2004 rupture parameters and segments, and sourced facts for the UI and pitch
- `cities.json`: Indian Ocean coastal cities with populations, for M5
- `trenches.json`: subduction trench polylines, for the M6 scenario library
- `buoys.json`: real tsunami buoy positions, for the M6 "Existing network" layer
- `DATA_NOTES.md`: gaps and caveats to read first. Any figure marked missing stays out of the UI.

### M0: Scaffold (P0, ~20 min)
- Run `npm create vite@latest . -- --template vanilla-ts`, then `npm i leaflet` and `npm i -D vitest @types/leaflet tsx`.
- `git init`, add `.gitignore`, create a **public** GitHub repo `leadtime` (`gh repo create`; if `gh` isn't authenticated, ask the user), and push.
- Start `BUILDLOG.md`, one line per milestone: time, what was done, problems hit. This is evidence of in-hackathon work and feeds the "Challenges" section.
- **Accept:** `npm run dev` serves the page, and the repo is pushed.

### M1: Ocean floor (P0, ~45 min)
- `geo.ts`: tile math plus the `rowSize[]` array. Unit-test it: a known tile for a known lat/lon, and `rowSize` at the equator vs 60° (ratio 0.5).
- `bathy.ts`: fetch 16 Terrarium tiles with `Promise.all`, draw them onto a 1024² canvas, decode, box-downsample to N, and build the land mask.
- Show the result as a depth-tinted overlay on the Leaflet dark basemap: deep navy through light cyan for depth, with land transparent.
- **Accept:** the Indian Ocean preset loads in under 3 s. Sumatra, Sri Lanka and India appear as land. Logged depth min/max is plausible: around −7000 m in the trenches.

### M2: Solver and source (P0, ~90 min)
- `solver.ts` and `source.ts` exactly as in §2. Tests in `test/solver.test.ts`, which are also the Science tab content:
  1. **Mass conservation:** closed basin, initial hump. After 2000 steps, `|ΔV|/V_hump < 1e-6`.
  2. **Ocean at rest:** real-like bathymetry with η = 0. After 1000 steps, max |η| < 1e-6 m (well-balanced).
  3. **Wave speed:** flat 4000 m basin. The front travels at √(g·4000) ≈ 198 m/s, within 5%.
  4. **Radial symmetry:** flat basin, centered Gaussian. The field is symmetric to 1e-5.
  5. **Shoaling/refraction sanity check:** a wave over a sloping shelf slows down. Arrival over the shelf is later than in deep water by the analytic integral ∫dx/√(gh), within 10%.
  6. **Source scaling:** Mw 9.1 gives L, W and D within the expected ranges; η0 has both an uplift lobe and a subsidence lobe.
- **Accept:** `npx vitest run` is green. If a test misses on physics rather than a bug, report the true number in VALIDATION.md. Do not fudge it.

### M3: Live tsunami (P0, ~75 min)
- `render.ts`: a canvas overlay of η using a diverging colormap (blue for troughs, white for 0, red for crests), with a symmetric soft-log scale so small far-field waves stay visible. Land stays transparent.
- Run the solver in the worker and post `η` (Float32Array, transferable) at about 30 fps. Show a HUD with simulated time (`+02:14 h after quake`), speed controls (play/pause, 1×/4×/max) and reset.
- Click the map to set an epicenter. Add a panel for Mw (7.5–9.5) and strike, plus a **2004 Sumatra–Andaman preset button**.
- After the run (or live), add toggles: **Max wave height** (the energy-beam map from `etaMax`) and **Arrival isochrones** (hourly bands from `tArrive`; draw cells where `floor(t/3600)` differs from a neighbour as contour pixels, and label the hours).
- **Accept:** in a real browser (use the claude-in-chrome tools: load, play the 2004 preset, take a screenshot), the simulated arrivals land in the right range of the observed times in `data/obs2004.json`: Chennai 156 min, Colombo 173 min, Malé 197 min, Salalah 433 min, Zanzibar 585 min. Note the actual numbers in BUILDLOG. The energy beam should point west toward Sri Lanka and India.
- **Build the 2004 preset from `physics.json → rupture2004.segments`** (5 Grilli segments). Don't use the Strasser scaling for it, because Strasser gives about 700 km, roughly half the real rupture.

### M4: Ship the MVP (P0, ~20 min)
- `npm run build`, deploy, and put the live URL at the top of the README.
- Add the disclaimer banner and the attributions footer.
- Commit: "MVP: real-bathymetry tsunami simulator".
- **From here on there is always a deployed working version.** Redeploy after every milestone.

### M5: Cities and the warning engineer (P1, ~75 min). This is the core innovation.
- `cities.json` (Indian Ocean, about 60 cities, sourced populations). Snap each city to its nearest ocean cell deeper than 50 m.
- **City panel**, sorted by arrival: name, population, arrival (h:mm), max offshore height (cm), and **confirmed warning time** with a ✅ or ❌ against T_evac. Clicking a row pans to the city.
- **Buoy tool:** click to place (depth > 1000 m only; say why if refused), drag to move, right-click or ✕ to delete, maximum 8. Lead times update **instantly** from `tArrive`, with no re-simulation.
- Headline stats: "**X.X M people** have ≥ 15 min of confirmed warning (Y% of the coastal population in view)". Add sliders for T_proc and T_evac.
- **Accept:** placing one buoy west of Sumatra visibly flips Sri Lanka and Indian cities from ❌ to ✅, and Banda Aceh stays ❌.

### M6: Optimizer (P1, ~60 min)
- Build the scenario library (trench polylines → about 15 synthetic Mw 8.8 events). Batch-run them in the worker with a progress bar, and cache the results in memory for the session.
- Implement the greedy optimizer in `warning.ts`, with a unit test on a tiny synthetic case.
- **"Optimize K sensors" button:** animate the buoys appearing one by one. Show the **gain-per-buoy bar chart** (diminishing returns) and **"protected in N of 15 scenarios" per city**.
- **"Existing network" layer (P1, if the data is sourced):** show the real buoy positions and their score under the same metric, next to the optimized layout. Frame it honestly: real networks also optimize for cost, maintenance, false alarms and politics.
- **Accept:** the optimizer runs end to end in under 3 min on a laptop and gives a sensible layout (sensors between the trenches and the populated coasts).

### M7: Science tab and real-history validation (P1, ~60 min). This turns the demo into engineering.
- Add a "Run validation" button that runs the M2 tests live in the browser, with pass/fail, measured vs expected values and small charts (wave front vs √(gh) line, volume error).
- **2004 check:** an observed vs simulated arrival-time **scatter plot** for the sourced stations in `obs2004.json`, with a 1:1 line, the mean absolute error in minutes and the citations listed under the plot. This is the single most convincing technical artifact, so make it clean.
- Add a "How it works" section: the equations in HTML, a pipe-model diagram, the source-model formula and the limitations.
- Write `docs/VALIDATION.md` with the same content and screenshots.

### M8: Polish, Learn cards, accessibility (P1, ~60 min)
- **Load the `frontend-design` skill** and do one deliberate visual pass. Direction: a calm "ocean operations centre": dark, one accent (alert amber for warnings, cyan for water), tabular-figure numbers, translucent panels. It should not look like a template.
- **First-run guide in 3 steps:** "Pick an earthquake → Watch the wave → Place sensors". Add a **"Replay 2004"** hero button.
- **Learn cards** (about 60 words each, each with a "Show me" button that sets up the scene):
  1. why tsunamis are fast in deep water (√(gh): about 700 km/h, like a jet)
  2. refraction and why energy beams form
  3. seismic warning vs buoy confirmation
  4. near-field: when there's no time (the *smong* story)
- **Accessibility:**
  - an `aria-live` summary such as "Wave reached Colombo at 2 h 05 min; 3 of 12 cities warned in time"
  - full keyboard operation with visible focus
  - a colorblind-safe diverging map (blue/orange is acceptable) with numbers available as text
  - `prefers-reduced-motion` support
- **Mobile:** panels become a bottom sheet, and N drops to 256.
- **Share link:** encode the URL hash (basin, quake parameters, buoys) and add a "Copy link" button.

### M9: Documentation (P1, ~40 min). Presentation is 20% of the score.
**README.md**, in this order:
1. live link, video and hero GIF
2. pitch paragraph
3. the problem (sourced: 2004 death toll, no warning system in 2004, warning-time facts)
4. features
5. how it works, linking ARCHITECTURE and VALIDATION
6. the validation scatter image
7. tech stack
8. data sources and attributions
9. limitations
10. run locally (`npm i && npm run dev`, `npx vitest run`)
11. **AI-assisted development disclosure**
12. team and roles
13. MIT license

**docs/ARCHITECTURE.md:** a Mermaid data-flow diagram (tiles → decode → source → solver(worker) → recorders → warning/optimizer → UI) and the equations. Also capture 4–6 screenshots and a GIF.

### M10: Video and submission (P1, ~60+ min)
- Run the **`make-video` skill** with the storyboard in §5. Use real footage from the deployed app only, 2:15–2:45 long. Upload it to YouTube (unlisted is fine).
- Fill in Devpost from §6. Categories: Engineering & Scientific Computing (primary), Social Impact, Education & Accessibility.
- **Submit by Nov 25, 22:30 IST.** Devpost allows edits until the deadline, so submit early and refine afterward.

### P2 stretch (only after submitting)
- NW Pacific basin with the 2011 Tōhoku preset, validated against the DART 21418 recorded arrival
- a real Okada (1985) source
- a 3D globe view
- GeoNames-based automatic city list
- N=1024 via WebGL compute
- a "design your own warning network for a budget" mode (only with sourced costs)

---

## 5. Video storyboard (build the features this needs)

| Time | Shot | Voiceover idea (replace bracketed numbers with real app output) |
|---|---|---|
| 0:00 | Black screen. Text: "26 December 2004. 07:58 local time." Then the Sumatra coastline | "A magnitude 9.1 earthquake. The tsunami reached Chennai [2 h 36 min] and Colombo [2 h 53 min] later. There was no warning system in the Indian Ocean." |
| 0:15 | Press "Replay 2004": the wave expands across the real seafloor | "This is LeadTime: a real physics simulation of that wave, running on the actual ocean floor, live in your browser." |
| 0:35 | Energy-beam map, then isochrones | "Deep water makes it fast, the speed of a jet. The seafloor bends it into beams. Here's where it hit hardest and when." |
| 0:55 | City panel: arrival times, populations | "For every coastal city: when the wave arrives, and how many people live there." |
| 1:05 | Drop one buoy: cities flip from red to green | "Now you're the engineer. One sensor in the right place gives [Colombo] [X] minutes of confirmed warning." |
| 1:25 | Optimize: buoys pop in, gain chart | "Our optimizer tests [15] possible earthquakes and finds where [6] sensors protect the most people. Notice the diminishing returns." |
| 1:45 | Banda Aceh stays red; Learn card | "And the honest answer: some cities get hit in [20] minutes. No sensor can save them. Only education can." |
| 2:00 | Science tab: tests go green, observed vs simulated scatter | "We validated it against tide-gauge records from 2004: mean error [N] minutes." |
| 2:20 | Montage, share link, GitHub | "Free, open source, no login. For classrooms and for coastal communities." |
| 2:35 | Logo | "LeadTime. Every minute counts." |

---

## 6. Devpost submission draft (fill in the [brackets] with real values)

**Title:** LeadTime: Every Minute of Tsunami Warning, Simulated

**Tagline:** Simulate a tsunami across the real ocean floor, then find where warning sensors buy coastal cities the most time.

**Inspiration / Problem:** On 26 Dec 2004 the Indian Ocean tsunami killed more than 227,000 people (physics.json). The wave took about 2 h 53 min to reach Colombo (obs2004.json), but the region had no warning system. Today warning networks exist, but how sensor placement translates into minutes of warning for real people is invisible to students and communities. Professional tsunami models need specialist software.

**What it does:**
- real-bathymetry tsunami simulation for any earthquake
- energy and arrival-time maps
- per-city arrival times and populations
- interactive sensor placement with instant "confirmed warning time"
- a multi-scenario optimizer
- a Science tab validated against 2004 observations

**How we built it:**
- TypeScript, Leaflet and Web Workers
- a virtual-pipe shallow-water solver on a Mercator grid with per-row cell sizes, a positivity-preserving flux limiter, adaptive CFL time steps and sponge boundaries
- a magnitude-scaled dipole earthquake source
- a greedy coverage optimizer
- AWS Terrain Tiles bathymetry decoded client-side
- vitest
- no backend

**Challenges:** [from BUILDLOG], e.g. Mercator cell sizes, sponge reflections, multi-segment 2004 rupture, making the optimizer fast.

**Accomplishments:** [mean arrival error vs observations], [N]² cells at [x]× real time, [K] tests.

**What's next:** Pacific and Atlantic basins, the Okada source, coastal inundation with fine local grids, local-language UI and classroom lesson packs.

**AI disclosure:** Built with AI-assisted development (Claude Code) for scaffolding, solver implementation and documentation drafts. The team reviewed all code, ran and verified every validation test, and can explain each component. All data and libraries are attributed.

**Built with:** typescript, leaflet, web-workers, vite, vitest, canvas, aws-terrain-tiles

**Team:** [names, roles]

---

## 7. Risks and fallbacks

| Risk | Fallback |
|---|---|
| Terrarium tile fails or is slow | Retry once. Pre-save the Indian Ocean 4×4 window into `public/` as a baked PNG so the default demo works offline. |
| Arrival times far off the 2004 observations | Check the source orientation/segments and the threshold first (1 cm can trigger early on numerical noise; try 2–5 cm). Report the honest error either way. Coarse grids are known to be off by minutes near coasts. |
| Optimizer batch too slow | Drop N to 384 for the batch, cut to 10 scenarios, or bake them with `scripts/bake.ts`. |
| Sponge reflections visible | Widen the sponge to 30 cells and use quadratic damping. |
| City population data takes too long | Start with the 20 biggest coastal cities and add more later. |
| Running out of time | Everything after M4 is incremental. M5 is the minimum for the innovation story. Prioritize M5 → M7 (scatter) → M10 → others. |

## 8. Working rules
- Use the ponytail approach: the fewest files and dependencies, readable code, and physics comments. The team must be able to explain `solver.ts`, `source.ts` and `warning.ts` to judges.
- Check every UI milestone in a real browser (claude-in-chrome: load, interact, screenshot, read the console). Don't mark a milestone done from code alone.
- **Never invent a number shown to users or judges.** Every historical or population figure in the UI or docs needs a source URL in the code or docs.
- Commit and push after each milestone, and redeploy after M4.
