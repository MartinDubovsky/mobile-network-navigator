# Mobile Network Architecture Navigator

**Version 2026.11.04.3** (date-based: `YYYY.MM.DD`, with `.N` appended for further releases on the same day; shown next to the page title and in the overview panel)

An interactive, single-file HTML reference of 3GPP mobile network architectures: **3G UMTS, HSPA/HSPA+, 4G LTE/EPC, 5G NSA (EN-DC) and 5G SA**. It shows the network elements, the interfaces between them and the protocol stacks used on each interface.

It is meant for network engineers who need to get their bearings quickly while troubleshooting or discussing a topic with colleagues.

- **File:** `index.html` (about 170 KB) – the whole application
- **Online:** https://martindubovsky.github.io/mobile-network-navigator/ (once GitHub Pages is enabled for this repository)
- **Dependencies:** none – no external scripts, fonts or network access; works offline from disk
- **Browsers:** current Chrome, Edge, Firefox or Safari (uses CSS `color-mix()`: Chrome/Edge 111+, Firefox 113+, Safari 16.2+)

---

## Getting started

1. Open `index.html` in a browser – double-clicking it from disk is enough, no web server needed – or use the GitHub Pages URL above.
2. Click any box (network element) or line/label (interface) to open its details in the right-hand panel.
3. Use the generation chips at the top to highlight what belongs to 3G, HSPA, 4G, 5G NSA, 5G SA or interworking.

---

## Views

The top bar is two rows at 1920 px width: title + version, generation chips and view tabs on the first row; search, plane toggles, 5GC view, EPC view, protocol filter and theme on the second. On narrower screens it wraps.

| View | What it shows |
|---|---|
| **Architecture** | Zoomable diagram of all elements and interfaces, grouped into UE, RAN (UTRAN, E-UTRAN + EN-DC, NG-RAN), core (UMTS CS/PS, EPC, 5GC) and external networks. |
| **E2E stacks** | Side-by-side protocol stacks from UE to core for 9 scenarios (see below). Layers are colour-coded by type, so peer layers are easy to match. |
| **Interface table** | All interfaces in one sortable table: name, endpoints, generation, plane, protocol stack and key specs. Click a row for details. |

### End-to-end stack scenarios

| ID | Scenario |
|---|---|
| `3gup` | 3G PS user plane (R99 / R4) |
| `3gcp` | 3G PS control plane (UE ↔ SGSN) |
| `hspaup` | HSPA user plane with Direct Tunnel (R7+) |
| `lteup` | LTE user plane |
| `ltecp` | LTE control plane |
| `nsaup` | 5G NSA user plane – Option 3x (SCG split bearer) |
| `nsacp` | 5G NSA control plane (EN-DC) |
| `saup` | 5G SA user plane (split gNB) |
| `sacp` | 5G SA control plane |

---

## Interaction reference

### Filters and highlighting

| Control | Behaviour |
|---|---|
| **Generation chips** (3G UMTS, HSPA, 4G LTE/EPC, 5G NSA, 5G SA, Interworking) | Click to toggle, and click several to combine. Double-click to show one generation only. **All** clears the filter. Elements that only take part through another generation’s interface (e.g., the MSC Server under 4G via SGs/Sv) are shown half-dimmed. With no item selected, the panel shows an overview of the most recently chosen generation. |
| **Search** (toolbar, left) | Free text over names, descriptions, protocols, procedures, ports and specs, e.g. `S1-MME`, `Diameter`, `2152`, `PFCP`, `29.274`. Several words are combined with AND. The match count is shown next to the box. |
| **Planes** | Show/hide control-plane, user-plane and SBI interfaces. Interfaces that carry both planes stay visible while either plane is on. |
| **5GC view** | *Service-based*: NFs attached to the SBI bus (Namf, Nsmf …). *Reference points*: point-to-point N5, N7, N8, N10, N11, N12, N13, N15, N22, N23, N28, N33, N34, N35, N36, N37, N40. |
| **EPC view** | *Classic*: SGW and PGW as single nodes. *CUPS*: R14 control/user-plane split – SGW-C, SGW-U, PGW-C, PGW-U with **Sxa** and **Sxb** (PFCP), and the attached interfaces split accordingly (S11 → SGW-C, S1-U/S12/S4-U → SGW-U, S5-C/S5-U, Gx and Gy/Gz → PGW-C, SGi → PGW-U). |
| **Protocol** (dropdown) | Highlight all interfaces using GTP-U, GTPv1-C, GTPv2-C, PFCP, Diameter, MAP/SS7, SCTP, HTTP/2 SBI or ATM transport. |
| **Theme** | Dark/light; the choice is remembered in the browser. |

