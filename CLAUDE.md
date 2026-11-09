# Mobile Network Navigator – notes for Claude

A single-file, offline reference of 3GPP mobile networks (2G … 5G SA, Wi-Fi via ePDG) for network engineers: an interactive map of elements and interfaces, protocol stacks, message flows, end-to-end procedures, the user's own IP plan ("network data") and an in-browser Wireshark trace analysis. User documentation: `README.md` and the in-app help (`index.html#help`).

## Non-negotiable rules (from the owner)

1. **Correct and precise information is the main requirement.** Check facts against the 3GPP / IETF / IANA source named in the item (TS number, clause, table). Do not guess values (ports, PPIDs, IE / AVP codes, cause codes, interface types). When a rule in the trace analysis is a heuristic, say so in the UI and the help (confidence *likely*, a visible note) – never present it as certain.
2. **IP addresses stay private – none may ever be part of the repository.** Only documentation addresses are allowed anywhere in the repo (code, docs, tests, generators, video assets): `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` (RFC 5737) and `2001:db8::/32` (RFC 3849). Also use generic names (Site-A, DC1, MME01 …), never the owner's node or site names. Never copy real data from a file the user shows you into a test or an example – rewrite it with documentation addresses.
   - Run `python3 dev/tools/check-ips.py` before every commit (`--all` scans the whole repo). Spec clause numbers like `§5.3.2.1` are skipped; a line with `ip-check: ok` is skipped (only for synthetic data that cannot fit the ranges, see `dev/tests/ndt5.js`).
   - Captures (`*.pcap*`), network-data files (`*.netdata.*`, `*-with-data.html`) and `private/` are git-ignored. Keep it that way.
   - The app itself: network data and traces are read locally, never uploaded, never put in links; traces are never stored or saved.
3. **The app is one offline file.** `index.html` holds all HTML, CSS and JS; no build step, no dependencies, no external resources. The Content-Security-Policy forbids network access (`connect-src 'none'`); keep it.

## Repository

| Path | What |
|---|---|
| `index.html` | The whole application (~780 KB). The only source – edit it directly. |
| `README.md` | User documentation and the changelog (must list the same versions as `RELEASES` in the app). |
| `netdata-template.csv` / `.json` | Network-data templates. The CSV must stay identical to `ND_TEMPLATE_CSV` in `index.html` (the app offers it for download). |
| `CLAUDE.md` | This file. |
| `dev/` | Tests, capture generators, tools and the video pipeline (below). Nothing in `dev/` is loaded by the app. |

### Map of `index.html`

Search for the banner comments (`/* ====` … `*/`) – the order in the file:

- **CSS** (`<style>`): app, network data, procedures, trace (`/* trace analysis */` … `/* end-to-end procedures */`), help at the end (`/* help */` … `/* end help */`, also the toolbar breakpoints).
- **DATA** – `GENS`, `GENINFO`, `ZONES`, `ELS` (elements), `LINKS` (interfaces; `LM[id]`, `EM[id]` are the lookups), `E2E` (protocol-stack scenarios).
- **HELPERS · STATE · SVG RENDER · STATE APPLICATION · PANEL · ACTIONS** – global `state`, the SVG viewbox `vb` (`setVB()` takes no argument, it reads `vb`), the hooks `compute()` → `apply()` → `renderPanel()`, `select(kind,id)`, `updateHash()` / `readHash()` (deep links).
- **MESSAGE FLOWS** – `MF[interface]` sequence diagrams, grouped by generation.
- **NETWORK DATA** – the user's IP plan: `ND` = `{network, instances[], interfaces{}, ports[]}`; `ndSet`, `ndTouch` (after an edit), `ndRefresh` (redraw; also re-resolves an open trace and re-reads it when the protocol ports changed), `ndClean` / `ndValidate` / `ndMerge`, CSV (`ndParseCSV`, `ndToCSV`), JSON (`ndToJSON`), encryption (AES-256-GCM, PBKDF2-SHA256 600 000), `ndModal(title, body, buttons, onOpen)`, the site filter `NDF`. **Protocol ports** (`ND_PROTO`, `ndPortRules`, `ndPortsDialog`): non-standard ports per protocol, saved with the data (`# ports:` lines in CSV, `ports` in JSON).
- **END-TO-END PROCEDURES** – `PROC` (stepped call flows), `PD_*`, `pd*` functions; mode flag `state.proc`.
- **TRACE ANALYSIS** – reference tables `TR_*` (link types, classes `TR_CLS`, SCTP PPIDs / ports, F-TEID types, PFCP interface types, Diameter applications, RAT types, UL side `TR_UPSIDE`, client side `TR_CLIENT` …, each verified against the table named next to it); reader (`trParser`, pcap / pcapng / gzip, streamed); link layer and IP (`trPkt`, `trIP`); classification (`trL4`: standard ports → the network's protocol ports (`R.pm`) → infrastructure → plain IP; `trSCTP`); decoders (`trGTPU`, `trGTPC1`, `trGTPC2`, `trPFCP`, `trRADIUS`, `trIKE`, Diameter over TCP / SCTP); then the UI part: `trFinish`, evidence (`trEvid`, `trSig`, `trResFlow`, `trResPlain`), elements (`trEnds`), direction (`trPorts`, TCP set-up roles `TR.hs`), panel (`trRender`), suggestions for network data (`trSuggest`). Mode flag `state.trMode` (wide panel: `body.trwide`).
- **HELP** – `hpSections()` holds the text; the tables of the trace chapter are generated from the `TR_*` / `ND_PROTO` tables, so they cannot drift. Overlay `#help`, `hpOpen(section)`, deep link `#help=<section>`.

### Things that bite

- **Dialog CSS:** `#modal .mbody label{display:flex;flex-direction:column}` – scope dialog rules under `#modal …`.
- **Toolbar width:** the toolbar must stay on one row at 1440 px with network data loaded and a site filter set (it wraps at 1366 – accepted). Breakpoints at 1800 / 1760 / 1700 / 1560 / 1500 / 1440 px hide labels and narrow the search box. `pd1`, `ndt8` and `tbw3` check it; any new toolbar item needs a re-check.
- **Precision rules in the trace analysis** (each documented in the help): one network-data address never overrides protocol evidence; standard ports keep their meaning over the network's protocol ports; plain IP gets a direction only once its interface is SGi / Gi / N6; UE addresses learned inside GTP-U count only when all their tunnels lead to the same data-network side; heuristics are *likely*, never *certain*.
- When a trace rule changes: update the help text (`hpSections`), the README section *Trace analysis*, add or extend a test with a generated capture, and mention it in the release notes.
- UI and docs use British spelling (recognised, behaviour, analyse), en dashes with spaces, `·` as a separator.

## Development

Requirements: Node 18+, Python 3 (standard library), Chromium for Playwright.

```bash
cd dev && npm install && npx playwright install chromium   # once
node dev/run-tests.js                 # all tests (≈ 2 min), one line each, logs in dev/out/<test>.log
node dev/run-tests.js tr3 pt1         # selected tests
node dev/run-tests.js --perf          # also tr4: reads a 1.1 GB capture (generated on first use)
python3 dev/tools/check-ips.py        # before every commit
node dev/tools/shot.js '#if=s1mme' 1440 out.png --panel   # screenshot into dev/out/ (also --light, '#help=tr-dir', '#proc=lte-attach&step=3')
node dev/tools/audit-mentions.js      # interface / element names mentioned in texts but not drawn – review by hand
```

`dev/env.js` (required first by every test) gives `E.APP` (file URL of `index.html`), `E.ROOT`, `E.CAP` (`dev/trcap`), `E.OUT` (`dev/out`), and marks a test failed when it prints a line containing `FAIL` or a page throws. Some tests also print values for a human look (layout sizes, counts); the runner only judges FAIL lines, page errors and the exit code.

Test captures are generated, never committed: `dev/gen/trgen.py` (a.pcapng – two interfaces, many protocols; b.pcap – big-endian ns, Linux cooked; c.pcap – raw IP, 2.5 MB; not-a-capture.pcap), `trgen2.py` (d.pcapng and port-ul / port-dl.pcap – direction per probe port), `trgen3.py` (S11-U), `trgen4.py` (non-standard ports), `trgen5.py` (SGi without signalling – direction from TCP set-up), `big.py` (performance). `dev/run-tests.js` runs them when files are missing; delete `dev/trcap/` after changing a generator. The helpers at the top of `trgen.py` (`eth`, `v4`, `udp`, `tcp`, `sctp`/`sdata`, `gtpu`, `gtpv2`/`fteid`/`ie2`, `pfcp`/`pie`, `dia`/`avp`, `rad`, `Pcap`, `PcapNG` …) build any packet – reuse them for new cases.

| Tests | Cover |
|---|---|
| `pd1`, `pd2` | End-to-end procedures: list, open, steps, keys, deep links, network-data lanes, toolbar at 1440; playback timing |
| `mft1`, `mft2` | Message flows on every interface; Copy as text, ⤢ Larger, deep links, chip keys |
| `peer`, `wifi1`–`wifi3` | E2E stacks (peer layers); Wi-Fi / ePDG map, panels, CUPS view, network data on SWu / S2b |
| `ndt1`–`ndt10`, `site2` | Network data: loading, CSV dialects and column names, element / interface names, exports and encryption, saved HTML, drop, 2000 eNodeBs, port lists, prefix notation, SBI fallbacks; site filter |
| `rel1` | Release history; README changelog = `RELEASES` |
| `hp1` | Help: open / close, TOC, search, deep links, keyboard, generated tables |
| `tr1`, `tr3`, `tr6`, `tr7` | Trace: dump of a.pcapng; formats, link layers, classification, manual decisions; direction per capture interface, several files, suggestions; S11-U |
| `pt1`, `pt2` | Protocol ports: classification and re-reading; CSV / JSON / encrypted / HTML round trips, data check, dialog |
| `dr1` | Direction on SGi / Gi / N6 from TCP connection set-up |
| `tbw3` | Toolbar widths (printed) |
| `tr4` | Performance (`--perf`; ≈ 400–700 k packets/s here) |

## Releasing

Versions are dates: `YYYY.MM.DD`, `.N` for further releases on the same day.

1. Run the tests and `check-ips.py`.
2. `python3 dev/tools/release.py <version> notes.md` (or `-i "item" -i "item"`) – bumps `<meta name="version">` and `const VERSION`, adds the notes to `RELEASES` (shown under the version button; `**bold**` and `` `code` `` are rendered) and to the README version line and changelog.
3. Update the README sections the change touches (and `README.md` › *Help* section IDs when a help section is added; the file size line when it grows noticeably).
4. `node dev/run-tests.js rel1 hp1`, commit (message names the version, e.g. `… (v2026.11.10)`), push to `main`.

Release notes are written for users: what changed and why it matters, precise, no internal names.

## Product video (`dev/video/`)

A ~2-minute narrated screen recording of the app, rendered frame by frame (English and French exist; outputs are not in git).

- `render.sh en|fr` runs the whole pipeline: `gen_demo.py` (demo capture `demo-probe.pcapng`) → `tts.py` (one WAV per sentence from `<lang>/narration.json`, Kokoro TTS; voices `af_heart` / `ff_siwis`) → `director.js` (drives the app with a virtual clock, 1920 × 1080 @ 30 fps via CDP screenshots, piped to ffmpeg libx264 `-preset veryfast -crf 16`; writes `<lang>/out/timeline.json`) → `audio.py` (narration track + synthesised music bed with ducking) → `mix.sh` (loudness −16 LUFS / −1.5 dBTP) → `srt.py` (subtitles) → mux into `<lang>/out/Mobile-Network-Navigator[-FR].mp4` with a subtitle track.
- `PREVIEW=15 ./render.sh en` – stills of every 15th frame only (≈ 30 s): check the timeline before a full render (≈ 10–15 min).
- `vclock.js` overrides `requestAnimationFrame`, timers, `Date` and `performance` so every frame is deterministic; `overlay.js` draws captions, callouts, cursor and highlights – **all its CSS is scoped under `#vo`** (an unscoped rule once stretched the app's generation bars). On-screen texts per language are in `director.js` (`C`) and `overlay.js` (`TX`); keep their facts (e.g. the number of procedures) in step with the app. Narration texts: `en/narration.json`, `fr/narration.json`; TTS pronunciation fixes in `tts.py` (`FIX`).
- Needs: ffmpeg, `pip install kokoro-onnx soundfile numpy scipy`, and the Kokoro model files in `dev/video/tts/` (`model_q8.onnx`, `voices.bin` – the int8 model and the voices file of the kokoro-onnx v1.0 model release; or set `KOKORO_MODEL` / `KOKORO_VOICES`). `example-lab.netdata.csv` (documentation addresses) is the network data shown in the video.

## Ideas not done yet

- Orient GTP-U tunnels without signalling from the TCP handshakes inside them (inner SYN travels uplink) – would also tell the RAN end from the core end on S1-U / N3. Inner packets are sampled today (`trUE`), so the handshake flags would need their own pass.
