# Handing captures over to the navigator

Another web application – Capture Tool, the console that starts and downloads captures on the probes – can open the
navigator and give it the files of a capture to analyse. The navigator never fetches anything: the opener downloads the
files and passes them as a **window message**. The navigator keeps `connect-src 'none'`, accepts files only from the
window that opened it, reads them like dropped files, never stores them, and sends back only a receipt.

Implemented in `index.html` (`hoInit`, `hoAccept`; capture interfaces per probe: `trIfAdd`). Test: `dev/tests/ho1.js`.

## Messages (version 1)

| Direction | Message |
|---|---|
| navigator → opener | `{type: 'mnn-ready', version: 1, app: '<navigator version>'}` – sent once when the page has started |
| opener → navigator | `{type: 'mnn-open-capture', version: 1, from: 'Capture Tool', label: 'Capture 100123', files: [{file, name, group}, …]}` |
| navigator → opener | `{type: 'mnn-received', version: 1, ok: true, files: <n>}` or `{…, ok: false, error: '<reason>'}` |

- `files`: 1 to 256 entries. `file` is a `Blob` or `File` (structured clone – no copy of the bytes is made by the
  browser for large blobs). `name` is the file name shown in the panel (default: the File's name). `group` (optional)
  names the probe: files of the same group – the rotated parts of one recording, **in order** – share their capture
  interfaces (same pcapng interface name and link type), so the direction per capture interface is per probe port, not per
  part. Capture interfaces are then named `<group> · <interface>`.
- `from` and `label` are shown in the panel: “Handed over by Capture Tool (https://host) – Capture 100123”.
- Each accepted message replaces the open trace (like *Open another…*). A message from any other window, of another
  type or with another version is ignored or refused with a reason; nothing is ever read from the opener.
- Formats the navigator reads: pcap, pcapng, gzip-compressed (`.gz`). ZIP is **not** read yet.

## What the opener must do

1. **Serve the navigator sandboxed**, from its own origin, with this response header on the navigator page only:

   ```
   Content-Security-Policy: sandbox allow-scripts allow-downloads; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
   ```

   `sandbox` without `allow-same-origin` gives the page an opaque origin: it cannot read the opener's cookies, storage or
   API even though it is served by the same host. `allow-downloads` keeps *Save results* and the network-data exports
   working. The page needs no other sandbox flag (no pop-ups, no dialogs, no forms). Do **not** send
   `Cross-Origin-Opener-Policy: same-origin` with the navigator page.
   In the sandbox the navigator keeps nothing in browser storage (network data must be loaded each time) and does not
   offer installation.
2. **Keep the window link.** The page that opens the navigator must send
   `Cross-Origin-Opener-Policy: same-origin-allow-popups` (with `same-origin` the browser cuts the link to the sandboxed
   window and the hand-over never happens – checked in Chromium), and must open it with `window.open(url, name)`
   **without** `noopener`, from the click handler (pop-up blockers).
3. **Hand over** after `mnn-ready` from that window (`event.source === theWindow`):
   `theWindow.postMessage(message, '*')` – the target origin of a sandboxed page is opaque, so it must be `'*'`; the
   message goes only to that window object. Then wait for `mnn-received`.

## Minimal opener

```js
let nav = null, pending = null;
addEventListener('message', e => {
  if (e.source !== nav || !e.data) return;
  if (e.data.type === 'mnn-ready' && pending) { nav.postMessage(pending, '*'); pending = null; }
  if (e.data.type === 'mnn-received' && !e.data.ok) console.warn('navigator refused:', e.data.error);
});
async function analyse(files /* [{url, name, group}] */, label) {
  nav = window.open('/navigator/', 'mnn');              // in the click handler, no "noopener"
  const list = [];
  for (const f of files) {
    const r = await fetch(f.url, { credentials: 'same-origin' });
    if (!r.ok) throw new Error(f.name + ': HTTP ' + r.status);
    list.push({ file: new File([await r.blob()], f.name), name: f.name, group: f.group });
  }
  pending = { type: 'mnn-open-capture', version: 1, from: 'Capture Tool', label, files: list };
}
```

If the navigator's `mnn-ready` arrives before the downloads finish, send the message as soon as they have finished.