### Mouse, touch and keyboard

| Action | Effect |
|---|---|
| Click element / interface / label | Open details; related items stay bright, the rest dims |
| Click empty canvas | Clear selection |
| Mouse wheel / pinch | Zoom around the pointer |
| Drag | Pan |
| `+` / `−` / `⤢` buttons | Zoom in / out / fit |
| `/` | Focus search |
| `Esc` | Clear search (if focused) or selection |
| `Tab`, then `Enter` / `Space` | Keyboard navigation and selection of diagram items |

### Line styles

| Style | Meaning |
|---|---|
| Dashed | Control plane |
| Solid | User plane |
| Thick with hollow dashes | Control + user plane on the same interface |
| Dotted | Service-based interface (HTTP/2) |
| Dash-dot | Logical reference point (N1 NAS) |

Line colour = generation. Small coloured bars on top of each box show which generations use that element.

---

## What the details panel contains

**For an element:** full name, generations, summary, key functions, generation-specific notes (e.g. what changes for the eNB in EN-DC), identifiers (GUTI, GUAMI, ECGI, NCGI, …), all connected interfaces (clickable), troubleshooting quick references and key 3GPP specifications.

**For an interface:** endpoints, plane, summary, protocol stack(s) (including IP and ATM transport variants where relevant), generation-specific notes, ports / SCTP PPIDs / Diameter application IDs, key procedures and messages, troubleshooting quick references (cause and result codes), and key specifications.

**With nothing selected:** a quick-orientation page with generation summaries, a table of well-known ports and SCTP PPIDs, and standardized QCI/5QI values.

---

## Deep links

The page address updates with the current selection, so a link can be sent to a colleague (with GitHub Pages the link is simply the Pages URL plus the fragment, e.g. `https://martindubovsky.github.io/mobile-network-navigator/#if=s1mme`).

| Fragment | Example | Opens |
|---|---|---|
| `#el=<element-id>` | `index.html#el=amf` | Element details |
| `#if=<interface-id>` | `index.html#if=s1mme` | Interface details |
| `#gen=<gen>[,<gen>…]` | `index.html#gen=nsa,4g` | Generation filter |

Generation IDs: `3g`, `hspa`, `4g`, `nsa`, `sa`, `iw` (interworking).

The **Copy link to this item** button in the panel copies the current address to the clipboard. Some browsers block the clipboard for `file://` pages; in that case copy the address bar instead.

<details>
<summary><b>Element IDs</b></summary>

| ID | Element | ID | Element |
|---|---|---|---|
| `ue` | UE | `amf` | AMF |
| `nodeb` | Node B | `smf` | SMF |
| `rnc` | RNC | `upf` | UPF |
| `mscs` | MSC Server / VLR | `ausf` | AUSF |
| `mgw` | CS-MGW | `udm` | UDM |
| `hlr` | HLR / AuC | `udr` | UDR |
| `eir` | EIR | `pcf` | PCF |
| `sgsn` | SGSN | `nrf` | NRF |
| `ggsn` | GGSN | `nssf` | NSSF |
| `enb` | eNodeB | `nef` | NEF |
| `engnb` | en-gNB | `chf` | CHF |
| `gnb` | gNB (container) | `nwdaf` | NWDAF |
| `gnbdu` | gNB-DU | `scp` | SCP |
| `gnbcucp` | gNB-CU-CP | `sepp` | SEPP |
| `gnbcuup` | gNB-CU-UP | `af` | AF |
| `mme` | MME | `ims` | IMS core |
| `hss` | HSS | `pdn` | Packet Data Networks |
| `sgw` | SGW | `peercs` | Peer CS core / PSTN |
| `pgw` | PGW | `partner` | Roaming partner PLMN |
| `pcrf` | PCRF | `ocs` | OCS / OFCS |
| `ngenb` | ng-eNB (LTE on 5GC) | | |

CUPS view only: `sgwc` (SGW-C), `sgwu` (SGW-U), `pgwc` (PGW-C), `pgwu` (PGW-U). Classic view only: `sgw`, `pgw`.

</details>

<details>
<summary><b>Interface IDs</b></summary>

