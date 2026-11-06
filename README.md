# Mobile Network Navigator

**Version 2026.11.06** (date-based: `YYYY.MM.DD`, with `.N` appended for further releases on the same day; shown next to the page title – click it for the release history – and in the overview panel)

An interactive, single-file HTML reference of 3GPP mobile network architectures: **2G GSM/GPRS/EDGE, 3G UMTS, HSPA/HSPA+, 4G LTE/EPC, 5G NSA (EN-DC) and 5G SA**, plus **Wi-Fi access via ePDG** (untrusted non-3GPP access, VoWiFi). It shows the network elements, the interfaces between them, the protocol stacks used on each interface, message-flow diagrams of the main procedures on every interface, and **end-to-end procedures** (attach, PDU session, handovers …) that can be stepped through on the map.

It is meant for network engineers who need to get their bearings quickly while troubleshooting or discussing a topic with colleagues.

- **File:** `index.html` (about 500 KB) – the whole application
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

The top bar is two rows at 1920 px width: title + version, generation chips and view tabs on the first row; search, plane toggles, 5GC view, EPC view, protocol filter, **▶ Procedures**, network data and theme on the second. On narrower screens it wraps.

| View | What it shows |
|---|---|
| **Architecture** | Zoomable diagram of all elements and interfaces, grouped into UE, RAN (UTRAN, E-UTRAN + EN-DC, NG-RAN), core (UMTS CS/PS, EPC with the ePDG / 3GPP AAA for Wi-Fi access, 5GC) and external networks. |
| **E2E stacks** | Side-by-side protocol stacks from UE to core for 14 scenarios (see below). Stacks are bottom-aligned, so the lower layers of an interface face each other; upper layers pass through relaying nodes until they reach their peer. **Hover or tap a layer to highlight its peer(s).** Dual-connectivity and Direct Tunnel cases are drawn as several paths (one per radio leg / control path). |
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
| `wifiup` | VoWiFi / Wi-Fi user plane (untrusted, via ePDG) |
| `wificp` | Wi-Fi access authentication (EAP-AKA via ePDG) |

---

## Interaction reference

### Filters and highlighting

