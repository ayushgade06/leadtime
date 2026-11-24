## Inspiration

On 26 December 2004, a magnitude 9.1 earthquake broke the seafloor off Sumatra. The tsunami took **2 hours 36 minutes** to reach Chennai and **2 hours 53 minutes** to reach Colombo's tide gauge. That was enough time to evacuate, but the Indian Ocean had **no tsunami warning system**. More than **227,000 people** died.

Warning networks exist today, but one question is still invisible to the students and coastal communities who depend on them: *how does where you put a sensor turn into minutes of warning for real people?* Professional tsunami models need specialist software and training. We wanted anyone with a browser to be able to answer it.

## What it does

**LeadTime turns a tsunami simulator into a decision tool: where should warning sensors go so the most people get enough time to run?**

- **Real seafloor, real physics, live.** Replay the 2004 Sumatra–Andaman earthquake from its 5 published fault segments, or click anywhere on the ocean and choose a magnitude. A shallow-water solver carries the wave across 262,144 cells of real bathymetry, right in your browser. Twelve hours of tsunami play out in under a minute.
- **Where it hits hardest, and when.** A highest-wave map shows the "energy beams" the seafloor focuses (in 2004, straight at Sri Lanka and India), plus hourly arrival lines.
- **65 coastal cities.** Each one gets a sourced population, a wave arrival time and an offshore height.
- **You are the warning engineer.** Drop up to 8 deep-ocean pressure sensors, like NOAA's DART buoys. Every city's *confirmed warning time* updates instantly. In the 2004 replay, **one sensor west of Sumatra takes the people with ≥ 15 minutes of warning from 0 to 73.1 million.**
- **An optimizer that shows diminishing returns.** It simulates **15 hypothetical Mw 8.8 earthquakes** along the Sunda, Andaman and Makran trenches, then places sensors greedily. The first sensor warns about **53 million** people per quake; the sixth adds **nothing**. Six sensors cover **61.5 M of the 62.1 M** people in reached cities. We also score the real buoy network the same way: 58.7 M, with honest caveats.
- **The honest lesson.** Banda Aceh is hit in **21 minutes** and no sensor can save it. A Learn card tells the story of *smong* on Simeulue Island, where an oral tradition meant only **7 of 78,128** people died.
- **A Science tab you can run yourself.** It re-runs our physics tests live and checks the simulation against 2004 tide gauges.

## How we built it

**1. Real ocean floor.** We decode 16 Terrarium elevation tiles (ETOPO1, SRTM and others) in the browser, then average them to a **512 × 512 Mercator grid** (~20 km cells). Each row's cell size shrinks with latitude, \\( s = 19.6\,\text{km} \cdot \cos\varphi \\). A flood fill keeps only ocean connected to the Indian Ocean.

**2. Earthquake → initial wave.** Fault length and width come from Strasser et al. (2010) magnitude scaling. Slip comes from the seismic moment \\( M_0 = 10^{1.5 M_w + 9.1} = \mu L W D \\). The seafloor, and the sea surface above it, rises on the trench side and drops on the land side as a dipole. The 2004 preset uses Grilli et al.'s 5 segments, each breaking at its published time.

**3. A "virtual pipe" shallow-water solver.** Every ocean cell is a water column joined to its neighbours by pipes. A height difference accelerates the flow, and the flow moves water:

$$\frac{dQ}{dt} = g\,h\,\Delta\eta, \qquad \frac{d\eta}{dt} = \frac{\sum Q_{in} - \sum Q_{out}}{s^2} \;\;\Rightarrow\;\; c = \sqrt{g h}$$

That gives about 200 m/s (720 km/h) over 4 km of water, slowing over shelves, which is what bends wave fronts into beams. We added a positivity limiter, an adaptive CFL time step (\\( dt \approx 20 \\) s), a 20-cell absorbing sponge, shallow-water Manning friction, and recorders for arrival time and highest crest. It runs in a **Web Worker at roughly 1000× real time** (≈12 ms per step).

**4. Warning metric and optimizer.** For each city, \\( \text{lead} = t_{city} - (t_{first\ sensor} + T_{proc}) \\), and a city counts as warned if lead ≥ \\( T_{evac} \\) (sliders, defaults 10 and 15 min). The greedy optimizer searches **3,350 deep-water candidate sites × 15 scenarios** on a 256² grid in 3–4 parallel workers. It finishes in **under 30 seconds**.

**5. Stack.** TypeScript, Vite, Leaflet, Web Workers, Canvas and SVG, with **13 vitest tests**. There is no backend, no accounts and no AI API: every number on screen comes from the physics or a sourced JSON file.

## Validation: we publish where we lose

- **Physics tests (6/6 pass, live in the app):** mass conserved to 1e-15; an ocean at rest stays exactly still; wave speed 197.6 vs 198.1 m/s (0.3%); exact symmetry; shelf travel time within 2.4% of ray theory; realistic Mw 9.1 fault size.
- **2004 vs real tide gauges:** over **13 gauges** the mean absolute error is **20 minutes**, and 12 of the 13 simulated arrivals are *early*. A 20 km grid can't resolve harbours and shallow shelves. Because the warning tool reads cities further offshore, its warning times err on the **short, safe side**. The full table is in VALIDATION.md.

## Challenges we ran into

- **The flow "kicked" every time it reversed.** The classic virtual-pipe trick keeps two clamped one-way pipes per face, and that added energy at each reversal. We switched to **one signed flux per face**, which reduces exactly to the standard linear long-wave scheme.
- **Arrivals came out early, and we didn't hide it.** A 1 cm arrival threshold caught tiny numerical precursors. 5 cm moved arrivals only 4–7 min; the real gap is unresolved coastline. We report the error instead of tuning it away.
- **The optimizer was too slow.** At full resolution, 15 earthquakes would take about 6½ minutes (about 26 s each). A coarser 256² library grid (8× less work) and parallel workers brought it **under 30 seconds**.
- **Real-world friction.** Our basemap provider started requiring an API key mid-build, so we switched providers. Browser frame throttling stalled the physics, so the worker now paces itself. Last-bit floating-point differences between browser builds move one optimizer figure by about 0.2%, which we document.

## Accomplishments that we're proud of

- **A PDE solver that passes its own physics tests**, live, in front of you.
- **A real-history check**: an observed-vs-simulated scatter against 2004 tide-gauge data, with the error stated plainly.
- **A simulator that answers a decision**: "where does the next sensor buy the most minutes?"
- **Every number is sourced.** Populations, the rupture, observations and buoy positions all trace to a citation in the repo.

## What we learned

Deep water is the easy part; coasts are hard. Warning time is a systems problem: detection, processing and evacuation together, not one sensor. And some places will always need education rather than hardware.

## What's next

- **More basins:** Pacific (2011 Tōhoku, validated against DART 21418) and the Atlantic.
- **Better physics:** the full Okada (1985) source and fine nested grids for coastal inundation.
- **Classrooms:** local-language interfaces and lesson packs for teachers.

## Built with AI assistance

We built LeadTime with AI-assisted development (Claude Code) for scaffolding, the solver and optimizer code, the UI and documentation drafts. We reviewed the code, ran every validation test and can explain each component. BUILDLOG.md records the build with timestamps.
