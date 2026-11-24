# Devpost submission: ready to paste

**Title:** LeadTime: Every Minute of Tsunami Warning, Simulated

**Tagline:** Simulate a tsunami across the real ocean floor, then find where warning sensors buy coastal cities the most time.

**Categories:** Engineering & Scientific Computing (primary), Open Innovation & Social Impact, Education & Accessibility

**Links**
- Live demo: https://leadtime-liard.vercel.app
- Source: https://github.com/ayushgade06/leadtime
- Video: https://youtu.be/J1QUlLlnz5w

---

## Inspiration
On 26 December 2004 a magnitude 9.1 earthquake off Sumatra sent a tsunami across the Indian Ocean. It killed more than 227,000 people (Wikipedia: 227,898; USGS: more than 283,100). The wave took 2 hours 36 minutes to reach Chennai and 2 hours 53 minutes to reach Colombo's tide gauge (Nagarajan et al. 2006; Merrifield et al. 2005), yet the Indian Ocean had no tsunami warning system. Warning networks exist today, but how sensor placement turns into *minutes of warning for real people* is invisible to students and coastal communities, and professional tsunami models need specialist software.

## What it does
- **Simulates any tsunami on the real seafloor**, live in the browser. Replay 2004 from its five published fault segments (Grilli et al. 2007), or click the ocean and choose a magnitude.
- **Shows where it hits hardest and when:** a highest-wave map ("energy beams") and hourly arrival lines.
- **65 coastal cities** with sourced populations, arrival times and offshore wave heights.
- **Makes you the warning engineer.** Drop up to 8 deep-ocean pressure sensors (like NOAA's DART buoys), and every city's *confirmed warning time* updates instantly. In the 2004 replay, one sensor west of Sumatra takes the number of people with ≥ 15 minutes of confirmed warning from 0 to 73.1 million.
- **An optimizer** simulates 15 hypothetical Mw 8.8 earthquakes along the Sunda, Andaman and Makran trenches in parallel Web Workers. It then places sensors greedily where they warn the most people. The diminishing returns are stark: the first sensor warns about 53 million people per quake, the sixth adds nothing. It also scores the real buoy network under the same metric, with honest caveats.
- **The honest lesson:** near-field cities like Banda Aceh (hit in 21 minutes in our model) can't be saved by any sensor. A Learn card tells the story of *smong* on Simeulue Island, where an oral tradition meant only 7 of 78,128 people died.
- **A Science tab** re-runs the physics test suite live and checks the simulation against 13 tide gauges from 2004.

## How we built it
- **TypeScript + Vite + Leaflet**, plain DOM, no backend, no AI APIs. Everything runs in your browser.
- **Bathymetry:** 16 Terrarium elevation tiles (ETOPO1 and other sources), decoded client-side and averaged to a 512 × 512 Mercator grid (~20 km cells). Each row has its own cell size, and a flood fill keeps only the connected ocean.
- **Source model:** fault length, width and slip from magnitude (Strasser et al. 2010) and seismic moment, turned into an uplift/subsidence dipole. The 2004 preset uses five segments that break at their published times.
- **Solver:** a "virtual pipe" shallow-water model with one signed flux per cell face, giving waves at √(g·h). It has a positivity limiter, an adaptive CFL time step, an absorbing sponge, Manning friction in shallow water, and arrival-time and highest-wave recorders. It runs in a Web Worker at roughly 1000× real time.
- **Warning metric:** lead = t_city − (t_first sensor + processing delay). The greedy optimizer runs over 3,350 deep-water candidate sites and 15 scenarios.
- **13 vitest tests** (6 physics checks, plus geometry and optimizer tests), which also run live in the app.
- A calm "ocean operations centre" design: Barlow fonts, colour-blind-safe palettes, keyboard alternatives, reduced motion, a phone layout, and share links.

## Challenges we ran into
- **Honest validation.** Our simulated 2004 arrivals came out early. Mean absolute error is 20 min over 13 tide gauges, and 12 of 13 are early. A 20 km grid can't resolve harbours and shallow shelves. We report this rather than tune it away. Because the warning tool reads cities further offshore, its warning times err on the short, safe side.
- **Two clamped one-way pipes per face** (the classic virtual-pipe trick) added a spurious kick every time the flow reversed. We switched to one signed flux per face, which reduces exactly to the standard long-wave scheme.
- **Making the optimizer fast:** a coarser 256² grid for the scenario library and parallel workers bring 15 earthquakes down to under 30 s.
- **Real-world friction:** the CARTO basemap began requiring an API key mid-build, so we switched to Esri. Chrome's `requestAnimationFrame` throttling stalled the physics, so the worker now paces itself. Last-bit floating-point differences between browser builds move one optimizer figure by about 0.2%.

## Accomplishments that we're proud of
- A real PDE solver that passes its physics tests: mass conserved to 1e-15, an ocean at rest stays exactly still, wave speed within 0.3% of √(g·h), and shelf travel time within 2.4% of ray theory.
- A validation scatter against real 2004 tide-gauge data, shown in the app with its citations.
- Turning a simulator into a decision tool: "where does the next sensor buy the most minutes?"
- Every number in the app traces to a sourced JSON file.

## What we learned
Deep-water physics is the easy part; coasts are hard. Warning time is a systems problem (detection, processing, evacuation), and some places will always need education rather than sensors.

## What's next
Pacific and Atlantic basins (2011 Tōhoku first), the full Okada source, fine nested grids for coastal inundation, local-language interfaces, and classroom lesson packs.

## AI disclosure
Built with AI-assisted development (Claude Code) for scaffolding, the solver and optimizer implementation, the UI and documentation drafts. The team reviewed all code, ran and checked every validation test, and can explain each component. All data sources and libraries are attributed in the README. BUILDLOG.md records the build with timestamps.

## Built with
typescript, vite, leaflet, web-workers, canvas, svg, vitest, aws-terrain-tiles, remotion (video)

## Team
Ayush Gade (@ayushgade23): solo entry.