| Control | Behaviour |
|---|---|
| **Generation chips** (2G GSM, 3G UMTS, HSPA, 4G LTE/EPC, 5G NSA, 5G SA, Wi-Fi, Interworking) | Click to toggle, and click several to combine. Double-click to show one generation only. **All** clears the filter. Elements that only take part through another generation’s interface (e.g., the MSC Server under 4G via SGs/Sv) are shown half-dimmed. With no item selected, the panel shows an overview of the most recently chosen generation. |
| **Search** (toolbar, left) | Free text over names, descriptions, protocols, procedures, ports and specs, e.g. `S1-MME`, `Diameter`, `2152`, `PFCP`, `29.274`. Several words are combined with AND. The match count is shown next to the box. |
| **Planes** | Show/hide control-plane, user-plane and SBI interfaces. Interfaces that carry both planes stay visible while either plane is on. |
| **5GC view** | *Service-based*: NFs attached to the SBI bus (Namf, Nsmf …). *Reference points*: point-to-point N5, N7, N8, N10, N11, N12, N13, N15, N22, N23, N28, N33, N34, N35, N36, N37, N40. |
| **EPC view** | *Classic*: SGW and PGW as single nodes. *CUPS*: R14 control/user-plane split – SGW-C, SGW-U, PGW-C, PGW-U with **Sxa** and **Sxb** (PFCP), and the attached interfaces split accordingly (S11 → SGW-C, S1-U/S12/S4-U → SGW-U, S5-C/S5-U, Gx and Gy/Gz → PGW-C, SGi → PGW-U). |
| **Protocol** (dropdown) | Highlight all interfaces using GTP-U, GTPv1-C, GTPv2-C, PFCP, Diameter, MAP/SS7, SCTP, HTTP/2 SBI or ATM transport. |
| **▶ Procedures** | Opens the [end-to-end procedures](#end-to-end-procedures) in the panel. While one is open, the map shows only the nodes and interfaces it uses. |
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
| `Esc` | Clear search (if focused) or selection; leave the procedure view |
| `←` / `→` | Previous / next message of the open end-to-end procedure |
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

**For an interface:** endpoints, plane, summary, protocol stack(s) (including IP and ATM transport variants where relevant), generation-specific notes, ports / SCTP PPIDs / Diameter application IDs, key procedures and messages, **message flows** (sequence diagrams, see below), troubleshooting quick references (cause and result codes), and key specifications.

**With network data loaded:** the element panel lists your instances of that element with their addresses per interface; the interface panel lists the addresses at both ends plus the subnet / VLAN of the interface (see below).

**With nothing selected:** a quick-orientation page with generation summaries, a table of well-known ports and SCTP PPIDs, and standardized QCI/5QI values.

## Message flows

Every interface panel has a **Message flows** section with sequence diagrams of the main procedures on that interface – 448 procedures with about 1 600 messages over all 124 interface entries.

- **Pick a procedure** with the chips above the diagram (or the ← / → keys when a chip has focus).
- **⤢ Larger** opens the diagram in a wide window; **Copy as text** copies it as plain text (`eNodeB -> MME: S1 SETUP REQUEST – …`) for a ticket or a chat.
- **Search** also covers procedure titles and message names: searching `pfcp session report` highlights N4 (and Sxa / Sxb in the CUPS view), and opening it shows the first procedure containing that message, with the message highlighted.
- **Deep link** to a procedure: `#if=<interface-id>&mf=<procedure>`, e.g. `index.html#if=s1mme&mf=s1-handover` (the address bar updates when you pick a procedure).

**Reading a diagram**

| Notation | Meaning |
|---|---|
| Columns | The nodes involved. Usually the two ends of the interface; some procedures show three or four, e.g. source eNB – MME – target eNB for an S1 handover, or UE – BSS – MSC on Um to show which layer-3 messages pass transparently through the BSS. |
| Solid arrow | A message, with its name in bold and the key IEs / parameters below it. |
| Dashed arrow, `opt` | Optional or conditional message (e.g. authentication that is not always run, a failure answer, an acknowledgement only sent when requested). |
| Small tag before a name | Protocol layer where it helps: `RR`, `MM`, `CC`, `GMM`, `SM`, `RRC`, `MAC`, `5GMM`, `5GSM`. |
| Grey box | A step on another interface or inside a node (e.g. “MME → SGW: Modify Bearer Request (S11)”), shown so the sequence makes sense. |
| Dashed line with text | A separator: “or”, “later”, “release” … |

**Scope:** the flows show the messages and the IEs that matter when reading a trace; they are not complete message definitions. SBI procedures are shared between the SBI stubs and the matching reference points (e.g. `Nsmf_PDUSession_CreateSMContext` appears on Nsmf and on N11); CUPS and ng-eNB interface entries reuse the flows of the classic interface with their own end names. HTTP paths use the API versions of Release 17. Message names follow the specs (S1AP / NGAP in capitals, GTP and PFCP in title case, Diameter commands by their abbreviations, MAP by operation name as decoders show them).

---

## End-to-end procedures

**▶ Procedures** in the toolbar (or the link on the overview page) opens 17 multi-node call flows across the RAN and the core – the step-by-step view of what happens between UE, RAN, core and policy nodes, with the interface every message travels on.

| Generation | Procedures (ID) |
|---|---|
| 4G LTE / EPC | LTE initial attach (`lte-attach`), service request (`lte-sr`), network-triggered service request / paging (`lte-paging`), S1 release (`lte-s1rel`), X2 handover (`lte-x2ho`), VoLTE dedicated bearer (`lte-volte-bearer`), UE-initiated detach (`lte-detach`), CS fallback MO call to UTRAN (`csfb-mo`) |
| 5G NSA | EN-DC secondary node addition with E-RAB modification (`endc-add`) |
| 5G SA | Initial registration (`nr-reg`), PDU session establishment (`nr-pdu`), service request (`nr-sr`), AN release (`nr-anrel`), Xn handover (`nr-xnho`) |
| 3G | GPRS attach and PDP context activation (`umts-attach-pdp`) |
| Wi-Fi | Wi-Fi calling attach via ePDG (`wifi-attach`), handover LTE → Wi-Fi (`lte-wifi-ho`) |

- **On the map:** opening a procedure widens the panel, zooms the map to the area involved and dims everything else. Hovering a procedure in the list previews its nodes.
- **Step through it:** click a message, use **◀ Prev / Next ▶** or the `←` / `→` keys, or **▷ Play**. The current message is highlighted on the map – its interface(s) and both ends, a label with the message name and a dot that travels along the path in the message’s direction (NAS between UE and MME runs over LTE-Uu and S1-MME, an SBI call over the two NF stubs and the bus).
- **Interfaces:** every message shows the interface it uses (`S11`, `LTE-Uu › S1-MME`, `N11` …). The 5GC and EPC toggles keep working: service-based calls are drawn on the SBI bus or on the reference point, and in the CUPS view S11 / S5 / Gx / S1-U map to their SGW-C / PGW-C / SGW-U copies, with Sxa / Sxb shown as involved.
- **IP addresses:** with [network data](#network-data-your-own-ip-addresses) loaded, a row of selectors above the lanes picks the instance of each node (e.g. MME01 or MME02, source and target eNB), and every single-hop message shows `source address → destination address · port` taken from those instances. Ranges (instance `*`) are used for RAN nodes; an SBI call uses the NF’s reference-point or SBI address. A `—` means your data has no address for that end; multi-hop messages (NAS, RRC through the DU) show none. The destination port is the protocol’s well-known port when it is in the list (e.g. 2123 out of `2123;2152`).
- **Element and interface panels** list the procedures they take part in (**End-to-end procedures**), and selecting something on the map while a procedure is open offers **← Back** to it at the same step.
- **⤢ Larger** opens the diagram in a wide window; **Copy as text** copies it with interfaces and, if loaded, addresses (`15. MME -> SGW: [GTPv2-C] Create Session Request {S11} … [192.0.2.21 -> 198.51.100.5 port 2123]`).
- **Deep link:** `#proc=<id>`, optionally `&step=<n>` (message number), e.g. `index.html#proc=nr-pdu&step=12`; `#procedures` opens the list.

The flows follow the clauses named under each title (TS 23.401, 23.502, 23.060, 23.272, 23.402, 37.340 and the protocol specs) for the common case – non-roaming, no relocation of SGW / AMF / UPF – and show the IEs that matter when reading a trace. Optional or conditional steps are dashed and marked `opt`.

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
| **Export only the filtered sites** | Shown while a site filter is active: the exports and HTML copies then contain only the instances you see (interface info is always included). The file name gets the site name, and the data still counts as unsaved. |
| **Remember on this computer** | Keep the data (and the site filter) in this browser’s storage until you untick it or remove the data. |
| **Download CSV template** | The example below. |

**Editing in the tool:** select an element → **+ Add … instance** or **Edit** on an instance card (name, site, note, and any number of addresses with interface, address, port, VLAN, note). Select an interface → **Add / Edit interface info** for its subnet, VLAN and a note. Ports can be entered as a list or range (`443;8080`, `2123, 2152`, `30000-30100`). Invalid addresses or ports are pointed out before saving. While a site filter is active, a new instance gets that site by default, and the site field suggests the existing site names.

**Site filter**

As soon as the data contains more than one site, a **Site: all ▾** button appears next to the Network data menu. It filters what is shown – element and interface panels, map badges, tooltips and search – without changing the data:

- Tick or untick sites, or type part of a name (several parts comma-separated, e.g. `bb1, bb2`) and press **Enter** / **Only listed** to keep exactly the listed sites. **All** and **None** reset the selection.
- Instances with site **`*`** belong to every site: they are shown whichever sites are selected (only **None** hides them) and are not listed as a site of their own – use it for e.g. RAN address ranges or a central NRF.
- **Also show instances without a site** (on by default) keeps entries with an empty site visible as well.
- Panels show the active filter next to the dataset name (click it to change it, ✕ to show all sites) and say how many instances of the element are hidden.

**Where the data appears**

- **Element panel:** “Network data” with one card per instance (the gNB box also lists CU-CP, CU-UP and DU instances).
- **Interface panel:** subnet / VLAN of the interface and the addresses of both ends. If an end has no data of its own, the tool falls back: SGW-C / SGW-U → SGW, PGW-C / PGW-U → PGW, gNB-CU-CP / CU-UP / DU → gNB (and the other way round), so a classic SGW entry also shows on the CUPS view’s S11 or S5-U. The SGW S1-U address also shows on S1-U towards the en-gNB. In the 5GC, addresses given for a reference point (e.g. AMF `n11`) also appear on that NF’s SBI stub and on the SBI bus, and a reference point without its own entry shows the NF’s `sbi` address – so the data is visible in both the service-based and the reference-point view. Interface names in the address tables are links; a reference point opens the Ref. points view.
- **Map:** a green `IP n` badge with the number of instances on each element; tooltips show the count.
- **Search:** finds instance names, sites, notes, addresses and ports. A complete IPv4 address matches exactly that address (also when it is written with a prefix length, e.g. `10.2.7.2/26`) or a range that contains it (`198.51.100.130` finds the eNodeB range `198.51.100.128/26`, while `192.0.2.11` does not find `192.0.2.110`); partial input such as `192.0.2.` or `2001:db8:` is a text search. Matching rows are highlighted in the panel and moved to the top of long lists (lists show 40 instances at a time).

### CSV format

UTF-8, one row per address. The delimiter (`,` `;` or tab) is detected automatically, so files saved by Excel in any locale work; quoted fields and a BOM are fine.

```csv
# network: Example network
element,instance,site,interface,ip,port,vlan,note
mme,MME01,Site-A,s1mme,192.0.2.11,36412,101,SCTP multihoming - primary path
mme,MME01,Site-A,s1mme,192.0.2.12,36412,101,SCTP multihoming - secondary path
sgw,SGW01,Site-A,s5,198.51.100.7,2123;2152,111,GTP-C and GTP-U
amf,AMF01,Site-A,sbi,192.0.2.62,443;8080,122,TLS and plain HTTP/2
enb,*,*,s1mme,198.51.100.128/26,36412,101,eNodeB signalling range
gnbcucp,*,*,n2,2001:db8:100::/48,38412,121,IPv6 example
,,,s1mme,192.0.2.0/28,,101,S1-MME core VLAN
```

| Column | Content |
|---|---|
| `element` | Element ID (see [Element IDs](#deep-links)) or its name as shown on the map (`MME`, `MSC Server`, `gNB-CU-CP`, …). A few common names are accepted too (`MSS`, `VLR`, `AuC`, `P-CSCF`, `OFCS`, `CU-CP`, …). **Empty** = the row describes the interface itself (subnet in `ip`, VLAN, note). |
| `instance` | Your node name, e.g. `MME01`. `*` stands for “all instances”, useful for RAN address ranges. Rows with the same element and instance form one instance. |
| `site` | Optional location, used by the site filter. `*` = the entry belongs to every site (e.g. RAN ranges); it is shown as “all sites”. |
| `interface` | Interface ID (see [Interface IDs](#deep-links)) or name as shown on the map. Names are resolved against the interfaces of that element: `Gx` on a GGSN is the GGSN Gx, `A` on a CS-MGW is the A user plane, `S8` means S5/S8, `Gp` means Gn/Gp. The CUPS view interfaces (S11, S5-C/U, …) and the ng-eNB copies of N2/N3/Xn are stored under the classic ID. Also allowed: `oam` (O&M), `sbi` (the NF’s SBI address, shown on its SBI stub and on the SBI bus) and `other`. |
| `ip` | IPv4 or IPv6 address, a subnet / range in CIDR notation, or a host name (FQDN). An address with its prefix length (`10.2.7.2/26` – host bits set) is treated as that one address; with zero host bits (`10.2.7.0/26`) it is a range, e.g. for all eNodeBs. |
| `port` | Optional: one port, a list (`2123;2152` – separated by `;`, `,`, `/` or spaces) or a range (`30000-30100`). If the separator is also the CSV delimiter, quote the field (`"2123;2152"`) or use another separator. Saved as `2123;2152`, shown as `2123, 2152`. |
| `vlan`, `note` | Optional. |

Header names are case-insensitive and some alternatives are recognised (`ports` for port, `name`/`hostname`/`node` for instance, `address`/`ip address`/`subnet` for ip, `comment`/`description` for note). Lines starting with `#` are comments; `# network: <name>` names the dataset.

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

On loading and after each edit the data is checked. Rows with an unknown element are skipped; everything else is kept and reported: unknown interface, interface that does not belong to the element in this tool, invalid address / subnet / host name, invalid port, port list or range, and the same address used by different instances. The count is shown next to the menu button (**⚠ n**, click for the list).

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
| `#if=<interface-id>&mf=<procedure>` | `index.html#if=s1mme&mf=s1-handover` | Interface details with that message flow open (procedure title in lower case, words joined by `-`) |
| `#proc=<procedure-id>[&step=<n>]` | `index.html#proc=lte-attach&step=15` | End-to-end procedure, optionally at message *n* (IDs in [End-to-end procedures](#end-to-end-procedures)) |
| `#procedures` | `index.html#procedures` | List of end-to-end procedures |
| `#gen=<gen>[,<gen>…]` | `index.html#gen=nsa,4g` | Generation filter |
| `#releases` | `index.html#releases` | Release history |

Generation IDs: `2g`, `3g`, `hspa`, `4g`, `nsa`, `sa`, `wifi` (Wi-Fi access via ePDG), `iw` (interworking).

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
| `ngenb` | ng-eNB (LTE on 5GC) | `epdg` | ePDG (Wi-Fi access) |
| `aaa` | 3GPP AAA server | | |

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
| Wi-Fi access (ePDG) | `swu` (UE–ePDG), `swm` (ePDG–AAA), `swx` (AAA–HSS), `s2b` (ePDG–PGW), `s6b` (PGW–AAA); CUPS view: `s2bc` (S2b-C), `s2bu` (S2b-U), `s6bc` (S6b to PGW-C) |
| 5GC point-to-point | `n1`, `n2`, `n3`, `n4`, `n6`, `n9`, `n14`, `n32` |
| 5GC SBI | `sbi` (bus), `namf`, `nsmf`, `nausf`, `nudm`, `nudr`, `npcf`, `nnrf`, `nnssf`, `nnef`, `nchf`, `nnwdaf`, `naf`, `nscp`, `nsepp` |
| 5GC reference points | `n5`, `n7`, `n8`, `n10`, `n11`, `n12`, `n13`, `n15`, `n22`, `n23`, `n28`, `n33`, `n34`, `n35`, `n36`, `n37`, `n40` |
| EPC CUPS view | `sxa`, `sxb`, `s5c` (S5-C), `s5u` (S5-U), `s4c` (S4-C), `s4u` (S4-U), and CUPS variants of existing interfaces: `s11c`, `s1uc`, `s1unsac`, `s12c`, `gxc`, `gy4gc`, `sgic` |

Selecting a reference point switches the 5GC view to *Reference points* automatically, and selecting an SBI stub switches it back to *Service-based*. Likewise, a link to a CUPS item (e.g. `#if=sxa`) switches the EPC view to *CUPS*, and a link to `sgw`/`pgw` or their classic interfaces switches it back to *Classic*.

</details>

---

## Scope and simplifications

- The content reflects GSM Phase 2+ and 3GPP Releases R97–R18 and GSMA roaming guidelines (IR.34, IR.88, NG.113). Spec numbers are listed per item so details can be checked against the release your network runs.
- **Contents:** 45 elements in the classic view (49 including the four CUPS functions); 76 point-to-point interfaces; the SBI bus with 14 service-based NF interfaces; 17 SBA reference points; and 16 interface entries for the CUPS view (6 new – Sxa, Sxb, S5-C, S5-U, S4-C, S4-U – plus 10 re-routed variants, including S2b-C / S2b-U and S6b towards the PGW-C).
- **CUPS:** Sxc (TDF-C ↔ TDF-U) is described in the Sxb details but not drawn. GGSN CUPS is not shown.
- **Mentioned in text but not drawn** (checked with a scan of all texts against the map, release 2026.11.04.3):
  - *Nodes that would need extra layout space:* SMSF (N20/N21), LMF, NSSAAF, BSF, 5G-EIR (N17), N3IWF/TNGF, trusted Wi-Fi access (TWAN: S2a, STa), SMSC, gsmSCF/CAMEL (CAP, Ge), TDF (Sd, Sxc), SCEF (T6a, S6t), CBC, BM-SC.
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
| `RELEASES` | Release history shown in the app (same entries as the changelog below) |
| `MF`, `SB` | Message flows per interface ID; `SB` holds the SBI procedures shared by stubs and reference points. Helpers build repeated patterns (`mfGTPU`, `mfDia`, `mfGx`, `mfS11` …) |
| `PROC` | End-to-end procedures (see the format below) |
| `ND_CANON`, `ND_EXTRA`, `ND_ELALIAS` | Network data: which interface ID addresses are stored under, extra keys a link shows, and element fallbacks (CUPS functions, gNB parts) |
| `ND_TEMPLATE_CSV` | The template offered by **Download CSV template** (keep it in step with `netdata-template.csv`) |

**Element fields:** `id`, `n` (label), optional `cups` / `nocups` (shown only in the CUPS / classic EPC view), `sb` (subtitle), `gens`, `x`, `y`, `w`, `h` (diagram coordinates; canvas is 1900 × 1400), `full`, `sum`, `fn` (functions), `notes` (per-generation notes, keyed by generation ID), `kv` (identifier pairs), `specs`, `tips`, optional `kind` (`ext`, `container`, `bar`) and `pc` (colour override).

**Interface fields:** `id`, `n`, `a`, `b` (element IDs; `a === b` with `loop` for a self-loop), `gens`, `plane` (`cp`, `up`, `both`, `sbi`), `protos` (protocol-filter tags), `st` (stacks: `[{t:'title', l:['top layer', …, 'bottom layer']}]`), `full`, `sum`, `pr` (procedures), `kv`, `notes`, `specs`, `tips`.
CUPS-only interfaces carry `cups: true` (added in the *CUPS view* block after `LINKS`); interfaces attached to `nocups` elements are hidden automatically in the CUPS view.
Routing options: `ao` / `bo` (anchor offsets from element centre), `pts` (waypoints for orthogonal routing), `curve` (bend for reference points), `lp` (label position 0–1 along the path), `lo` (label offset), `logical` (dash-dot style).

**Message flow format:** `MF[interfaceId] = [{t:'title', s:'spec', d:'optional note', p:['lane', …] (optional, default = the two ends), m:[rows]}]`. A row is `[from, to, 'TAG|MESSAGE', 'key IEs', '?']` (lane numbers from 0; the tag and `'?'` for optional are optional), `['*', 'note']` for a grey box across all lanes, `['*1', 'note']` for a box on lane 1, or `['=', 'text']` for a separator.

**End-to-end procedure format:** `PROC = [{id, g:['4g', …], t:'title', s:'specs', d:'description', p:[{e:'element-id', l:'optional lane label'}, …], m:[rows]}]`. Rows are as in message flows plus a sixth field, the interface: `[from, to, 'TAG|MESSAGE', 'key IEs', '?' or '', 'iface']`, where `iface` is a link ID (`'s11'`), several joined with `+` for a multi-hop path (`'lteuu+s1mme'` for NAS, `'nruusa+f1c'` for NR RRC) in UE-to-core order, or `'sbi'` for a service-based call between two 5GC NFs. Use the classic EPC IDs; the CUPS view maps them itself. Two lanes may use the same element (source / target eNB).

Layer colours in the stacks are assigned automatically from the layer name (NAS, RRC, radio L2, application protocol, tunnelling, transport, IP, SS7/ATM, L2/L1).

To release a new version, change `VERSION` (and the `<meta name="version">` tag) in the HTML to the release date (`YYYY.MM.DD`, or `YYYY.MM.DD.N` for a further release on the same day), add the entry at the top of `RELEASES` in the HTML (shown in the app when the version number is clicked; `**bold**` and `` `code` `` are rendered) and add the same entry to the changelog below.

---

## Changelog

The same list is shown in the app: click the version number next to the title (or open `index.html#releases`). After an update, a small dot on the version number marks a release you have not looked at yet.

### 2026.11.06
- **End-to-end procedures** (▶ Procedures in the toolbar): 17 multi-node call flows – LTE attach, service request, paging, S1 release, X2 handover, VoLTE dedicated bearer, detach, CS fallback, EN-DC secondary node addition, 5G registration, PDU session, service request, AN release, Xn handover, 3G attach + PDP context, Wi-Fi calling attach and LTE → Wi-Fi handover – with the interface of every message.
- **Map integration:** the map zooms to the procedure and dims everything else; stepping through the messages (click, ← / →, Play) highlights each hop and animates it along its path. Works in the CUPS and reference-point views.
- **IP addresses in the flows:** with network data loaded, pick the instance of each node above its lane and every message shows source → destination address and port.
- Element and interface panels list the procedures they appear in; deep links `#proc=<id>&step=<n>`; copy as text and larger view.

### 2026.11.05.9
- **Wi-Fi access via ePDG** (untrusted non-3GPP, VoWiFi): new **ePDG** and **3GPP AAA** elements with **SWu**, **SWm**, **SWx**, **S2b** and **S6b** (S2b-C / S2b-U and S6b to the PGW-C in the CUPS view), a **Wi-Fi** generation chip, message flows (IKEv2 + EAP-AKA tunnel set-up, S2b PDN connection, LTE ↔ Wi-Fi handover, Diameter procedures) and two end-to-end stacks.
- Map: the 5G rows moved down to make room below the EPC; the canvas is now 1900 × 1400.

### 2026.11.05.8
- **Network data:** site `*` means the instance belongs to every site – it is shown whichever sites are selected and is not listed as a separate site in the site filter.

### 2026.11.05.7
- **Release history** in the app: click the version number next to the title. A small dot on it marks a version you have not seen yet.

### 2026.11.05.6
- **Network data:** reference points (N11, N8, N12 …) in the address tables are now links (they open the Ref. points view). An NF’s reference-point addresses also show on its SBI stub and the SBI bus, and a reference point without its own entry shows the NF’s `sbi` address.
- Addresses written with a prefix length (`10.2.7.2/26`) are treated as one address, not as the whole subnet: search no longer matches other addresses of that subnet, and the duplicate check compares the address part. CIDR blocks with zero host bits stay ranges.

### 2026.11.05.5
- **Network data:** ports can be a list or a range (`8080;443`, `2123, 2152`, `30000-30100`) – one row per address instead of one per port. JSON also accepts an array of ports.
- **Site filter** for network data: pick sites (or type part of a name) to limit panels, map badges, tooltips and search; optional export of only the filtered sites; the filter is kept with “Remember on this computer”.
- Template: port lists and a second site; RAN ranges without a site.

### 2026.11.05.4
- **Message flows:** sequence diagrams for the main procedures on every interface (412 procedures, about 1 500 messages): radio (Um, Uu, LTE-Uu, NR-Uu), RAN (Abis, Iub, Iur, F1, E1, X2, Xn), RAN–core (A, Gb, Iu, S1, N2), GTP / PFCP (Gn, S11, S5/S8, S3, S4, S10, N26, Sxa/Sxb, N4, all GTP-U interfaces), Diameter (S6a/d, S13, Gx, Rx, Gy/Gz, Sy, S9, Cx/Sh, Ro/Rf), MAP / BSSAP+ / SGsAP / Sv, H.248, BICC / SIP-I, N1 NAS, SBI services and N32.
- Larger view, copy as text, keyboard navigation, search over procedure and message names, and deep links to a procedure (`&mf=`).

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