| Area | IDs |
|---|---|
| Radio | `uu3g` (Uu), `lteuu` (LTE-Uu), `nruunsa` (NR-Uu EN-DC), `nruusa` (NR-Uu SA) |
| 3G RAN | `iub`, `iur`, `iucscp` (Iu-CS), `iucsup` (Iu-CS UP), `iups` (Iu-PS), `dt` (Direct Tunnel) |
| 3G core | `mc`, `cd` (C/D), `f`, `gf`, `gr`, `gs` (SGSN–MSC/VLR), `gc` (GGSN–HLR), `gn` (Gn/Gp), `gi`, `gy3g` (Gy/Ga), `gx3g` (Gx GGSN–PCRF, R7+), `nc`, `nb` |
| 4G / NSA | `s1mme`, `s1u`, `s1unsa` (S1-U en-gNB), `x2lte`, `x2endc`, `s11`, `s5` (S5/S8), `s6a`, `s10`, `s13`, `gx` (Gx PGW–PCRF), `rx`, `gy4g` (Gy/Gz), `sgi`, `sy` (PCRF–OCS), `s9` (V-/H-PCRF) |
| IMS | `cxsh` (Cx / Sh to HSS), `rorf` (Ro / Rf to OCS/OFCS), `n5ims` (N5 / Rx to PCF) |
| Interworking | `s3`, `s4`, `s12`, `sgs`, `sv`, `n26`, `s6d` (S4-SGSN–HSS), `nhss` (HSS–UDM, R16) |
| NG-RAN | `f1c`, `f1u`, `e1`, `xn` (gNB–gNB) |
| ng-eNB (LTE on 5GC) | `lteuu5gc` (LTE-Uu), `n2ngenb` (N2), `n3ngenb` (N3), `xnngenb` (Xn gNB–ng-eNB) |
| 5GC point-to-point | `n1`, `n2`, `n3`, `n4`, `n6`, `n9`, `n14`, `n32` |
| 5GC SBI | `sbi` (bus), `namf`, `nsmf`, `nausf`, `nudm`, `nudr`, `npcf`, `nnrf`, `nnssf`, `nnef`, `nchf`, `nnwdaf`, `naf`, `nscp`, `nsepp` |
| 5GC reference points | `n5`, `n7`, `n8`, `n10`, `n11`, `n12`, `n13`, `n15`, `n22`, `n23`, `n28`, `n33`, `n34`, `n35`, `n36`, `n37`, `n40` |
| EPC CUPS view | `sxa`, `sxb`, `s5c` (S5-C), `s5u` (S5-U), `s4c` (S4-C), `s4u` (S4-U), and CUPS variants of existing interfaces: `s11c`, `s1uc`, `s1unsac`, `s12c`, `gxc`, `gy4gc`, `sgic` |

Selecting a reference point switches the 5GC view to *Reference points* automatically, and selecting an SBI stub switches it back to *Service-based*. Likewise, a link to a CUPS item (e.g. `#if=sxa`) switches the EPC view to *CUPS*, and a link to `sgw`/`pgw` or their classic interfaces switches it back to *Classic*.

</details>

---

## Scope and simplifications

- The content reflects 3GPP Releases R99–R18 and GSMA roaming guidelines (IR.34, IR.88, NG.113). Spec numbers are listed per item so details can be checked against the release your network runs.
- **Contents:** 41 elements in the classic view (45 including the four CUPS functions); 66 point-to-point interfaces; the SBI bus with 14 service-based NF interfaces; 17 SBA reference points; and 13 interface entries for the CUPS view (6 new – Sxa, Sxb, S5-C, S5-U, S4-C, S4-U – plus 7 re-routed variants).
- **CUPS:** Sxc (TDF-C ↔ TDF-U) is described in the Sxb details but not drawn. GGSN CUPS is not shown.
- **Mentioned in text but not drawn** (checked with a scan of all texts against the map, release 2026.11.04.3):
  - *Nodes that would need extra layout space:* SMSF (N20/N21), LMF, NSSAAF, BSF, 5G-EIR (N17), N3IWF/TNGF, ePDG + 3GPP AAA (S2b, SWm, SWx; S2a), SMSC, gsmSCF/CAMEL (CAP, Ge), TDF (Sd, Sxc), SCEF (T6a, S6t), CBC, BM-SC.
  - *Logical or transit only:* Gm (UE–P-CSCF SIP, carried over the user plane), DRA/DEA (Diameter routing), N16 / N24 / N27 (inter-PLMN NF pairs, carried over N32 via the SEPPs).
  - *Inside a drawn box:* P-/I-/S-CSCF, TAS, MGCF, SCC-AS/ATCF, ISC (IMS core); CDF/CGF, Bx (OCS/OFCS); PSA / I-UPF roles (UPF); V-/H-SMF, V-/H-PCRF roles.
  - *Historical:* Go, PDF, CRF, TPF (R6 policy architecture, mentioned in the GGSN Gx details).
  - *Layout-limited:* S16 / Gn between SGSNs.
