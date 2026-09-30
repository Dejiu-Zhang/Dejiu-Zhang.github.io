/*! SlideLink 1.0 : page + pen sync between a presenter tablet and a projector page.
 *  No server of your own. Messages travel through public MQTT-over-WebSocket relays,
 *  encrypted end to end with a room code that only your own devices know.
 *
 *  SlideLink.start({
 *    role:  "presenter" | "screen",
 *    deck:  "same-id-in-both-files",
 *    host:  { count, index(), show(i), slideEl(i), surface, onmove }   // see README / skill
 *  })
 */
(function (global) {
  "use strict";
  if (global.SlideLink) return;

  var RELAYS = [
    { name: "emqx", url: "wss://broker.emqx.io:8084/mqtt" },
    { name: "hivemq", url: "wss://broker.hivemq.com:8884/mqtt" },
    { name: "shiftr", url: "wss://public.cloud.shiftr.io", user: "public", pass: "public" }
  ];
  var HB_MS = 2500, PEER_TTL = 7000, FLUSH_MS = 45, VB_W = 10000, NS = "http://www.w3.org/2000/svg";
  var TOOLS = {
    r: { color: "#e0311f", width: 26 },
    b: { color: "#1d5fd1", width: 26 },
    k: { color: "#1c2430", width: 26 },
    h: { color: "#ffd400", width: 230, highlighter: true },
    l: { color: "#ff2d1f", width: 56, laser: true }
  };
  var CSS =
    ".sl-ink{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:50;overflow:hidden}" +
    ".sl-ink path{fill:none;stroke-linecap:round;stroke-linejoin:round}" +
    ".sl-ink path.sl-hl{opacity:.4;mix-blend-mode:multiply}" +
    ".sl-ink path.sl-laser{filter:drop-shadow(0 0 40px #ff2d1f);transition:opacity .5s}" +
    ".sl-ink path.sl-fade{opacity:0}" +
    ".sl-surface{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}" +
    ".sl-ui,.sl-ui button,.sl-ui input{font:13px/1.3 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1c2430}" +
    ".sl-ui{-webkit-user-select:none;user-select:none;box-sizing:border-box}" +
    ".sl-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#9aa4b1;flex:none}" +
    ".sl-ok .sl-dot{background:#1a9e55}.sl-warn .sl-dot{background:#e0a100}.sl-bad .sl-dot{background:#d92d20}" +
    ".sl-pill{position:absolute;left:10px;top:10px;z-index:60;display:flex;align-items:center;gap:7px;height:30px;padding:0 11px;margin:0;border:1px solid #d3d9e0;border-radius:15px;background:rgba(255,255,255,.94);cursor:pointer;white-space:nowrap}" +
    ".sl-corner{position:fixed;right:10px;bottom:10px;z-index:9999;pointer-events:none;opacity:.9;transition:opacity 1s}" +
    ".sl-corner.sl-quiet{opacity:0}" +
    ".sl-bar{position:absolute;left:0;right:0;bottom:10px;margin:0 auto;width:-webkit-fit-content;width:fit-content;z-index:60;display:flex;flex-wrap:wrap;justify-content:center;gap:4px;align-items:center;max-width:calc(100% - 16px);box-sizing:border-box;padding:5px 7px;border:1px solid #d3d9e0;border-radius:12px;background:rgba(255,255,255,.96);box-shadow:0 1px 5px rgba(0,0,0,.1);touch-action:manipulation}" +
    ".sl-bar button{min-width:36px;height:36px;margin:0;padding:0 8px;border:1.5px solid transparent;border-radius:9px;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center}" +
    ".sl-bar button.sl-on{border-color:#173a6d;background:#eef2f8}" +
    ".sl-bar .sl-sep{width:1px;height:22px;background:#d3d9e0;margin:0 3px}" +
    ".sl-bar i{display:block;border-radius:50%;width:16px;height:16px}" +
    ".sl-panel{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:10000;width:min(420px,calc(100vw - 32px));padding:16px 18px;border:1px solid #d3d9e0;border-radius:12px;background:#fff;box-shadow:0 8px 30px rgba(0,0,0,.2);-webkit-user-select:text;user-select:text}" +
    ".sl-panel h4{margin:0 0 10px;font-size:15px;color:#173a6d}" +
    ".sl-panel input{width:100%;height:38px;padding:0 10px;margin:4px 0 10px;border:1px solid #c9d1da;border-radius:7px;font-size:16px;box-sizing:border-box}" +
    ".sl-panel .sl-row{display:flex;gap:8px;flex-wrap:wrap}" +
    ".sl-panel button{height:36px;padding:0 12px;border:1px solid #c9d1da;border-radius:7px;background:#fff;color:#173a6d;cursor:pointer}" +
    ".sl-panel pre{margin:12px 0 0;padding:10px;background:#f5f7f9;border-radius:7px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;color:#1c2430}" +
    "@media print{.sl-ui{display:none!important}}";

  var te = new TextEncoder(), td = new TextDecoder();
  function rid(n) { var a = new Uint8Array(n), s = ""; crypto.getRandomValues(a); for (var i = 0; i < n; i++) s += "abcdefghijkmnpqrstuvwxyz23456789"[a[i] % 32]; return s; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return (b < 16 ? "0" : "") + b.toString(16); }).join(""); }
  function hash32(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function store(area, k, v) { try { var s = global[area]; if (v === undefined) return s.getItem(k); if (v === null) s.removeItem(k); else s.setItem(k, v); } catch (e) {} return null; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  /* ---------- minimal MQTT 3.1.1 over WebSocket (QoS 0 publish / subscribe only) ---------- */
  function mqStr(s) { var b = te.encode(s), o = new Uint8Array(b.length + 2); o[0] = b.length >> 8; o[1] = b.length & 255; o.set(b, 2); return o; }
  function mqPacket(head, parts) {
    var len = 0, i; for (i = 0; i < parts.length; i++) len += parts[i].length;
    var hdr = [head], n = len; do { var d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; hdr.push(d); } while (n > 0);
    var out = new Uint8Array(hdr.length + len), p = hdr.length; out.set(hdr, 0);
    for (i = 0; i < parts.length; i++) { out.set(parts[i], p); p += parts[i].length; }
    return out;
  }
  function Relay(cfg, topic, onMsg, onChange) {
    var self = this, ws = null, buf = new Uint8Array(0), retry = 0, timer = null, ping = null, stopped = false;
    self.name = cfg.name || cfg.url.replace(/^wss?:\/\//, ""); self.up = false; self.lastRx = 0;
    function setUp(v) { if (self.up !== v) { self.up = v; onChange(self); } }
    function drop() {
      clearInterval(ping);
      if (ws) { var old = ws; ws = null; old.onopen = old.onmessage = old.onclose = old.onerror = null; try { old.close(); } catch (e) {} }
      setUp(false);
    }
    function again() { if (stopped) return; clearTimeout(timer); timer = setTimeout(connect, Math.min(5000, 400 * Math.pow(2, retry++))); }
    function connect() {
      if (stopped) return;
      clearTimeout(timer); drop();
      var sock;
      try { sock = ws = new WebSocket(cfg.url, "mqtt"); } catch (e) { return again(); }
      sock.binaryType = "arraybuffer"; buf = new Uint8Array(0);
      sock.onopen = function () {
        var vh = new Uint8Array([4, 2, 0, 30]), parts = [mqStr("MQTT"), vh, mqStr("sl" + rid(12))];
        if (cfg.user) { vh[1] |= 0xC0; parts.push(mqStr(cfg.user), mqStr(cfg.pass || "")); }
        sock.send(mqPacket(0x10, parts));
      };
      sock.onmessage = function (ev) { self.lastRx = Date.now(); feed(new Uint8Array(ev.data)); };
      sock.onclose = sock.onerror = function () { if (sock === ws) { drop(); again(); } };
    }
    function feed(chunk) {
      var b = new Uint8Array(buf.length + chunk.length); b.set(buf); b.set(chunk, buf.length); buf = b;
      for (;;) {
        if (buf.length < 2) return;
        var len = 0, mult = 1, p = 1, d;
        do { if (p >= buf.length) return; d = buf[p++]; len += (d & 127) * mult; mult *= 128; } while (d & 128);
        if (buf.length < p + len) return;
        var head = buf[0], body = buf.slice(p, p + len);
        buf = buf.slice(p + len);
        handle(head, body);
      }
    }
    function handle(head, body) {
      var type = head >> 4;
      if (type === 2) {                       /* CONNACK */
        if (body[1] !== 0) { drop(); again(); return; }
        ws.send(mqPacket(0x82, [new Uint8Array([0, 1]), mqStr(topic), new Uint8Array([0])]));
      } else if (type === 9) {                /* SUBACK */
        retry = 0; setUp(true);
        clearInterval(ping);
        ping = setInterval(function () {
          if (!ws || ws.readyState !== 1) return;
          if (Date.now() - self.lastRx > 40000) { connect(); return; }
          ws.send(new Uint8Array([0xC0, 0]));
        }, 12000);
      } else if (type === 3) {                /* PUBLISH */
        var tl = (body[0] << 8) | body[1], off = 2 + tl + (((head >> 1) & 3) ? 2 : 0);
        onMsg(body.slice(off));
      }
    }
    self.send = function (payload) {
      if (!self.up || !ws || ws.readyState !== 1) return false;
      try { ws.send(mqPacket(0x30, [mqStr(topic), payload])); return true; } catch (e) { return false; }
    };
    /* called when the page becomes visible again or the network returns */
    self.kick = function () { if (stopped) return; if (!self.up || Date.now() - self.lastRx > 8000) { retry = 0; connect(); } };
    self.stop = function () { stopped = true; clearTimeout(timer); drop(); };
    connect();
  }

  /* ---------- the link ---------- */
  function start(opt) {
    var host = opt.host, role = opt.role === "presenter" ? "presenter" : "screen";
    var params = new URLSearchParams(location.search);
    var room = opt.room || params.get("room") || store("localStorage", "slidelink-room");
    if (params.get("room")) store("localStorage", "slidelink-room", params.get("room") === "off" ? null : params.get("room"));
    if (room === "off") room = null;
    var relayCfg = opt.relays || (params.get("sl_relays") ? params.get("sl_relays").split(",").map(function (u) { return { url: u }; }) : RELAYS);
    var H = Math.round(VB_W / (opt.aspect || 16 / 9));

    var me = rid(8), seq = 0, state = { c: 0, h: me, hr: role, i: host.index() }, joined = false, joinTimer = null, applying = false, lastMove = 0;
    var relays = [], peers = {}, seen = {}, seenList = [], paused = false, key = null, topic = null, bc = null, rtt = null, fatal = null;
    var tx = Promise.resolve(), rx = Promise.resolve(), bulk = [], bulkTimer = null;
    var ink = {}, layers = {}, dead = {}, lastInkRx = 0, lastNeed = 0, lastSet = {}, saveTimer = null;
    var ui = {};

    document.head.appendChild(el("style", null, CSS));

    /* ----- crypto: AES-GCM key and topic name both derived from room code + deck id ----- */
    function derive() {
      var s = crypto.subtle, raw;
      return s.digest("SHA-256", te.encode("slidelink-v1|" + room + "|" + (opt.deck || ""))).then(function (d) {
        raw = d; return s.importKey("raw", d, "AES-GCM", false, ["encrypt", "decrypt"]);
      }).then(function (k) {
        key = k; return s.digest("SHA-256", te.encode("topic|" + hex(raw)));
      }).then(function (d) { topic = "slidelink/" + hex(d).slice(0, 40); });
    }
    function seal(obj) {
      var iv = crypto.getRandomValues(new Uint8Array(12));
      return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, te.encode(JSON.stringify(obj))).then(function (ct) {
        var out = new Uint8Array(12 + ct.byteLength); out.set(iv); out.set(new Uint8Array(ct), 12); return out;
      });
    }
    function open(bytes) {
      return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, key, bytes.slice(12)).then(function (pt) {
        return JSON.parse(td.decode(pt));
      }, function () { return null; });
    }

    /* ----- transport ----- */
    function anyUp() { for (var k = 0; k < relays.length; k++) if (relays[k].up) return true; return false; }
    function send(obj) {
      if (!key || paused) return;
      obj.f = me; obj.q = ++seq; obj.r = role;
      tx = tx.then(function () { return seal(obj); }).then(function (bytes) {
        for (var k = 0; k < relays.length; k++) relays[k].send(bytes);
        if (bc) try { bc.postMessage(bytes); } catch (e) {}
      }).catch(function () {});
    }
    function sendBulk(obj) {           /* paced, so a full redraw does not flood a public relay */
      bulk.push(obj);
      if (!bulkTimer) bulkTimer = setInterval(function () { if (bulk.length) send(bulk.shift()); else { clearInterval(bulkTimer); bulkTimer = null; } }, 12);
    }
    function receive(bytes) {
      if (bytes.length < 29) return;
      var id = String.fromCharCode.apply(null, bytes.subarray(0, 12));
      if (seen[id]) return;                               /* the same message arrives once per relay */
      seen[id] = 1; seenList.push(id); if (seenList.length > 3000) delete seen[seenList.shift()];
      rx = rx.then(function () { return open(bytes); }).then(function (m) {
        if (!m || m.f === me || typeof m.f !== "string" || paused) return;
        try { handle(m); } catch (e) { if (global.console) console.warn("SlideLink", e); }
      }).catch(function () {});
    }

    /* ----- page sync: Lamport counter, newest move wins; a device that just joined follows the room ----- */
    function stateMsg(kind) {
      var m = { k: kind, c: state.c, h: state.h, hr: state.hr, i: state.i, n: host.count, ts: Date.now() };
      if (role === "presenter") m.ik = digest(state.i);
      return m;
    }
    function moved() {
      if (applying || paused) return;
      var i = host.index(); if (i === state.i) return;
      joined = true; state = { c: state.c + 1, h: me, hr: role, i: i }; lastMove = Date.now();
      send(stateMsg("pos")); refresh();
    }
    function adopt(m) {
      state = { c: m.c, h: m.h, hr: m.hr === "presenter" ? "presenter" : "screen", i: m.i };
      if (host.index() !== m.i) { applying = true; try { host.show(m.i); } finally { applying = false; } }
    }
    function newer(m) {                /* later move wins; on a tie the presenter wins, then the larger id */
      if (m.c !== state.c) return m.c > state.c;
      if (m.h === state.h) return false;
      var a = m.hr === "presenter" ? 1 : 0, b = state.hr === "presenter" ? 1 : 0;
      return a !== b ? a > b : m.h > state.h;
    }
    function handle(m) {
      var now = Date.now();
      if (m.k === "hello") { if (joined) setTimeout(function () { send(stateMsg("hb")); }, 40 + Math.random() * 120); return; }
      if (m.k === "pos" || m.k === "hb") {
        if (typeof m.i !== "number" || m.i < 0 || m.i !== Math.floor(m.i)) return;
        peers[m.f] = { role: m.r, i: m.i, n: m.n, at: now };
        if (m.i < host.count) {
          if (!joined) { joined = true; clearTimeout(joinTimer); adopt(m); }
          else if (newer(m)) adopt(m);
        }
        if (m.r === "presenter" && role === "screen") {
          send({ k: "ack", to: m.f, ts: m.ts, i: host.index(), n: host.count });
          if (m.ik && m.i === state.i && m.ik !== digest(m.i) && now - lastInkRx > 1200 && now - lastNeed > 2500) { lastNeed = now; send({ k: "need", i: m.i }); }
        }
        refresh(); return;
      }
      if (m.k === "ack") { peers[m.f] = { role: m.r, i: m.i, n: m.n, at: now }; if (m.to === me) rtt = now - m.ts; refresh(); return; }
      if (m.k === "need" && role === "presenter") { resend(m.i); return; }
      if (m.k === "ink") { lastInkRx = now; inkOp(m); }
    }
    function setPaused(v) {            /* paused: this device neither leads nor follows (look ahead in private) */
      paused = !!v;
      if (!paused) { state.i = host.index(); joined = false; join(); }
      refresh();
    }
    function join() {                  /* ask who is here; if nobody answers, this device keeps its own slide */
      if (joined) return;
      send({ k: "hello" });
      clearTimeout(joinTimer);
      joinTimer = setTimeout(function () { if (!joined) { joined = true; send(stateMsg("hb")); refresh(); } }, anyUp() ? 2000 : 7000);
    }

    /* ----- ink: strokes live in an SVG layer inside each slide, in slide coordinates (0..10000 wide) ----- */
    function layer(i) {
      var s = host.slideEl(i); if (!s) return null;
      var sv = layers[i];
      if (!sv || sv.parentNode !== s) {
        sv = document.createElementNS(NS, "svg"); sv.setAttribute("class", "sl-ink");
        sv.setAttribute("viewBox", "0 0 " + VB_W + " " + H); sv.setAttribute("preserveAspectRatio", "none");
        s.appendChild(sv); layers[i] = sv;
      }
      return sv;
    }
    function find(i, id) { var a = ink[i] || []; for (var k = 0; k < a.length; k++) if (a[k].s === id) return a[k]; return null; }
    function pathD(p, laser) {
      var pts = [], k;
      for (k = laser ? Math.max(0, p.length - 56) : 0; k + 1 < p.length; k += 2) if (p[k] != null && p[k + 1] != null) pts.push(p[k], p[k + 1]);
      if (!pts.length) return "";
      if (pts.length === 2) return "M" + pts[0] + " " + pts[1] + "l.1 0";
      var d = "M" + pts[0] + " " + pts[1];
      for (k = 2; k + 3 < pts.length; k += 2) d += "Q" + pts[k] + " " + pts[k + 1] + " " + ((pts[k] + pts[k + 2]) >> 1) + " " + ((pts[k + 1] + pts[k + 3]) >> 1);
      return d + "L" + pts[pts.length - 2] + " " + pts[pts.length - 1];
    }
    function draw(st) {
      var t = TOOLS[st.tl];
      if (!st.el) {
        var sv = layer(st.i); if (!sv) return;
        st.el = document.createElementNS(NS, "path");
        st.el.setAttribute("stroke", t.color); st.el.setAttribute("stroke-width", t.width);
        if (t.highlighter) st.el.setAttribute("class", "sl-hl");
        if (t.laser) st.el.setAttribute("class", "sl-laser");
        sv.appendChild(st.el);
      }
      st.el.setAttribute("d", pathD(st.p, t.laser));
    }
    function remove(i, ids) {
      var a = ink[i] || [];
      ink[i] = a.filter(function (st) {
        if (ids && ids.indexOf(st.s) < 0) return true;
        if (st.el && st.el.parentNode) st.el.parentNode.removeChild(st.el);
        dead[st.s] = 1;
        return false;
      });
      if (ids) ids.forEach(function (id) { dead[id] = 1; });
    }
    function fade(st) {
      if (st.el) st.el.classList.add("sl-fade");
      setTimeout(function () { remove(st.i, [st.s]); }, 600);
    }
    function count(p) { var n = 0; for (var k = 0; k + 1 < p.length; k += 2) if (p[k] != null && p[k + 1] != null) n++; return n; }
    function digest(i) {               /* fingerprint of the finished strokes on one slide */
      var a = ink[i] || [], n = 0, h = 0;
      for (var k = 0; k < a.length; k++) { var st = a[k]; if (!st.e || TOOLS[st.tl].laser) continue; n++; h = (h + (hash32(st.s) ^ Math.imul(count(st.p), 2654435761))) >>> 0; }
      return n + "." + h;
    }
    function inkOp(m) {
      var i = m.i, k, now = Date.now();
      if (typeof i !== "number" || i < 0 || i >= host.count || i !== Math.floor(i)) return;
      if (m.o === "p") {
        if (!Array.isArray(m.p) || m.p.length > 4000 || !(m.a >= 0 && m.a < 50000) || typeof m.s !== "string" || dead[m.s]) return;
        var st = find(i, m.s);
        if (!st) { st = { s: m.s, i: i, tl: TOOLS[m.tl] ? m.tl : "r", p: [], e: false }; (ink[i] || (ink[i] = [])).push(st); }
        for (k = 0; k < m.p.length; k++) if (typeof m.p[k] === "number") st.p[m.a * 2 + k] = m.p[k];
        st.t = now; if (m.e) st.e = true;
        draw(st);
        if (TOOLS[st.tl].laser) { clearTimeout(st.to); if (st.e) fade(st); else st.to = setTimeout(function () { fade(st); }, 2500); }
      } else if (m.o === "d" && Array.isArray(m.ids)) { remove(i, m.ids); }
      else if (m.o === "set" && Array.isArray(m.ids)) {   /* the full list for this slide: drop anything else */
        remove(i, (ink[i] || []).filter(function (st) { return m.ids.indexOf(st.s) < 0 && (st.e || now - (st.t || 0) > 1500) && !TOOLS[st.tl].laser; }).map(function (st) { return st.s; }));
      }
      persist();
    }
    function resend(i) {               /* a screen asked for slide i again (it joined late or missed something) */
      var now = Date.now(); if (lastSet[i] && now - lastSet[i] < 2000) return; lastSet[i] = now;
      var a = (ink[i] || []).filter(function (st) { return st.e && !TOOLS[st.tl].laser; });
      sendBulk({ k: "ink", o: "set", i: i, ids: a.map(function (st) { return st.s; }) });
      a.forEach(function (st) {
        for (var off = 0; off < st.p.length || off === 0; off += 600)
          sendBulk({ k: "ink", o: "p", s: st.s, i: i, tl: st.tl, a: off / 2, p: st.p.slice(off, off + 600), e: off + 600 >= st.p.length ? 1 : 0 });
      });
    }
    function persist() {               /* presenter keeps its ink across a reload of the same tab */
      if (role !== "presenter" || !topic) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        var out = {};
        Object.keys(ink).forEach(function (i) {
          var a = ink[i].filter(function (st) { return st.e && !TOOLS[st.tl].laser; }).map(function (st) { return { s: st.s, tl: st.tl, p: st.p }; });
          if (a.length) out[i] = a;
        });
        store("sessionStorage", "sl-ink-" + topic, JSON.stringify(out));
      }, 400);
    }
    function restore() {
      try {
        var saved = JSON.parse(store("sessionStorage", "sl-ink-" + topic) || "{}");
        Object.keys(saved).forEach(function (i) {
          if (+i >= host.count) return;
          saved[i].forEach(function (s) { var st = { s: s.s, i: +i, tl: TOOLS[s.tl] ? s.tl : "r", p: s.p, e: true }; (ink[+i] || (ink[+i] = [])).push(st); draw(st); });
        });
      } catch (e) {}
    }

    /* ----- pen input (presenter only) ----- */
    function initPen() {
      var surface = host.surface, act = null, penEnd = 0, penNear = 0, clickBlock = 0, touches = {}, palm = {}, finger = false, tool = "r";
      surface.style.touchAction = "none"; surface.classList.add("sl-surface");

      var bar = ui.bar = el("div", "sl-ui sl-bar",
        '<button data-t="r" aria-label="red pen"><i style="background:#e0311f"></i></button>' +
        '<button data-t="b" aria-label="blue pen"><i style="background:#1d5fd1"></i></button>' +
        '<button data-t="k" aria-label="black pen"><i style="background:#1c2430"></i></button>' +
        '<button data-t="h" aria-label="highlighter"><i style="background:#ffd400;border-radius:3px;width:22px;height:11px"></i></button>' +
        '<button data-t="l" aria-label="laser pointer"><i style="background:#ff2d1f;width:9px;height:9px;box-shadow:0 0 0 4px rgba(255,45,31,.25)"></i></button>' +
        '<span class="sl-sep"></span>' +
        '<button data-t="x">Erase</button><button data-a="undo">Undo</button><button data-a="clear">Clear</button>' +
        '<span class="sl-sep"></span><button data-a="finger" aria-pressed="false">Finger</button>');
      surface.appendChild(bar);
      function paint() {
        Array.prototype.forEach.call(bar.querySelectorAll("button"), function (b) {
          b.classList.toggle("sl-on", b.getAttribute("data-t") === tool || (b.getAttribute("data-a") === "finger" && finger));
        });
      }
      bar.addEventListener("click", function (e) {
        var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
        var t = b.getAttribute("data-t"), a = b.getAttribute("data-a"), i = host.index(), arr = ink[i] || [];
        if (t) tool = t;
        else if (a === "finger") { finger = !finger; b.setAttribute("aria-pressed", String(finger)); }
        else if (a === "clear") { if (arr.length) { var all = arr.map(function (st) { return st.s; }); remove(i, all); send({ k: "ink", o: "d", i: i, ids: all }); persist(); } }
        else if (a === "undo") {
          for (var k = arr.length - 1; k >= 0; k--) if (arr[k].e && !TOOLS[arr[k].tl].laser) { var id = arr[k].s; remove(i, [id]); send({ k: "ink", o: "d", i: i, ids: [id] }); persist(); break; }
        }
        paint();
      });
      paint();

      function inUi(t) { return bar.contains(t) || (ui.pill && ui.pill.contains(t)) || (ui.panel && ui.panel.contains(t)); }
      function busy() { return !!act || Date.now() - penEnd < 450; }                 /* drawing, or just lifted the pen */
      function penAround() { return busy() || Date.now() - penNear < 350; }          /* ...or the pen is hovering: fingers are a resting hand */
      function swallow(e) { if (e.cancelable) e.preventDefault(); e.stopImmediatePropagation(); }
      function pt(e, r) { return [Math.round(clamp((e.clientX - r.left) / r.width, 0, 1) * VB_W), Math.round(clamp((e.clientY - r.top) / r.height, 0, 1) * H)]; }
      function draws(e) { return e.pointerType === "pen" || (finger && e.isPrimary && (e.pointerType !== "mouse" || e.button === 0)); }

      function flush(end) {
        var a = act; if (!a || !a.st) return;
        clearTimeout(a.ft); a.ft = null;
        var n = a.st.p.length / 2;
        if (n > a.sent || end) { send({ k: "ink", o: "p", s: a.st.s, i: a.i, tl: a.st.tl, a: a.sent, p: a.st.p.slice(a.sent * 2), e: end ? 1 : 0 }); a.sent = n; }
      }
      function addPoint(p, force) {
        var st = act.st, n = st.p.length;
        if (!force && n >= 2) { var dx = p[0] - st.p[n - 2], dy = p[1] - st.p[n - 1]; if (dx * dx + dy * dy < 144) return; }
        st.p.push(p[0], p[1]); draw(st);
        if (!act.ft) act.ft = setTimeout(function () { flush(false); }, FLUSH_MS);
      }
      function segDist2(px, py, ax, ay, bx, by) {
        var dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0;
        var x = ax + t * dx - px, y = ay + t * dy - py; return x * x + y * y;
      }
      function eraseAt(p) {
        var dead = [], arr = ink[act.i] || [];
        arr.forEach(function (st) {
          if (TOOLS[st.tl].laser) return;
          var q = st.p, R = 130 + TOOLS[st.tl].width / 2;
          for (var k = 0; k + 1 < q.length; k += 2) {
            var k2 = k + 3 < q.length ? k + 2 : k;
            if (segDist2(p[0], p[1], q[k], q[k + 1], q[k2], q[k2 + 1]) < R * R) { dead.push(st.s); return; }
          }
        });
        if (dead.length) { remove(act.i, dead); send({ k: "ink", o: "d", i: act.i, ids: dead }); persist(); }
      }
      function finish(e) {
        if (!act || e.pointerId !== act.id) return;
        swallow(e);
        var st = act.st;
        if (st) { st.e = true; flush(true); if (TOOLS[st.tl].laser) fade(st); else persist(); }
        act = null; penEnd = Date.now(); clickBlock = penEnd + 450;
      }

      document.addEventListener("pointerdown", function (e) {
        if (!surface.contains(e.target) || inUi(e.target)) return;
        if (!draws(e)) { if (penAround()) swallow(e); return; }
        if (act) { swallow(e); return; }
        var i = host.index(), s = host.slideEl(i), r = s && s.getBoundingClientRect();
        if (!r || !r.width || e.clientX < r.left - 12 || e.clientX > r.right + 12 || e.clientY < r.top - 12 || e.clientY > r.bottom + 12) return;
        swallow(e);
        try { surface.setPointerCapture(e.pointerId); } catch (x) {}
        act = { id: e.pointerId, r: r, i: i, sent: 0, st: null, ft: null };
        for (var id in touches) palm[id] = 1;            /* a hand already resting on the glass is a palm */
        if (tool === "x") eraseAt(pt(e, r));
        else { act.st = { s: me + "-" + rid(6), i: i, tl: tool, p: [], e: false }; (ink[i] || (ink[i] = [])).push(act.st); addPoint(pt(e, r), true); }
      }, true);
      document.addEventListener("pointermove", function (e) {
        if (e.pointerType === "pen") penNear = Date.now();
        if (!act || e.pointerId !== act.id) return;
        swallow(e);
        var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null; if (!evs || !evs.length) evs = [e];
        for (var k = 0; k < evs.length; k++) { var p = pt(evs[k], act.r); if (act.st) addPoint(p, false); else eraseAt(p); }
      }, true);
      document.addEventListener("pointerup", finish, true);
      document.addEventListener("pointercancel", finish, true);

      /* Safari also sends touch events for the Pencil and for the resting hand: keep them away from the deck's own swipe / tap handlers */
      function stylus(t) { return t.touchType === "stylus"; }
      document.addEventListener("touchstart", function (e) {
        if (!surface.contains(e.target) || inUi(e.target)) return;
        var sw = false;
        for (var k = 0; k < e.changedTouches.length; k++) {
          var t = e.changedTouches[k];
          if (stylus(t)) { if (act) sw = true; }
          else { touches[t.identifier] = 1; if (penAround()) { palm[t.identifier] = 1; sw = true; } else delete palm[t.identifier]; }
        }
        if (sw) swallow(e);
      }, { capture: true, passive: false });
      document.addEventListener("touchmove", function (e) { if (act && surface.contains(e.target) && !inUi(e.target)) swallow(e); }, { capture: true, passive: false });
      function touchEnd(e) {
        var sw = false;
        for (var k = 0; k < e.changedTouches.length; k++) {
          var t = e.changedTouches[k];
          if (stylus(t)) { if (busy()) sw = true; }
          else { delete touches[t.identifier]; if (palm[t.identifier]) { delete palm[t.identifier]; sw = true; } }
        }
        if (sw && !inUi(e.target)) { clickBlock = Date.now() + 450; swallow(e); }
      }
      document.addEventListener("touchend", touchEnd, { capture: true, passive: false });
      document.addEventListener("touchcancel", touchEnd, { capture: true, passive: false });
      document.addEventListener("click", function (e) {
        if (surface.contains(e.target) && !inUi(e.target) && (busy() || Date.now() < clickBlock)) swallow(e);
      }, true);

      /* keep the tablet awake while presenting */
      function wake() { try { if (navigator.wakeLock && document.visibilityState === "visible") navigator.wakeLock.request("screen").catch(function () {}); } catch (e) {} }
      wake(); document.addEventListener("visibilitychange", wake); document.addEventListener("pointerdown", wake, { once: true });
    }

    /* ----- status: pill on the presenter, corner dot on the screen, panel behind both (tap the pill, or press L) ----- */
    function peer(kind) {
      var best = null, now = Date.now();
      Object.keys(peers).forEach(function (id) { var p = peers[id]; if (p.role === kind && now - p.at < PEER_TTL && (!best || p.at > best.at)) best = p; });
      return best;
    }
    function status() {
      if (fatal) return ["bad", fatal];
      if (!room) return ["", "Sync off"];
      if (paused) return ["", "Paused"];
      if (!anyUp()) return ["bad", "Offline"];
      var other = peer(role === "presenter" ? "screen" : "presenter");
      if (!other) return ["warn", role === "presenter" ? "No screen yet" : "No presenter yet"];
      if (other.n !== host.count) return ["warn", "Different deck"];
      if (role === "presenter") {
        if (other.i !== state.i && Date.now() - lastMove > 1500) return ["warn", "Screen on slide " + (other.i + 1)];
        return ["ok", "Screen linked" + (rtt != null ? " · " + Math.max(1, Math.round(rtt / 2)) + " ms" : "")];
      }
      return ["ok", "Linked"];
    }
    var quietTimer = null;
    function refresh() {
      var s = status(), cls = s[0] ? " sl-" + s[0] : "";
      if (ui.pill) { ui.pill.className = "sl-ui sl-pill" + cls; ui.pillText.textContent = s[1]; }
      if (ui.corner) {
        var was = ui.corner.getAttribute("data-s");
        if (was !== s[0]) {
          ui.corner.setAttribute("data-s", s[0]); ui.corner.className = "sl-ui sl-corner" + cls; ui.corner.hidden = !room;
          clearTimeout(quietTimer);
          quietTimer = setTimeout(function () { ui.corner.classList.add("sl-quiet"); }, 5000);
        }
      }
      if (ui.panel && !ui.panel.hidden) {
        var now = Date.now(), lines = [];
        lines.push("status   " + s[1]);
        lines.push("relays   " + (relays.length ? relays.map(function (r) { return r.name + (r.up ? " ✓" : " ✗"); }).join("   ") : "none"));
        var ps = Object.keys(peers).filter(function (id) { return now - peers[id].at < PEER_TTL; }).map(function (id) { var p = peers[id]; return p.role + " on slide " + (p.i + 1) + ", " + ((now - p.at) / 1000).toFixed(1) + " s ago"; });
        lines.push("others   " + (ps.length ? ps.join("\n         ") : "nobody"));
        if (rtt != null) lines.push("delay    about " + Math.max(1, Math.round(rtt / 2)) + " ms one way");
        lines.push("this     " + role + ", slide " + (host.index() + 1) + " of " + host.count + (opt.deck ? ', deck "' + opt.deck + '"' : ""));
        ui.info.textContent = lines.join("\n");
      }
    }
    function initUi() {
      if (role === "presenter" && host.surface) {
        ui.pill = el("button", "sl-ui sl-pill", '<span class="sl-dot"></span><span></span>'); ui.pill.type = "button";
        ui.pillText = ui.pill.lastChild; host.surface.appendChild(ui.pill);
        ui.pill.addEventListener("click", function () { togglePanel(); });
      } else {
        ui.corner = el("div", "sl-ui sl-corner", '<span class="sl-dot"></span>'); ui.corner.setAttribute("data-s", "?");
        document.body.appendChild(ui.corner);
      }
      var p = ui.panel = el("div", "sl-ui sl-panel",
        "<h4>SlideLink</h4><label>Room code (same on both devices)<input type='text' autocapitalize='off' autocorrect='off' autocomplete='off' spellcheck='false'></label>" +
        "<div class='sl-row'><button data-a='save' type='button'>Save and reconnect</button><button data-a='new' type='button'>New code</button><button data-a='pause' type='button'>Pause sync</button><button data-a='close' type='button'>Close</button></div><pre></pre>");
      p.hidden = true; document.body.appendChild(p);
      ui.input = p.querySelector("input"); ui.info = p.querySelector("pre");
      ["click", "contextmenu", "pointerdown", "touchstart", "touchend", "keydown"].forEach(function (t) { p.addEventListener(t, function (e) { e.stopPropagation(); }); });
      p.addEventListener("click", function (e) {
        var a = e.target.getAttribute && e.target.getAttribute("data-a");
        if (a === "close") togglePanel(false);
        else if (a === "pause") { setPaused(!paused); e.target.textContent = paused ? "Resume sync" : "Pause sync"; }
        else if (a === "new") ui.input.value = rid(4) + "-" + rid(4) + "-" + rid(4);
        else if (a === "save") {
          var v = ui.input.value.trim(), u = new URL(location.href);
          if (!v) return;
          store("localStorage", "slidelink-room", v === "off" ? null : v);
          u.searchParams.set("room", v);
          location.href = u.toString();
        }
      });
      document.addEventListener("keydown", function (e) {
        if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || "")) return;
        if (e.key === "l" || e.key === "L") togglePanel();
      });
      setInterval(refresh, 500);
    }
    function togglePanel(on) {
      var p = ui.panel; p.hidden = on === undefined ? !p.hidden : !on;
      if (p.hidden && p.contains(document.activeElement)) document.activeElement.blur();   /* give the keyboard back to the deck */
      if (!p.hidden) { ui.input.value = ""; ui.input.placeholder = room ? "saved on this device (type to change)" : "none yet"; refresh(); }
    }

    /* ----- go ----- */
    initUi();
    if (role === "presenter" && host.surface) initPen();
    host.onmove = moved;
    if (!room) { refresh(); }
    else if (!(global.crypto && crypto.subtle)) { fatal = "Needs https"; refresh(); }
    else derive().then(function () {
      if (role === "presenter") restore();
      relays = relayCfg.map(function (cfg) {
        return new Relay(cfg, topic, receive, function (r) { if (r.up) { if (joined) send(stateMsg("hb")); else join(); } refresh(); });
      });
      if (opt.local !== false && global.BroadcastChannel) {
        try { bc = new BroadcastChannel(topic); bc.onmessage = function (ev) { receive(new Uint8Array(ev.data)); }; join(); } catch (e) {}
      }
      setInterval(function () {
        if (!joined) return;
        var now = Date.now();
        relays.forEach(function (r) { if (r.up && r.lastRx && now - r.lastRx > 9000) r.kick(); });
        if (anyUp() || bc) send(stateMsg("hb"));
      }, HB_MS);
      function kick() { relays.forEach(function (r) { r.kick(); }); }
      global.addEventListener("online", kick);
      document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") { kick(); if (joined) send(stateMsg("hb")); } });
      refresh();
    }).catch(function (e) { fatal = "Sync error"; refresh(); if (global.console) console.warn("SlideLink", e); });

    return { moved: moved, pause: setPaused, status: function () { return status()[1]; }, state: function () { return { room: !!room, topic: topic, joined: joined, slide: state.i, relays: relays.map(function (r) { return { name: r.name, up: r.up }; }), rtt: rtt, ink: ink }; } };
  }

  global.SlideLink = { version: "1.0", start: start };
})(window);
