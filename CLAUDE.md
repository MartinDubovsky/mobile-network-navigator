# Mobile Network Navigator – notes for Claude

A single-file, offline reference of 3GPP mobile networks (2G … 5G SA, Wi-Fi via ePDG) for network engineers: an interactive map of elements and interfaces, protocol stacks, message flows, end-to-end procedures, the user's own IP plan ("network data") and an in-browser Wireshark trace analysis. User documentation: `README.md` and the in-app help (`index.html#help`).

## Non-negotiable rules (from the owner)

1. **Correct and precise information is the main requirement.** Check facts against the 3GPP / IETF / IANA source named in the item (TS number, clause, table). Do not guess values (ports, PPIDs, IE / AVP codes, cause codes, interface types). When a rule in the trace analysis is a heuristic, say so in the UI and the help (confidence *likely*, a visible note) – never present it as certain.
2. **IP addresses stay private – none may ever be part of the repository.** Only documentation addresses are allowed anywhere in the repo (code, docs, tests, generators, video assets): `192.0.2.0/24`, `198.51.100.0/24`, `203.0.113.0/24` (RFC 5737) and `2001:db8::/32` (RFC 3849). Also use generic names (Site-A, DC1, MME01 …), never the owner's node or site names. Never copy real data from a file the user shows you into a test or an example – rewrite it with documentation addresses.
   - Run `python3 dev/tools/check-ips.py` before every commit (`--all` scans the whole repo). Spec clause numbers like `§5.3.2.1` are skipped; a line with `ip-check: ok` is skipped (only for synthetic data that cannot fit the ranges, see `dev/tests/ndt5.js`).
   - Captures (`*.pcap*`), network-data files (`*.netdata.*`, `*-with-data.html`) and `private/` are git-ignored. Keep it that way.
   - The app itself: network data and traces are read locally, never uploaded, never put in links; traces are never stored or saved – only the results (counts, element addresses and names, decisions; never packets, UE / plain-IP addresses or subscriber identities) when the user asks (*Save results…*, `trResultsData`). Saved results are git-ignored (`*.trace-results.*`).
3. **The app is one offline file.** `index.html` holds all HTML, CSS and JS; no build step, no dependencies, no external resources. The Content-Security-Policy forbids network access (`connect-src 'none'`); keep it.
   - **Installable app (optional companions):** `manifest.webmanifest`, `sw.js` and `icons/` make the GitHub Pages copy installable and offline. `index.html` links the manifest and registers `sw.js` only when served over HTTPS / localhost (`pwaInit`, after `PRISTINE_DOC` is taken, never with embedded network data); from disk it stays the single file. The CSP allows only same-origin `manifest-src` / `worker-src` / `img-src 'self'` for this. `sw.js` caches and answers only the files in its `FILES` list – keep that list in step with the manifest icons (`pwa1` checks); new releases are offered by the page (`#pwaupd`), never forced.

## Repository