- **Combined nodes:** real deployments often merge nodes (GGSN/PGW, SMF+PGW-C, UPF+PGW-U, PCF+PCRF, HLR/HSS/UDM). The diagram draws the logical functions separately; the combinations are described in the element and N26 details.
- **Self-loops** (Iur, X2, Xn, S10, N14, N9) stand for the interface towards a neighbouring node of the same type.
- **NSA** is drawn for the Option 3 family (EN-DC with EPC). LTE connected to the 5GC is shown as an **ng-eNB** (LTE-Uu, N2, N3, Xn to the gNB); Options 5, 7/7a/7x (NGEN-DC) and 4/4a (NE-DC) are explained in its details rather than drawn as separate topologies.
- **Troubleshooting quick refs** list common cause/result codes as a starting point. Always confirm against the spec version and vendor documentation for your network.

---

## Editing or extending the content

All content is plain JavaScript data near the top of the `<script>` block in the HTML file – no build step. Edit, save and reload.

| Constant | Purpose |
|---|---|
| `GENS`, `GENINFO` | Generation names, colours and overview texts |
| `ZONES` | Background zones of the diagram (position, title) |
| `ELS` | Network elements |
| `LINKS` | Interfaces, SBI stubs (`stub(...)`) and reference points (`rp(...)`) |
| `E2E` | End-to-end stack scenarios |

**Element fields:** `id`, `n` (label), optional `cups` / `nocups` (shown only in the CUPS / classic EPC view), `sb` (subtitle), `gens`, `x`, `y`, `w`, `h` (diagram coordinates; canvas is 1900 × 1310), `full`, `sum`, `fn` (functions), `notes` (per-generation notes, keyed by generation ID), `kv` (identifier pairs), `specs`, `tips`, optional `kind` (`ext`, `container`, `bar`) and `pc` (colour override).

**Interface fields:** `id`, `n`, `a`, `b` (element IDs; `a === b` with `loop` for a self-loop), `gens`, `plane` (`cp`, `up`, `both`, `sbi`), `protos` (protocol-filter tags), `st` (stacks: `[{t:'title', l:['top layer', …, 'bottom layer']}]`), `full`, `sum`, `pr` (procedures), `kv`, `notes`, `specs`, `tips`.
CUPS-only interfaces carry `cups: true` (added in the *CUPS view* block after `LINKS`); interfaces attached to `nocups` elements are hidden automatically in the CUPS view.
Routing options: `ao` / `bo` (anchor offsets from element centre), `pts` (waypoints for orthogonal routing), `curve` (bend for reference points), `lp` (label position 0–1 along the path), `lo` (label offset), `logical` (dash-dot style).

Layer colours in the stacks are assigned automatically from the layer name (NAS, RRC, radio L2, application protocol, tunnelling, transport, IP, SS7/ATM, L2/L1).

To release a new version, change `VERSION` (and the `<meta name="version">` tag) in the HTML to the release date (`YYYY.MM.DD`, or `YYYY.MM.DD.N` for a further release on the same day) and add an entry below.

---

## Changelog

### 2026.11.04.3
- Drew interfaces that were only described in text: **Cx / Sh** (IMS–HSS), **Ro / Rf** (IMS–OCS/OFCS), **Sy** (PCRF–OCS), **S9** (PCRF–roaming partner), **S6d** (S4-SGSN–HSS), **Gs** (SGSN–MSC/VLR), **Gc** (GGSN–HLR), **Nhss** (HSS–UDM interworking, R16), and reference points **N23** (PCF–NWDAF) and **N34** (NSSF–NWDAF).
- Diameter in 5G networks made visible: N5 to the IMS is now “N5 / Rx” (PCF supports Rx per TS 23.503 Annex C), N6/SGi/Gi carry the DN-AAA (RADIUS/Diameter) option; *5G SA* + *Diameter* filter highlights Cx/Sh, Ro/Rf, N5/Rx and N6.
- EPC zone label moved to the bottom-right corner.

### 2026.11.04.2
- Added **ng-eNB** (E-UTRA connected to 5GC) in the NG-RAN area with LTE-Uu, N2 (NG-C) to AMF, N3 (NG-U) to UPF and Xn to the gNB; notes on Options 4/4a, 5 and 7/7a/7x.
- 5G SA chip now reads “5GC · Opt. 2 (4/5/7)”.

### 2026.11.04
- First release: architecture map (3G, HSPA, 4G, 5G NSA, 5G SA, interworking), element/interface details with protocol stacks, end-to-end stack view, interface table, deep links, dark/light theme.
- Added Gx between GGSN (PCEF) and PCRF (R7+).
- Added EPC **CUPS view**: SGW-C/U, PGW-C/U, Sxa, Sxb, S5-C/U, S4-C/U.
- Compact top bar (two rows at 1920 px), protocol filter as a dropdown, date-based version label.
