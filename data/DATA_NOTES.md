# Data notes: read before using `data/*.json`

Collected and sourced on 2026-11-24. Every value has a `source` or `url` field. `_raw/` holds the original downloads, and `_scripts/` holds the scripts that rebuilt `trenches.json`, `buoys.json` and `cities.json` from them. All coordinates were checked to fall inside the domain (lat 41°S–41°N, lon 22.5°E–112.5°E).

## obs2004.json: 15 observed arrival times (for the M7 validation scatter)
- **Sources:** Merrifield 2005 (GRL), Nagarajan 2006 (EPS), Tsuji 2006 (EPS) and Bilham 2005. Colombo, Salalah and the Maldives agree between two sources to the minute.
- **Times** are in `arrivalMinutes`, counted from the earthquake origin at 00:58:53 UTC.
  - Fastest: Port Blair 45 min, Cocos 138 min, Chennai 156 min, Colombo 173 min.
  - Slowest: Lamu 537 min, Zanzibar 585 min.
- **Soft checks only** (show them in the chart but leave them out of the error statistic):
  - **Port Blair:** unpublished draft; the authors say the reading may be land subsidence.
  - **Kuraburi:** the gauge clock may be off by about 12 min, and the first motion was a drop in water level.
- **No usable data** for Somalia, Mauritius, Réunion or Phuket. Western Australia is outside the domain.
- **Coordinates** come from the current UHSLC and PSMSL station lists; the papers don't give them.

## physics.json
- **Strasser 2010 coefficients:** these come second-hand, via Salah et al. (arXiv), because the original paper is paywalled:
  - log10 L = −2.477 + 0.585·Mw
  - log10 W = −0.882 + 0.351·Mw

  For Mw 9.1 they predict a rupture **about 700 km long**, roughly half the real 2004 rupture. Use them **only for the synthetic optimizer scenarios**. Never use them for the 2004 preset.
- **2004 preset:** use `rupture2004.segments`, the 5 Grilli et al. 2007 segments. A 3-segment alternative is in `segmentsChlieh2007`.
  - The segment endpoints were calculated from each segment's published centre, strike and length, and are marked as derived.
  - Epicenter: 3.295°N, 95.982°E. Mw 9.1. Strike runs 315° → 342° → 5° going north. Rupture length 1200–1500 km, depending on the source.
- **Death toll:** the sources disagree. USGS says **283,100+** and Wikipedia says **227,898**. In the UI and pitch say **"more than 227,000 people"** and cite the source.
- **Other sourced facts:**
  - The Indian Ocean had no warning system in 2004 (quoted from Merrifield 2005).
  - India's INCOIS warning centre opened on 15 Oct 2007.
  - The Indian Ocean regional warning service went live on 12 Oct 2011.
  - On Simeulue only 7 of 78,128 people died, thanks to the *smong* oral tradition (McAdoo 2006).
  - DART buoys sense changes under 1 mm and work at depths up to 6000 m.
  - Deep-ocean tsunami speed is over 500 mph.
  - Warning centres send the first warning from seismic data and confirm or cancel it with sea-level data.

## cities.json: 65 coastal cities, about 90.8 M people
- **Populations mix years (2011–2025) and area definitions.** `popKind` says what area each number covers (city proper, urban, district and so on). Say "approximate population" in the UI.
- **Weak figures:** Gqeberha, Dar es Salaam (a CIA estimate, probably the urban area), Mombasa, Salalah (district figure), Hafun and West Island (Cocos) (no source year). Galle, Phuket, Puducherry, Trincomalee and Hambantota have no footnote in the Wikipedia infobox.
- **`hit2004`** is true only where a source names the city (25 cities). Kollam, Kochi and Colombo are **false**: sources name only their districts, or nothing. Trincomalee's sources contradict each other, but it is kept as true.
- **`facesIndianOceanDirectly: false`** for Jakarta, Yangon, Bandar Abbas and Malacca. Leave these out of the headline totals, or say they are partly sheltered.

## trenches.json: 3 trenches, 68 points (Bird 2003, PB2002)
- **Sunda:** 33 points, from 112.5°E (Java) to 1.3°N 96.2°E.
- **Andaman–Nicobar:** 24 points, up to **14.4°N**. PB2002 has no subduction further north, so the gap was not filled.
- **Makran:** 11 points. PB2002 classes it as OCB (oceanic convergent boundary), not SUB.
- Each point has `oceanAzimuthDeg`, the direction from the overriding plate toward the trench. Use it to orient the uplift lobe of each synthetic earthquake.

## buoys.json: 13 stations
- **By operator:** India 9 (INCOIS/NIOT), Thailand 2, Australia (BoM) 1, Indonesia 1 (historical, last data 2008).
- **"Active" means only that the station is listed by NDBC.** On 2026-11-24 only 23218, 23220, 23223, 23401 and 56001 were actually reporting (see `reportingRecently`).
- **23220 / 23219:** their IDs and positions conflict between INCOIS and NDBC. The note in the file explains it.
- No positions were found for Indonesian GITEWS or InaBuoy stations, so the "existing network" layer **under-represents Indonesia**. Say so in the UI.
