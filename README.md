# Delhi City Logistics Agentic Twin

This repo is a converted version of the original product into a Delhi city-wide logistics simulation.

## What changed

- Replaced national corridors with Delhi NCR operating nodes: Kapashera, Narela, Ghazipur, Okhla, Connaught Place, Noida Sector 62 and Gurugram Cyber City.
- Preserved the same buttons and flows: **Disrupt**, **Correct**, **Normal**, **Hub Addition**, and **City Addition**.
- Added Delhi-specific disruptions and AI corrections: Outer Ring / Signature Bridge, Dhaula Kuan / Airport Road, DND / Akshardham, Mathura Road / Pragati Maidan and Delhi–Gurugram border.
- Added an urban consolidation hub scenario at **ITO / Pragati Maidan**.
- Added a city expansion scenario with new Delhi micro-zones and a proposed **Dwarka West Micro-Fulfilment Hub**.

## How to run

Because the app fetches local JSON scenario files, serve it through a local static server rather than opening `index.html` directly.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

- `index.html` — UI shell and controls.
- `script.js` — Delhi map, animation, routes, disruptions, narration and dashboard logic.
- `scenario_before.json` — normal operations and city addition baseline.
- `scenario_after.json` — corrected state, hub addition and city addition proposal.
- `style.json` — MapLibre map style.
- `warehouse_iso.png`, `truck_top.png`, `warehouse_texture.png` — visual assets.