| Path | What |
|---|---|
| `index.html` | The whole application (~820 KB). The only source – edit it directly. |
| `README.md` | User documentation and the changelog (must list the same versions as `RELEASES` in the app). |
| `netdata-template.csv` / `.json` | Network-data templates. The CSV must stay identical to `ND_TEMPLATE_CSV` in `index.html` (the app offers it for download). |
| `manifest.webmanifest`, `sw.js`, `icons/` | Installable app (web app manifest, service worker, icons – `icon.svg` / `icon-maskable.svg` are the sources of the PNGs). Used only by the HTTPS copy. |
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
- **TRACE ANALYSIS** – reference tables `TR_*` (link types, classes `TR_CLS`, SCTP PPIDs / ports, F-TEID types, PFCP interface types, Diameter applications, RAT types, UL side `TR_UPSIDE`, client side `TR_CLIENT` …, each verified against the table named next to it); reader (`trParser`, pcap / pcapng / gzip, streamed); link layer and IP (`trPkt`, `trIP`); classification (`trL4`: standard ports → the network's protocol ports (`R.pm`) → infrastructure → plain IP; `trSCTP`); decoders (`trGTPU`, `trGTPC1`, `trGTPC2`, `trPFCP`, `trRADIUS`, `trIKE`, Diameter over TCP / SCTP); then the UI part: `trFinish`, evidence (`trEvid`, `trSig`, `trResFlow`, `trResPlain`), elements (`trEnds`), direction (`trPorts`, TCP set-up roles `TR.hs`), panel (`trRender`; collapsible colour-coded sections `trSec` / `TR_SEC`, open state `trSecOpen`), suggestions for network data (`trSuggest`), Wireshark display filters per row (`trWsFor` / `trWsB`, `data-ws` keys `if:` `port:` `grp:` `el:` `oth:`), several groups at once in Check and decide (`trDecSel`, `trDecBarHTML`, `trDecApply`), saving and re-applying results (`trResultsData`, `trResultsCSV`, `trSaveDialog`, `trResultsLoad` – also reached from `ndLoadText`). Mode flag `state.trMode` (wide panel: `body.trwide`).
- **HELP** – `hpSections()` holds the text; the tables of the trace chapter are generated from the `TR_*` / `ND_PROTO` tables, so they cannot drift. Overlay `#help`, `hpOpen(section)`, deep link `#help=<section>`.

### Things that bite

- **Dialog CSS:** `#modal .mbody label{display:flex;flex-direction:column}` – scope dialog rules under `#modal …`.
- **Map labels:** `ux1` fails when a label covers another label or a box, or a line crosses a zone title, in any of the four views (classic / CUPS × service-based / ref. points) – after moving or adding an element or interface, adjust `lp` (position along the line) or `lo` (offset) of the labels.
- **History:** `updateHash()` adds a browser-history entry when the selection (element, interface, procedure) changes and replaces it otherwise (steps, generation filter); `readHash()` runs with `hashNav` set so that Back / Forward do not add entries. The match count `#qcount` floats under the search box – it must not take toolbar width.
- **Toolbar width:** the toolbar must stay on one row at 1440 px with network data loaded and a site filter set (it wraps at 1366 – accepted). Breakpoints at 1800 / 1760 / 1700 / 1560 / 1500 / 1440 px hide labels and narrow the search box. `pd1`, `ndt8` and `tbw3` check it; any new toolbar item needs a re-check.
- **Precision rules in the trace analysis** (each documented in the help): one network-data address never overrides protocol evidence; standard ports keep their meaning over the network's protocol ports; plain IP gets a direction only once its interface is SGi / Gi / N6; GTP-U ends from the inner TCP set-up (`trHsUl`, `x.hs`, counted on every G-PDU) come only after network data and signalling and before fan-out, and are never *certain* (`trWeakSrc`); UE addresses learned inside GTP-U count only when all their tunnels lead to the same data-network side; heuristics are *likely*, never *certain*.
- **Wireshark filters** must match what the row counts: dissector names only at standard ports, port numbers otherwise; always bracket sub-expressions (`trWsAnd` / `trWsOr`); plain IP is approximate and must say so. `tr10` runs every filter of every test capture through tshark (accepted, same packet count); it skips without tshark (`apt-get install tshark`). Wireshark field names to remember: 802.1ad outer tags are `ieee8021ad.id`, not `vlan.id`; reassembled IP fragments show the protocol only on the last fragment.
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

Test captures are generated, never committed: `dev/gen/trgen.py` (a.pcapng – two interfaces, many protocols; b.pcap – big-endian ns, Linux cooked; c.pcap – raw IP, 2.5 MB; not-a-capture.pcap), `trgen2.py` (d.pcapng and port-ul / port-dl.pcap – direction per probe port), `trgen3.py` (S11-U), `trgen4.py` (non-standard ports), `trgen5.py` (SGi without signalling – direction from TCP set-up), `trgen6.py` (GTP-U without signalling – tunnels oriented by the TCP set-up inside them), `trgen7.py` (i-sctp.pcap – SBc-AP, Iuh RUA / HNBAP, Diameter over DTLS on SCTP, OpenFlow on TCP), `big.py` (performance). `dev/run-tests.js` runs them when files are missing; delete `dev/trcap/` after changing a generator. The helpers at the top of `trgen.py` (`eth`, `v4`, `udp`, `tcp`, `sctp`/`sdata`, `gtpu`, `gtpv2`/`fteid`/`ie2`, `pfcp`/`pie`, `dia`/`avp`, `rad`, `Pcap`, `PcapNG` …) build any packet – reuse them for new cases.

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
| `tr8` | GTP-U without signalling: ends and direction from the inner TCP set-up (minimum, mixed, fragments, IPv6), N6 following it, suggestions, network data precedence |
| `tr9` | Trace panel: collapsible sections, Wireshark filters (per row, pairs, custom ports, plain IP), Save results JSON / CSV / encrypted, re-applying decisions, results with network data |
| `tr10` | Wireshark filters checked by tshark on all test captures (skipped without tshark) |
| `tr11` | Check and decide: ticking several groups (range, all, undecided / likely), one interface for all, automatic again |
| `ux1` | SCTP ports (SBc-AP 29168, Iuh 29169, 5868); map labels free of overlaps in the four views; search results and Enter; toolbar and header height; chips as buttons; Back / Forward; remembered view toggles and theme; dialog focus; panel hide / show; sticky lane names; release-note italics |
| `pwa1` | Installable app: manifest and icons, Chromium installability, service worker cache, offline start, update offer, nothing from `file://` |
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

(none listed)
