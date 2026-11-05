# Mobile Network Navigator

**Version 2026.11.05.3** (date-based: `YYYY.MM.DD`, with `.N` appended for further releases on the same day; shown next to the page title and in the overview panel)

An interactive, single-file HTML reference of 3GPP mobile network architectures: **2G GSM/GPRS/EDGE, 3G UMTS, HSPA/HSPA+, 4G LTE/EPC, 5G NSA (EN-DC) and 5G SA**. It shows the network elements, the interfaces between them and the protocol stacks used on each interface.

It is meant for network engineers who need to get their bearings quickly while troubleshooting or discussing a topic with colleagues.

- **File:** `index.html` (about 245 KB) – the whole application
- **Online:** https://martindubovsky.github.io/mobile-network-navigator/ (once GitHub Pages is enabled for this repository)
- **Dependencies:** none – no external scripts, fonts or network access; works offline from disk
- **Your own IP plan:** can be loaded from a local CSV/JSON file and is shown in the element and interface details – it never becomes part of this repository (see [Network data](#network-data-your-own-ip-addresses))
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
| **E2E stacks** | Side-by-side protocol stacks from UE to core for 12 scenarios (see below). Stacks are bottom-aligned, so the lower layers of an interface face each other; upper layers pass through relaying nodes until they reach their peer. **Hover or tap a layer to highlight its peer(s).** Dual-connectivity and Direct Tunnel cases are drawn as several paths (one per radio leg / control path). |
| **Interface table** | All interfaces in one sortable table: name, endpoints, generation, plane, protocol stack and key specs. Click a row for details. |

### End-to-end stack scenarios

| ID | Scenario |
|---|---|
| `2gup` | 2G GPRS / EDGE user plane (Gb mode) |
| `2gcp` | GSM CS control plane (MS ↔ MSC) |
| `2gcs` | GSM CS speech path (A over TDM) |
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
| **Generation chips** (2G GSM, 3G UMTS, HSPA, 4G LTE/EPC, 5G NSA, 5G SA, Interworking) | Click to toggle, and click several to combine. Double-click to show one generation only. **All** clears the filter. Elements that only take part through another generation’s interface (e.g., the MSC Server under 4G via SGs/Sv) are shown half-dimmed. With no item selected, the panel shows an overview of the most recently chosen generation. |
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

**With network data loaded:** the element panel lists your instances of that element with their addresses per interface; the interface panel lists the addresses at both ends plus the subnet / VLAN of the interface (see below).

**With nothing selected:** a quick-orientation page with generation summaries, a table of well-known ports and SCTP PPIDs, and standardized QCI/5QI values.

## Network data (your own IP addresses)

The tool can show the IP addresses of **your** network next to the reference content: per element instance and interface, at both ends of an interface, and in search. Because the tool is used for many networks and the addresses are private, **the data is never part of the repository or of `index.html`**. You keep it in your own file and load it when you need it.

**Privacy model**

- Loading reads the file in the browser. Nothing is uploaded; the page has no network access at all (its Content-Security-Policy sets `connect-src 'none'` and allows no external resources). This also holds for the GitHub Pages copy.
- Data stays in the open tab only. It is kept after a reload only if you tick **Remember on this computer** (browser storage, unencrypted – leave it off on shared computers). For local files some browsers share this storage between all HTML files opened from disk.
- Deep links (`#el=…`, `#if=…`) never contain any network data.
- Leaving the page with changes that are not saved to a file asks for confirmation.

### Loading, editing, saving

Everything is in the **◆ Network data** menu at the right end of the toolbar:

| Action | Result |
|---|---|
| **Load file…** (or drop a file anywhere on the page) | Reads a CSV, a JSON export, an encrypted JSON export, or an HTML file saved with data. If data is already loaded you can **replace** it or **merge** into it (instances with the same element and name are combined). |
| **New empty dataset…** | Start from scratch and enter instances in the tool. |
| **Rename network…**, **Data check** | Change the dataset name; list all validation warnings. |
| **Export CSV** / **Export JSON** | `<network>.netdata.csv` / `<network>.netdata.json` |
| **Export JSON, encrypted** | `<network>.netdata.enc.json`, protected by a passphrase |
| **Save tool + data as one HTML file** | `mobile-network-navigator-<network>-with-data.html` – a copy of the tool with your data inside; opening it loads the data automatically. Handy for a laptop in the field or for sharing with a colleague. |
| **… encrypted** | The same file, but the data block is encrypted; the passphrase is asked when the file is opened (Cancel = use the tool without the data). |
| **Remember on this computer** | Keep the data in this browser’s storage until you untick it or remove the data. |
| **Download CSV template** | The example below. |

**Editing in the tool:** select an element → **+ Add … instance** or **Edit** on an instance card (name, site, note, and any number of addresses with interface, address, port, VLAN, note). Select an interface → **Add / Edit interface info** for its subnet, VLAN and a note. Invalid addresses or ports are pointed out before saving.

**Where the data appears**

- **Element panel:** “Network data” with one card per instance (the gNB box also lists CU-CP, CU-UP and DU instances).
- **Interface panel:** subnet / VLAN of the interface and the addresses of both ends. If an end has no data of its own, the tool falls back: SGW-C / SGW-U → SGW, PGW-C / PGW-U → PGW, gNB-CU-CP / CU-UP / DU → gNB (and the other way round), so a classic SGW entry also shows on the CUPS view’s S11 or S5-U. The SGW S1-U address also shows on S1-U towards the en-gNB.
- **Map:** a green `IP n` badge with the number of instances on each element; tooltips show the count.
- **Search:** finds instance names, notes and addresses. A complete IPv4 address matches exactly that address or a subnet that contains it (`198.51.100.130` finds the eNodeB range `198.51.100.128/26`, while `192.0.2.11` does not find `192.0.2.110`); partial input such as `192.0.2.` or `2001:db8:` is a text search. Matching rows are highlighted in the panel and moved to the top of long lists (lists show 40 instances at a time).

### CSV format

UTF-8, one row per address. The delimiter (`,` `;` or tab) is detected automatically, so files saved by Excel in any locale work; quoted fields and a BOM are fine.

```csv
# network: Example network
element,instance,site,interface,ip,port,vlan,note
mme,MME01,Site-A,s1mme,192.0.2.11,36412,101,SCTP multihoming - primary path
mme,MME01,Site-A,s1mme,192.0.2.12,36412,101,SCTP multihoming - secondary path
sgw,SGW01,Site-A,s5,198.51.100.7,,111,GTP-C 2123 / GTP-U 2152
amf,AMF01,Site-A,sbi,192.0.2.62,443,122,
enb,*,All sites,s1mme,198.51.100.128/26,36412,101,eNodeB signalling range
gnbcucp,*,All sites,n2,2001:db8:100::/48,38412,121,IPv6 example
,,,s1mme,192.0.2.0/28,,101,S1-MME core VLAN
```

| Column | Content |
|---|---|
| `element` | Element ID (see [Element IDs](#deep-links)) or its name as shown on the map (`MME`, `MSC Server`, `gNB-CU-CP`, …). A few common names are accepted too (`MSS`, `VLR`, `AuC`, `P-CSCF`, `OFCS`, `CU-CP`, …). **Empty** = the row describes the interface itself (subnet in `ip`, VLAN, note). |
| `instance` | Your node name, e.g. `MME01`. `*` stands for “all instances”, useful for RAN address ranges. Rows with the same element and instance form one instance. |
| `site` | Optional location. |
| `interface` | Interface ID (see [Interface IDs](#deep-links)) or name as shown on the map. Names are resolved against the interfaces of that element: `Gx` on a GGSN is the GGSN Gx, `A` on a CS-MGW is the A user plane, `S8` means S5/S8, `Gp` means Gn/Gp. The CUPS view interfaces (S11, S5-C/U, …) and the ng-eNB copies of N2/N3/Xn are stored under the classic ID. Also allowed: `oam` (O&M), `sbi` (the NF’s SBI address, shown on its SBI stub and on the SBI bus) and `other`. |
| `ip` | IPv4 or IPv6 address, a subnet in CIDR notation, or a host name (FQDN). |
| `port`, `vlan`, `note` | Optional. |

Header names are case-insensitive and some alternatives are recognised (`name`/`hostname`/`node` for instance, `address`/`ip address`/`subnet` for ip, `comment`/`description` for note). Lines starting with `#` are comments; `# network: <name>` names the dataset.

### JSON format

```json
{
  "format": "mobile-network-navigator/netdata", "version": 1, "network": "Example network",
  "instances": [
    { "element": "mme", "name": "MME01", "site": "Site-A", "note": "",
      "addresses": [ { "interface": "s1mme", "ip": "192.0.2.11", "port": "36412", "vlan": "101", "note": "" } ] }
  ],
  "interfaces": { "s1mme": { "subnet": "192.0.2.0/28", "vlan": "101", "note": "S1-MME core VLAN" } }
}
```

Complete examples with documentation addresses only (RFC 5737 / RFC 3849): [`netdata-template.csv`](netdata-template.csv) and [`netdata-template.json`](netdata-template.json).

### Data check

On loading and after each edit the data is checked. Rows with an unknown element are skipped; everything else is kept and reported: unknown interface, interface that does not belong to the element in this tool, invalid address / subnet / host name, invalid port, and the same address used by different instances. The count is shown next to the menu button (**⚠ n**, click for the list).

### Encryption

Encrypted exports use the browser’s Web Crypto API: **AES-256-GCM** with a key derived from your passphrase by **PBKDF2-SHA256 with 600 000 iterations**, a random 16-byte salt and a random 12-byte IV for every save. The file contains only the parameters and the ciphertext – not the network name or any address:

```json
{ "format": "mobile-network-navigator/netdata-encrypted", "version": 1, "kdf": "PBKDF2-SHA256",
  "iterations": 600000, "cipher": "AES-256-GCM", "salt": "…", "iv": "…", "data": "…" }
```

The passphrase (at least 10 characters) is never stored and cannot be recovered. Send it over a different channel than the file. Unlocking takes about a second because of the key derivation.

### Keeping real data out of git

The repository contains only the templates. `.gitignore` excludes the default export names – `*.netdata.*`, `*-with-data.html` – and a `private/` folder. Keep your real files outside the working copy or in `private/`, and check `git status` before committing.

---

## Deep links

The page address updates with the current selection, so a link can be sent to a colleague (with GitHub Pages the link is simply the Pages URL plus the fragment, e.g. `https://martindubovsky.github.io/mobile-network-navigator/#if=s1mme`).

| Fragment | Example | Opens |
|---|---|---|
| `#el=<element-id>` | `index.html#el=amf` | Element details |
| `#if=<interface-id>` | `index.html#if=s1mme` | Interface details |
| `#gen=<gen>[,<gen>…]` | `index.html#gen=nsa,4g` | Generation filter |

Generation IDs: `2g`, `3g`, `hspa`, `4g`, `nsa`, `sa`, `iw` (interworking).

The **Copy link to this item** button in the panel copies the current address to the clipboard. Some browsers block the clipboard for `file://` pages; in that case copy the address bar instead.

<details>
<summary><b>Element IDs</b></summary>

| ID | Element | ID | Element |
|---|---|---|---|
| `ue` | UE | `amf` | AMF |
| `bts` | BTS (2G) | `bsc` | BSC + PCU (2G) |
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
| 2G | `um` (Um), `abis`, `acp` (A, control plane), `aup` (A, user plane), `gb` |
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

- The content reflects GSM Phase 2+ and 3GPP Releases R97–R18 and GSMA roaming guidelines (IR.34, IR.88, NG.113). Spec numbers are listed per item so details can be checked against the release your network runs.
- **Contents:** 43 elements in the classic view (47 including the four CUPS functions); 71 point-to-point interfaces; the SBI bus with 14 service-based NF interfaces; 17 SBA reference points; and 13 interface entries for the CUPS view (6 new – Sxa, Sxb, S5-C, S5-U, S4-C, S4-U – plus 7 re-routed variants).
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
| `ND_CANON`, `ND_EXTRA`, `ND_ELALIAS` | Network data: which interface ID addresses are stored under, extra keys a link shows, and element fallbacks (CUPS functions, gNB parts) |
| `ND_TEMPLATE_CSV` | The template offered by **Download CSV template** (keep it in step with `netdata-template.csv`) |

**Element fields:** `id`, `n` (label), optional `cups` / `nocups` (shown only in the CUPS / classic EPC view), `sb` (subtitle), `gens`, `x`, `y`, `w`, `h` (diagram coordinates; canvas is 1900 × 1310), `full`, `sum`, `fn` (functions), `notes` (per-generation notes, keyed by generation ID), `kv` (identifier pairs), `specs`, `tips`, optional `kind` (`ext`, `container`, `bar`) and `pc` (colour override).

**Interface fields:** `id`, `n`, `a`, `b` (element IDs; `a === b` with `loop` for a self-loop), `gens`, `plane` (`cp`, `up`, `both`, `sbi`), `protos` (protocol-filter tags), `st` (stacks: `[{t:'title', l:['top layer', …, 'bottom layer']}]`), `full`, `sum`, `pr` (procedures), `kv`, `notes`, `specs`, `tips`.
CUPS-only interfaces carry `cups: true` (added in the *CUPS view* block after `LINKS`); interfaces attached to `nocups` elements are hidden automatically in the CUPS view.
Routing options: `ao` / `bo` (anchor offsets from element centre), `pts` (waypoints for orthogonal routing), `curve` (bend for reference points), `lp` (label position 0–1 along the path), `lo` (label offset), `logical` (dash-dot style).

Layer colours in the stacks are assigned automatically from the layer name (NAS, RRC, radio L2, application protocol, tunnelling, transport, IP, SS7/ATM, L2/L1).

To release a new version, change `VERSION` (and the `<meta name="version">` tag) in the HTML to the release date (`YYYY.MM.DD`, or `YYYY.MM.DD.N` for a further release on the same day) and add an entry below.

---

## Changelog

### 2026.11.05.3
- **Network data:** load your own IP plan (CSV, JSON or encrypted JSON, also by drag and drop), edit it in the tool, and see it in the element panel (instances, addresses per interface), the interface panel (both ends, subnet, VLAN), on the map (instance badges) and in search (exact IPv4 match and IPv4-in-subnet). Data is checked on load and on each edit.
- Save as CSV, JSON, encrypted JSON (AES-256-GCM, PBKDF2-SHA256), or as one HTML file with the tool and the data (optionally encrypted). Optional “Remember on this computer”. Warning before leaving with unsaved changes.
- Content-Security-Policy added: the page cannot load or send anything over the network.
- Templates `netdata-template.csv` / `netdata-template.json` (documentation addresses only); `.gitignore` excludes exports with real data.
- `/` no longer jumps to the search box while typing in another field.

### 2026.11.05.2
- **E2E stacks:** peer highlighting – hover or tap a layer to see its peer(s); hop-by-hop layers (transport, tunnels, L1/L2) match across the adjacent interface, relayed layers (NAS, RRC, PDCP, LLC, TRAU frames …) match their end peer.
- Scenarios can now consist of several paths: **5G NSA** user plane (NR leg + LTE leg over X2-U) and control plane (LTE RRC/NAS, SCG configuration via X2-C, SRB3) and **HSPA Direct Tunnel** (user plane RNC ↔ GGSN + SGSN control path) – every stack now faces its real peer.
- Fixed labels: GTP-U (QFI) on N3/N9 at both ends, 16 / 8 kbit/s TRAU sub-timeslots on Abis and Ater; BSC added to the GSM speech path; user IP labelled consistently.

### 2026.11.05
- Added **2G (GSM / GPRS / EDGE)**: new generation chip and GERAN zone with **BTS** and **BSC + PCU** (TRAU described), interfaces **Um**, **Abis**, **A** (control plane to the MSC Server), **A UP** (user plane to the CS-MGW, TDM or A over IP) and **Gb** (BSSGP/NS to the SGSN).
- The CS and PS core (MSC Server/VLR, CS-MGW, HLR/AuC, EIR, SGSN, GGSN, charging) is shared with 3G and now tagged for both generations.
- Integration with modern networks: CSFB and SRVCC to GERAN (SGs, Sv), LTE ↔ GERAN reselection / redirection / NACC, S4-SGSN with Gb (S3/S4), and 5G-SRVCC (R16, NG-RAN → UTRAN only, via N26 → MME_SRVCC → Sv); no direct 5GS ↔ GERAN mobility.
- New end-to-end stacks: 2G GPRS/EDGE user plane, GSM CS control plane, GSM speech path.
- Renamed to “Mobile Network Navigator”; shorter generation chip subtitles so the header still fits one row at 1920 px.

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
