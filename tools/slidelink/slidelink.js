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

  /* ---------- perfect-freehand 1.2.3 (turns pen points into a smooth stroke outline), bundled unchanged.
   * https://github.com/steveruizok/perfect-freehand
   *
   * MIT License
   * 
   * Copyright (c) 2021 Stephen Ruiz Ltd
   * 
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   * 
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   * 
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   */
  var PF = (function () { var exports = {}; Object.defineProperties(exports,{__esModule:{value:!0},[Symbol.toStringTag]:{value:`Module`}});const{PI:e}=Math,t=e+1e-4,n=.5,r=[1,1];function i(e,t,n,r=e=>e){return e*r(.5-t*(.5-n))}const{min:a}=Math;function o(e,t,n){let r=a(1,t/n);return a(1,e+(a(1,1-r)-e)*(r*.275))}function s(e){return[-e[0],-e[1]]}function c(e,t){return[e[0]+t[0],e[1]+t[1]]}function l(e,t,n){return e[0]=t[0]+n[0],e[1]=t[1]+n[1],e}function u(e,t){return[e[0]-t[0],e[1]-t[1]]}function d(e,t,n){return e[0]=t[0]-n[0],e[1]=t[1]-n[1],e}function f(e,t){return[e[0]*t,e[1]*t]}function p(e,t,n){return e[0]=t[0]*n,e[1]=t[1]*n,e}function m(e,t){return[e[0]/t,e[1]/t]}function h(e){return[e[1],-e[0]]}function g(e,t){let n=t[0];return e[0]=t[1],e[1]=-n,e}function ee(e,t){return e[0]*t[0]+e[1]*t[1]}function _(e,t){return e[0]===t[0]&&e[1]===t[1]}function v(e){return Math.hypot(e[0],e[1])}function y(e,t){let n=e[0]-t[0],r=e[1]-t[1];return n*n+r*r}function b(e){return m(e,v(e))}function x(e,t){return Math.hypot(e[1]-t[1],e[0]-t[0])}function S(e,t,n){let r=Math.sin(n),i=Math.cos(n),a=e[0]-t[0],o=e[1]-t[1],s=a*i-o*r,c=a*r+o*i;return[s+t[0],c+t[1]]}function C(e,t,n,r){let i=Math.sin(r),a=Math.cos(r),o=t[0]-n[0],s=t[1]-n[1],c=o*a-s*i,l=o*i+s*a;return e[0]=c+n[0],e[1]=l+n[1],e}function w(e,t,n){return c(e,f(u(t,e),n))}function te(e,t,n,r){let i=n[0]-t[0],a=n[1]-t[1];return e[0]=t[0]+i*r,e[1]=t[1]+a*r,e}function T(e,t,n){return c(e,f(t,n))}const E=[0,0],D=[0,0],O=[0,0];function k(e,n){let r=T(e,b(h(u(e,c(e,[1,1])))),-n),i=[],a=1/13;for(let n=a;n<=1;n+=a)i.push(S(r,e,t*2*n));return i}function A(e,n,r){let i=[],a=1/r;for(let r=a;r<=1;r+=a)i.push(S(n,e,t*r));return i}function j(e,t,n){let r=u(t,n),i=f(r,.5),a=f(r,.51);return[u(e,i),u(e,a),c(e,a),c(e,i)]}function M(e,n,r,i){let a=[],o=T(e,n,r),s=1/i;for(let n=s;n<1;n+=s)a.push(S(o,e,t*3*n));return a}function ne(e,t,n){return[c(e,f(t,n)),c(e,f(t,n*.99)),u(e,f(t,n*.99)),u(e,f(t,n))]}function N(e,t,n){return e===!1||e===void 0?0:e===!0?Math.max(t,n):e}function re(e,t,n){return e.slice(0,10).reduce((e,r)=>{let i=r.pressure;return t&&(i=o(e,r.distance,n)),(e+i)/2},e[0].pressure)}function P(e,n={}){let{size:r=16,smoothing:a=.5,thinning:f=.5,simulatePressure:m=!0,easing:_=e=>e,start:v={},end:b={},last:x=!1}=n,{cap:S=!0,easing:w=e=>e*(2-e)}=v,{cap:T=!0,easing:P=e=>--e*e*e+1}=b;if(e.length===0||r<=0)return[];let F=e[e.length-1].runningLength,I=N(v.taper,r,F),L=N(b.taper,r,F),R=(r*a)**2,z=[],B=[],V=re(e,m,r),H=i(r,f,e[e.length-1].pressure,_),U,W=e[0].vector,G=e[0].point,K=G,q=G,J=K,Y=!1;for(let n=0;n<e.length;n++){let{pressure:a}=e[n],{point:s,vector:h,distance:v,runningLength:b}=e[n],x=n===e.length-1;if(!x&&F-b<3)continue;f?(m&&(a=o(V,v,r)),H=i(r,f,a,_)):H=r/2,U===void 0&&(U=H);let S=b<I?w(b/I):1,T=F-b<L?P((F-b)/L):1;H=Math.max(.01,H*Math.min(S,T));let k=(x?e[n]:e[n+1]).vector,A=x?1:ee(h,k),j=ee(h,W)<0&&!Y,M=A!==null&&A<0;if(j||M){g(E,W),p(E,E,H);for(let e=0;e<=1;e+=.07692307692307693)d(D,s,E),C(D,D,s,t*e),q=[D[0],D[1]],z.push(q),l(O,s,E),C(O,O,s,t*-e),J=[O[0],O[1]],B.push(J);G=q,K=J,M&&(Y=!0);continue}if(Y=!1,x){g(E,h),p(E,E,H),z.push(u(s,E)),B.push(c(s,E));continue}te(E,k,h,A),g(E,E),p(E,E,H),d(D,s,E),q=[D[0],D[1]],(n<=1||y(G,q)>R)&&(z.push(q),G=q),l(O,s,E),J=[O[0],O[1]],(n<=1||y(K,J)>R)&&(B.push(J),K=J),V=a,W=h}let X=[e[0].point[0],e[0].point[1]],Z=e.length>1?[e[e.length-1].point[0],e[e.length-1].point[1]]:c(e[0].point,[1,1]),Q=[],$=[];if(e.length===1){if(!(I||L)||x)return k(X,U||H)}else{I||L&&e.length===1||(S?Q.push(...A(X,B[0],13)):Q.push(...j(X,z[0],B[0])));let t=h(s(e[e.length-1].vector));L||I&&e.length===1?$.push(Z):T?$.push(...M(Z,t,H,29)):$.push(...ne(Z,t,H))}return z.concat($,B.reverse(),Q)}const F=[0,0];function I(e){return e!=null&&e>=0}function L(e,t={}){let{streamline:i=.5,size:a=16,last:o=!1}=t;if(e.length===0)return[];let s=.15+(1-i)*.85,l=Array.isArray(e[0])?e:e.map(({x:e,y:t,pressure:r=n})=>[e,t,r]);if(l.length===2){let e=l[1];l=l.slice(0,-1);for(let t=1;t<5;t++)l.push(w(l[0],e,t/4))}l.length===1&&(l=[...l,[...c(l[0],r),...l[0].slice(2)]]);let u=[{point:[l[0][0],l[0][1]],pressure:I(l[0][2])?l[0][2]:.25,vector:[...r],distance:0,runningLength:0}],f=!1,p=0,m=u[0],h=l.length-1;for(let e=1;e<l.length;e++){let t=o&&e===h?[l[e][0],l[e][1]]:w(m.point,l[e],s);if(_(m.point,t))continue;let r=x(t,m.point);if(p+=r,e<h&&!f){if(p<a)continue;f=!0}d(F,m.point,t),m={point:t,pressure:I(l[e][2])?l[e][2]:n,vector:b(F),distance:r,runningLength:p},u.push(m)}return u[0].vector=u[1]?.vector||[0,0],u}function R(e,t={}){return P(L(e,t),t)}var z=R;exports.default=z,exports.getStroke=R,exports.getStrokeOutlinePoints=P,exports.getStrokePoints=L;
    return exports; })();

  var RELAYS = [
    { name: "emqx", url: "wss://broker.emqx.io:8084/mqtt" },
    { name: "hivemq", url: "wss://broker.hivemq.com:8884/mqtt" },
    { name: "shiftr", url: "wss://public.cloud.shiftr.io", user: "public", pass: "public" }
  ];
  var HB_MS = 2500, PEER_TTL = 7000, FLUSH_MS = 45, VB_W = 10000, NS = "http://www.w3.org/2000/svg";
  var PROTO = 2;                            /* ink format version: both pages must run the same one */
  var TOOLS = {
    r: { color: "#e0311f" },
    b: { color: "#1d5fd1" },
    k: { color: "#1c2430" },
    h: { color: "#ffd400", highlighter: true },
    l: { color: "#ff2d1f", laser: true }
  };
  var SIZES = [14, 24, 40, 64];             /* pen sizes in slide units (slide width = 10000); highlighter is 9x */
  var CSS =
    ".sl-ink{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:50;overflow:hidden}" +
    ".sl-ink path{stroke-linecap:round;stroke-linejoin:round}" +
    ".sl-ink .sl-sel{fill:rgba(29,95,209,.07);stroke:#1d5fd1;stroke-width:14;stroke-dasharray:60 45;stroke-linejoin:round}" +
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
    ".sl-bar svg{display:block;width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}" +
    ".sl-bar button{color:#1c2430}" +
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
    var self = this, ws = null, buf = new Uint8Array(0), retry = 0, timer = null, guard = null, ping = null, stopped = false;
    self.name = cfg.name || cfg.url.replace(/^wss?:\/\//, ""); self.up = false; self.lastRx = 0;
    self.pending = 0;                       /* time of the oldest send that has had no traffic back yet (0 = none) */
    function setUp(v) { if (self.up !== v) { self.up = v; onChange(self); } }
    function drop() {
      clearInterval(ping); clearTimeout(guard); self.pending = 0;
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
      guard = setTimeout(function () { if (sock === ws && !self.up) { drop(); again(); } }, 8000);   /* a connection that never completes */
      sock.onopen = function () {
        var vh = new Uint8Array([4, 2, 0, 120]), parts   /* keep-alive 120 s: a relay keeps the session even if this tab's timers are slowed down for a while */ = [mqStr("MQTT"), vh, mqStr("sl" + rid(12))];
        if (cfg.user) { vh[1] |= 0xC0; parts.push(mqStr(cfg.user), mqStr(cfg.pass || "")); }
        sock.send(mqPacket(0x10, parts));
      };
      sock.onmessage = function (ev) { self.lastRx = Date.now(); self.pending = 0; feed(new Uint8Array(ev.data)); };
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
        retry = 0; self.connects = (self.connects || 0) + 1; setUp(true);
        clearInterval(ping);
        ping = setInterval(function () {
          if (!ws || ws.readyState !== 1) return;
          if (self.pending && Date.now() - self.pending > 9000) { connect(); return; }
          if (!self.pending) self.pending = Date.now();
          ws.send(new Uint8Array([0xC0, 0]));
        }, 12000);
      } else if (type === 3) {                /* PUBLISH */
        var tl = (body[0] << 8) | body[1], off = 2 + tl + (((head >> 1) & 3) ? 2 : 0);
        onMsg(body.slice(off));
      }
    }
    self.send = function (payload) {
      if (!self.up || !ws || ws.readyState !== 1) return false;
      try { ws.send(mqPacket(0x30, [mqStr(topic), payload])); if (!self.pending) self.pending = Date.now(); return true; } catch (e) { return false; }
    };
    /* A relay echoes our own messages back, so a send that stays unanswered means the socket is dead.
       This is judged by "sent and heard nothing", never by the clock alone, so a throttled background tab does not reconnect for no reason. */
    self.stale = function (ms) { return self.up && self.pending && Date.now() - self.pending > ms; };
    self.kick = function () { if (stopped) return; if (!self.up || self.stale(8000)) { retry = 0; connect(); } };
    /* called when the page becomes visible again or the network returns: ask for a sign of life, reconnect if none comes */
    self.probe = function () {
      if (stopped) return;
      if (!self.up || !ws || ws.readyState !== 1) { retry = 0; connect(); return; }
      var sock = ws;
      if (!self.pending) self.pending = Date.now();
      try { sock.send(new Uint8Array([0xC0, 0])); } catch (e) {}
      setTimeout(function () { if (sock === ws && self.stale(2500)) { retry = 0; connect(); } }, 3000);
    };
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
    var ink = {}, layers = {}, dead = {}, onSlide = null, onInk = null, lastInkRx = 0, lastNeed = 0, lastSet = {}, saveTimer = null;
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
      var m = { k: kind, v: PROTO, c: state.c, h: state.h, hr: state.hr, i: state.i, n: host.count, ts: Date.now() };
      if (role === "presenter") m.ik2 = digest(state.i);
      return m;
    }
    function moved() {
      if (applying || paused) return;
      var i = host.index(); if (i === state.i) return;
      if (onSlide) onSlide();
      joined = true; state = { c: state.c + 1, h: me, hr: role, i: i }; lastMove = Date.now();
      send(stateMsg("pos")); refresh();
    }
    function adopt(m) {
      state = { c: m.c, h: m.h, hr: m.hr === "presenter" ? "presenter" : "screen", i: m.i };
      if (host.index() !== m.i) { applying = true; try { host.show(m.i); } finally { applying = false; } if (onSlide) onSlide(); }
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
        peers[m.f] = { role: m.r, i: m.i, n: m.n, v: m.v, at: now };
        if (m.i < host.count) {
          if (!joined) { joined = true; clearTimeout(joinTimer); adopt(m); }
          else if (newer(m)) adopt(m);
        }
        if (m.r === "presenter" && role === "screen") {
          send({ k: "ack", v: PROTO, to: m.f, ts: m.ts, i: host.index(), n: host.count });
          if (m.ik2 && m.i === state.i && m.ik2 !== digest(m.i) && now - lastInkRx > 1200 && now - lastNeed > 2500) { lastNeed = now; send({ k: "need", i: m.i }); }
        }
        refresh(); return;
      }
      if (m.k === "ack") { peers[m.f] = { role: m.r, i: m.i, n: m.n, v: m.v, at: now }; if (m.to === me) rtt = now - m.ts; refresh(); return; }
      if (m.k === "need" && role === "presenter") { resend(m.i); return; }
      if (m.k === "ink2") { lastInkRx = now; inkOp(m); }
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

    /* ----- ink: strokes live in an SVG layer inside each slide, in slide coordinates (0..10000 wide).
       A stroke is a list of x, y, pressure triples. Both pages compute its outline the same way, so they look the same. ----- */
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
    function triples(p, from) {
      var out = [];
      for (var k = Math.floor((from || 0) / 3) * 3; k + 2 < p.length; k += 3) if (p[k] != null && p[k + 1] != null) out.push([p[k], p[k + 1], (p[k + 2] == null ? 50 : p[k + 2]) / 100]);
      return out;
    }
    function outlineD(o) {             /* closed, smooth curve through the outline points */
      var n = o.length, r = Math.round; if (n < 3) return "";
      var d = "M" + r((o[0][0] + o[1][0]) / 2) + " " + r((o[0][1] + o[1][1]) / 2);
      for (var k = 1; k <= n; k++) { var a = o[k % n], b = o[(k + 1) % n]; d += "Q" + r(a[0]) + " " + r(a[1]) + " " + r((a[0] + b[0]) / 2) + " " + r((a[1] + b[1]) / 2); }
      return d + "Z";
    }
    function lineD(q) {                /* open curve, for the laser trail */
      if (!q.length) return "";
      if (q.length === 1) return "M" + q[0][0] + " " + q[0][1] + "l.1 0";
      var d = "M" + q[0][0] + " " + q[0][1];
      for (var k = 1; k + 1 < q.length; k++) d += "Q" + q[k][0] + " " + q[k][1] + " " + ((q[k][0] + q[k + 1][0]) >> 1) + " " + ((q[k][1] + q[k + 1][1]) >> 1);
      return d + "L" + q[q.length - 1][0] + " " + q[q.length - 1][1];
    }
    function place(st) {               /* a moved stroke keeps its points and carries an offset */
      if (!st.el) return;
      if (st.o[0] || st.o[1]) st.el.setAttribute("transform", "translate(" + st.o[0] + " " + st.o[1] + ")"); else st.el.removeAttribute("transform");
    }
    function draw(st) {
      var t = TOOLS[st.tl];
      if (!st.el) {
        var sv = layer(st.i); if (!sv) return;
        st.el = document.createElementNS(NS, "path");
        if (t.laser) { st.el.setAttribute("class", "sl-laser"); st.el.setAttribute("fill", "none"); st.el.setAttribute("stroke", t.color); st.el.setAttribute("stroke-width", st.w); }
        else { st.el.setAttribute("fill", t.color); if (t.highlighter) st.el.setAttribute("class", "sl-hl"); }
        sv.appendChild(st.el);
      }
      if (t.laser) st.el.setAttribute("d", lineD(triples(st.p, st.p.length - 84)));
      else st.el.setAttribute("d", outlineD(PF.getStroke(triples(st.p, 0), {
        size: st.w * (st.pr ? 1.5 : 1), thinning: st.pr ? 0.6 : 0, smoothing: 0.5, streamline: 0.35, simulatePressure: st.pr === 2, last: !!st.e
      })));
      place(st);
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
      if (onInk) onInk();
    }
    function fade(st) {
      if (st.el) st.el.classList.add("sl-fade");
      setTimeout(function () { remove(st.i, [st.s]); }, 600);
    }
    function count(p) { var n = 0; for (var k = 0; k + 2 < p.length; k += 3) if (p[k] != null && p[k + 1] != null) n++; return n; }
    function digest(i) {               /* fingerprint of the finished strokes on one slide: which ones, how long, where */
      var a = ink[i] || [], n = 0, h = 0;
      for (var k = 0; k < a.length; k++) {
        var st = a[k]; if (!st.e || TOOLS[st.tl].laser) continue; n++;
        h = (h + (hash32(st.s) ^ Math.imul(count(st.p), 2654435761) ^ Math.imul(st.o[0] * 31 + st.o[1], 40503))) >>> 0;
      }
      return n + "." + h;
    }
    function inkOp(m) {
      var i = m.i, k, now = Date.now();
      if (m.v !== PROTO || typeof i !== "number" || i < 0 || i >= host.count || i !== Math.floor(i)) return;
      if (m.o === "p") {
        if (!Array.isArray(m.p) || m.p.length > 4500 || m.p.length % 3 || !(m.a >= 0 && m.a < 50000) || typeof m.s !== "string" || dead[m.s]) return;
        var st = find(i, m.s);
        if (!st) {
          st = { s: m.s, i: i, tl: TOOLS[m.tl] ? m.tl : "r", w: clamp(+m.w || 24, 4, 1200), pr: m.pr === 1 || m.pr === 2 ? m.pr : 0, p: [], e: false, o: [0, 0], on: 0 };
          (ink[i] || (ink[i] = [])).push(st);
        }
        for (k = 0; k < m.p.length; k++) if (typeof m.p[k] === "number") st.p[m.a * 3 + k] = m.p[k];
        if (Array.isArray(m.of) && m.of[2] > st.on) { st.o = [+m.of[0] || 0, +m.of[1] || 0]; st.on = m.of[2]; }
        st.t = now; if (m.e) st.e = true;
        draw(st);
        if (TOOLS[st.tl].laser) { clearTimeout(st.to); if (st.e) fade(st); else st.to = setTimeout(function () { fade(st); }, 2500); }
      } else if (m.o === "m" && Array.isArray(m.mv)) {     /* strokes moved: absolute offsets, newest wins */
        m.mv.forEach(function (x) { var st = find(i, x[0]); if (st && m.n > st.on) { st.o = [+x[1] || 0, +x[2] || 0]; st.on = m.n; place(st); } });
        if (onInk) onInk();
      } else if (m.o === "d" && Array.isArray(m.ids)) { remove(i, m.ids); }
      else if (m.o === "set" && Array.isArray(m.ids)) {   /* the full list for this slide: drop anything else */
        remove(i, (ink[i] || []).filter(function (st) { return m.ids.indexOf(st.s) < 0 && (st.e || now - (st.t || 0) > 1500) && !TOOLS[st.tl].laser; }).map(function (st) { return st.s; }));
      }
      persist();
    }
    function inkMsg(o) { o.k = "ink2"; o.v = PROTO; return o; }
    function resend(i) {               /* a screen asked for slide i again (it joined late or missed something) */
      var now = Date.now(); if (lastSet[i] && now - lastSet[i] < 2000) return; lastSet[i] = now;
      var a = (ink[i] || []).filter(function (st) { return st.e && !TOOLS[st.tl].laser; });
      sendBulk(inkMsg({ o: "set", i: i, ids: a.map(function (st) { return st.s; }) }));
      a.forEach(function (st) {
        for (var off = 0; off < st.p.length || off === 0; off += 600)
          sendBulk(inkMsg({ o: "p", s: st.s, i: i, tl: st.tl, w: st.w, pr: st.pr, a: off / 3, p: st.p.slice(off, off + 600), e: off + 600 >= st.p.length ? 1 : 0, of: off ? undefined : [st.o[0], st.o[1], st.on] }));
      });
    }
    function persist() {               /* presenter keeps its ink across a reload of the same tab */
      if (role !== "presenter" || !topic) return;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        var out = {};
        Object.keys(ink).forEach(function (i) {
          var a = ink[i].filter(function (st) { return st.e && !TOOLS[st.tl].laser; }).map(function (st) { return { s: st.s, tl: st.tl, w: st.w, pr: st.pr, p: st.p, o: st.o, on: st.on }; });
          if (a.length) out[i] = a;
        });
        store("sessionStorage", "sl-ink2-" + topic, JSON.stringify(out));
      }, 400);
    }
    function restore() {
      try {
        var saved = JSON.parse(store("sessionStorage", "sl-ink2-" + topic) || "{}");
        Object.keys(saved).forEach(function (i) {
          if (+i >= host.count) return;
          saved[i].forEach(function (s) {
            var st = { s: s.s, i: +i, tl: TOOLS[s.tl] ? s.tl : "r", w: +s.w || 24, pr: s.pr || 0, p: s.p, e: true, o: Array.isArray(s.o) ? s.o : [0, 0], on: s.on || 0 };
            (ink[+i] || (ink[+i] = [])).push(st); draw(st);
          });
        });
      } catch (e) {}
    }

    /* ----- pen input (presenter only) ----- */
    function initPen() {
      var surface = host.surface, act = null, penEnd = 0, penNear = 0, clickBlock = 0, touches = {}, palm = {}, sel = null, moveSeq = 0;
      var cfg = { tool: "r", si: 1, pr: true, finger: false };      /* remembered on this device */
      try {
        var was = JSON.parse(store("localStorage", "sl-pen") || "null");
        if (was) {
          if ("rbkhlxsq".indexOf(was.tool) >= 0 && String(was.tool).length === 1) cfg.tool = was.tool;
          if (was.si >= 0 && was.si < SIZES.length) cfg.si = was.si | 0;
          cfg.pr = was.pr !== false; cfg.finger = !!was.finger;
        }
      } catch (e) {}
      surface.style.touchAction = "none"; surface.classList.add("sl-surface");

      function icon(inner) { return '<svg viewBox="0 0 20 20" aria-hidden="true">' + inner + "</svg>"; }
      var bar = ui.bar = el("div", "sl-ui sl-bar",
        '<button data-t="r" aria-label="red pen"><i style="background:#e0311f"></i></button>' +
        '<button data-t="b" aria-label="blue pen"><i style="background:#1d5fd1"></i></button>' +
        '<button data-t="k" aria-label="black pen"><i style="background:#1c2430"></i></button>' +
        '<button data-a="pr" aria-label="pressure-sensitive pen">' + icon('<path d="M2.5 15C6 5 9 15 17.5 4 10 17 7 7.5 2.5 15Z" fill="currentColor" stroke-width="1"/>') + "</button>" +
        '<button data-a="size" aria-label="pen size"><i class="sl-sz" style="background:#1c2430"></i></button>' +
        '<button data-t="h" aria-label="highlighter"><i style="background:#ffd400;border-radius:3px;width:22px;height:11px"></i></button>' +
        '<button data-t="l" aria-label="laser pointer"><i style="background:#ff2d1f;width:9px;height:9px;box-shadow:0 0 0 4px rgba(255,45,31,.25)"></i></button>' +
        '<span class="sl-sep"></span>' +
        '<button data-t="x" aria-label="eraser">' + icon('<path d="M3.7 12.8 11 5.5a1.4 1.4 0 0 1 2 0l2.8 2.8a1.4 1.4 0 0 1 0 2L10.3 16H6.9z"/><path d="M7.4 9.1l4.6 4.6M9.5 16.5h7"/>') + "</button>" +
        '<button data-t="s" aria-label="select with a rectangle">' + icon('<rect x="3.5" y="4.5" width="13" height="11" rx="1.5" stroke-dasharray="2.6 2.2"/>') + "</button>" +
        '<button data-t="q" aria-label="select with a lasso">' + icon('<path d="M10 3.5c4 0 7 2 7 4.7s-3 4.8-7 4.8-7-2.100-7-4.800 3-4.700 7-4.700z" stroke-dasharray="2.6 2.2"/><path d="M6.500 12.500c-1.200 1.300-1.200 3.200.8 4.500"/>') + "</button>" +
        '<span class="sl-sep"></span>' +
        '<button data-a="undo" aria-label="undo">' + icon('<path d="M7.500 4.500 4 8l3.500 3.500"/><path d="M4.500 8H12a4 4 0 0 1 0 8H8.500"/>') + "</button>" +
        '<button data-a="clear" aria-label="clear">' + icon('<path d="M4 6h12M8 6V4.300h4V6M5.800 6l.7 10.200h7L14.200 6M8.600 9v4.500M11.400 9v4.500"/>') + "</button>" +
        '<span class="sl-sep"></span><button data-a="finger" aria-pressed="false">Finger</button>');
      surface.appendChild(bar);
      function paint() {
        Array.prototype.forEach.call(bar.querySelectorAll("button"), function (b) {
          var a = b.getAttribute("data-a");
          b.classList.toggle("sl-on", b.getAttribute("data-t") === cfg.tool || (a === "finger" && cfg.finger) || (a === "pr" && cfg.pr));
          if (a === "finger" || a === "pr") b.setAttribute("aria-pressed", String(a === "pr" ? cfg.pr : cfg.finger));
        });
        var px = [5, 8, 12, 16][cfg.si], dot = bar.querySelector(".sl-sz"); dot.style.width = dot.style.height = px + "px";
        store("localStorage", "sl-pen", JSON.stringify(cfg));
      }
      function drop(i, ids) { if (ids.length) { remove(i, ids); send(inkMsg({ o: "d", i: i, ids: ids })); persist(); } }
      bar.addEventListener("click", function (e) {
        var b = e.target.closest ? e.target.closest("button") : null; if (!b) return;
        var t = b.getAttribute("data-t"), a = b.getAttribute("data-a"), i = host.index(), arr = ink[i] || [];
        if (t) { cfg.tool = t; if (t !== "s" && t !== "q") clearSel(); }
        else if (a === "finger") cfg.finger = !cfg.finger;
        else if (a === "pr") cfg.pr = !cfg.pr;
        else if (a === "size") cfg.si = (cfg.si + 1) % SIZES.length;
        else if (a === "clear") {                          /* with a selection: only the selected strokes */
          if (sel && sel.i === i) { var gone = sel.ids.slice(); clearSel(); drop(i, gone); }
          else drop(i, arr.map(function (st) { return st.s; }));
        } else if (a === "undo") {
          clearSel();
          for (var k = arr.length - 1; k >= 0; k--) if (arr[k].e && !TOOLS[arr[k].tl].laser) { drop(i, [arr[k].s]); break; }
        }
        paint(); b.blur();
      });
      paint();

      function inUi(t) { return bar.contains(t) || (ui.pill && ui.pill.contains(t)) || (ui.panel && ui.panel.contains(t)); }
      function busy() { return !!act || Date.now() - penEnd < 450; }                 /* drawing, or just lifted the pen */
      function penAround() { return busy() || Date.now() - penNear < 350; }          /* ...or the pen is hovering: fingers are a resting hand */
      function swallow(e) { if (e.cancelable) e.preventDefault(); e.stopImmediatePropagation(); }
      function pt(e, r) {
        return [Math.round(clamp((e.clientX - r.left) / r.width, 0, 1) * VB_W), Math.round(clamp((e.clientY - r.top) / r.height, 0, 1) * H),
          Math.round(clamp(e.pressure > 0 ? e.pressure : 0.5, 0.02, 1) * 100)];
      }
      function draws(e) { return e.pointerType === "pen" || (cfg.finger && e.isPrimary && (e.pointerType !== "mouse" || e.button === 0)); }

      function flush(end) {
        var a = act; if (!a || !a.st) return;
        clearTimeout(a.ft); a.ft = null;
        var st = a.st, n = st.p.length / 3;
        if (n > a.sent || end) { send(inkMsg({ o: "p", s: st.s, i: a.i, tl: st.tl, w: st.w, pr: st.pr, a: a.sent, p: st.p.slice(a.sent * 3), e: end ? 1 : 0 })); a.sent = n; }
      }
      function addPoint(p, force) {
        var st = act.st, n = st.p.length;
        if (!force && n >= 3) { var dx = p[0] - st.p[n - 3], dy = p[1] - st.p[n - 2]; if (dx * dx + dy * dy < 100) return; }
        st.p.push(p[0], p[1], p[2]);
        if (!act.raf) act.raf = requestAnimationFrame(function () { if (act && act.st === st) { act.raf = 0; draw(st); } });
        if (!act.ft) act.ft = setTimeout(function () { flush(false); }, FLUSH_MS);
      }
      function segDist2(px, py, ax, ay, bx, by) {
        var dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy, t = l ? clamp(((px - ax) * dx + (py - ay) * dy) / l, 0, 1) : 0;
        var x = ax + t * dx - px, y = ay + t * dy - py; return x * x + y * y;
      }
      function eraseAt(p) {
        var hit = [];
        (ink[act.i] || []).forEach(function (st) {
          if (TOOLS[st.tl].laser) return;
          var q = triples(st.p, 0), R = 130 + st.w / 2, x = p[0] - st.o[0], y = p[1] - st.o[1];
          for (var k = 0; k < q.length; k++) {
            var b = q[k + 1] || q[k];
            if (segDist2(x, y, q[k][0], q[k][1], b[0], b[1]) < R * R) { hit.push(st.s); return; }
          }
        });
        drop(act.i, hit);
      }

      /* --- select (rectangle or lasso) and move. The outline and the box are only drawn here, never sent. --- */
      function svgEl(tag, i) { var e = document.createElementNS(NS, tag); e.setAttribute("class", "sl-sel"); layer(i).appendChild(e); return e; }
      function clearSel() { if (sel) { if (sel.el && sel.el.parentNode) sel.el.parentNode.removeChild(sel.el); sel = null; } }
      function boxOf(i, ids) {
        var x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, pad = 0;
        ids.forEach(function (id) {
          var st = find(i, id); if (!st) return; pad = Math.max(pad, st.w);
          triples(st.p, 0).forEach(function (q) { var x = q[0] + st.o[0], y = q[1] + st.o[1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; });
        });
        pad = pad / 2 + 70; return [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
      }
      function showSel() {
        if (!sel) return;
        sel.ids = sel.ids.filter(function (id) { return find(sel.i, id); });
        if (!sel.ids.length) { clearSel(); return; }
        sel.box = boxOf(sel.i, sel.ids);
        if (!sel.el) sel.el = svgEl("rect", sel.i);
        sel.el.setAttribute("x", sel.box[0]); sel.el.setAttribute("y", sel.box[1]);
        sel.el.setAttribute("width", sel.box[2] - sel.box[0]); sel.el.setAttribute("height", sel.box[3] - sel.box[1]);
      }
      function inPoly(q, x, y) {       /* q = [x0, y0, x1, y1, ...] */
        var inside = false;
        for (var a = 0, b = q.length - 2; a < q.length; b = a, a += 2)
          if ((q[a + 1] > y) !== (q[b + 1] > y) && x < (q[b] - q[a]) * (y - q[a + 1]) / (q[b + 1] - q[a + 1]) + q[a]) inside = !inside;
        return inside;
      }
      function startSelect(p) {
        var a = act;
        if (sel && sel.i === a.i && p[0] >= sel.box[0] && p[0] <= sel.box[2] && p[1] >= sel.box[1] && p[1] <= sel.box[3]) {
          a.mode = "move"; a.from = p;
          a.base = sel.ids.map(function (id) { var st = find(a.i, id); return [st, st.o[0], st.o[1]]; });
        } else {
          clearSel(); a.mode = "shape"; a.q = [p[0], p[1]];
          a.shape = svgEl(cfg.tool === "s" ? "rect" : "polygon", a.i);
        }
      }
      function sendMove() {
        var a = act; clearTimeout(a.mt); a.mt = null;
        send(inkMsg({ o: "m", i: a.i, n: a.n, mv: a.base.map(function (b) { return [b[0].s, b[0].o[0], b[0].o[1]]; }) }));
      }
      function moveSelect(p) {
        var a = act;
        if (a.mode === "move") {
          var dx = p[0] - a.from[0], dy = p[1] - a.from[1];
          a.n = moveSeq = Math.max(moveSeq + 1, Date.now());
          a.base.forEach(function (b) { b[0].o = [b[1] + dx, b[2] + dy]; b[0].on = a.n; place(b[0]); });
          showSel();
          if (!a.mt) a.mt = setTimeout(sendMove, FLUSH_MS);
        } else if (a.shape.tagName === "rect") {
          a.q[2] = p[0]; a.q[3] = p[1];
          a.shape.setAttribute("x", Math.min(a.q[0], p[0])); a.shape.setAttribute("y", Math.min(a.q[1], p[1]));
          a.shape.setAttribute("width", Math.abs(p[0] - a.q[0])); a.shape.setAttribute("height", Math.abs(p[1] - a.q[1]));
        } else { a.q.push(p[0], p[1]); a.shape.setAttribute("points", a.q.join(" ")); }
      }
      function endSelect() {
        var a = act;
        if (a.mode === "move") { if (a.n) { sendMove(); persist(); } return; }
        if (a.shape.parentNode) a.shape.parentNode.removeChild(a.shape);
        var q = a.q, rect = a.shape.tagName === "rect";
        if (q.length < 4) return;
        if (rect) q = [Math.min(q[0], q[2]), Math.min(q[1], q[3]), Math.max(q[0], q[2]), Math.max(q[1], q[3])];
        var ids = (ink[a.i] || []).filter(function (st) {      /* a stroke is picked when at least half of it is inside */
          if (!st.e || TOOLS[st.tl].laser) return false;
          var pts = triples(st.p, 0), inside = 0;
          pts.forEach(function (c) { var x = c[0] + st.o[0], y = c[1] + st.o[1]; if (rect ? (x >= q[0] && x <= q[2] && y >= q[1] && y <= q[3]) : inPoly(q, x, y)) inside++; });
          return pts.length && inside * 2 >= pts.length;
        }).map(function (st) { return st.s; });
        if (ids.length) { sel = { i: a.i, ids: ids, el: null, box: null }; showSel(); }
      }
      onSlide = clearSel;
      onInk = function () { if (sel && !(act && act.mode === "move")) showSel(); };

      function finish(e) {
        if (!act || e.pointerId !== act.id) return;
        swallow(e);
        var st = act.st;
        if (act.mode) endSelect();
        else if (st) { if (act.raf) cancelAnimationFrame(act.raf); st.e = true; draw(st); flush(true); if (TOOLS[st.tl].laser) fade(st); else persist(); }
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
        act = { id: e.pointerId, r: r, i: i, sent: 0, st: null, ft: null, raf: 0, mode: null };
        for (var id in touches) palm[id] = 1;            /* a hand already resting on the glass is a palm */
        var p = pt(e, r), tool = cfg.tool, t = TOOLS[tool];
        if (tool === "x") eraseAt(p);
        else if (tool === "s" || tool === "q") startSelect(p);
        else {
          act.st = { s: me + "-" + rid(6), i: i, tl: tool, p: [], e: false, o: [0, 0], on: 0,
            w: t.laser ? 56 : SIZES[cfg.si] * (t.highlighter ? 9 : 1),
            pr: t.laser || t.highlighter || !cfg.pr ? 0 : (e.pointerType === "pen" ? 1 : 2) };   /* 1 = real pressure, 2 = simulated from speed */
          (ink[i] || (ink[i] = [])).push(act.st); addPoint(p, true);
        }
      }, true);
      document.addEventListener("pointermove", function (e) {
        if (e.pointerType === "pen") penNear = Date.now();
        if (!act || e.pointerId !== act.id) return;
        swallow(e);
        var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null; if (!evs || !evs.length) evs = [e];
        for (var k = 0; k < evs.length; k++) { var p = pt(evs[k], act.r); if (act.mode) moveSelect(p); else if (act.st) addPoint(p, false); else eraseAt(p); }
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
      if (other.v !== PROTO) return ["warn", "Reload the other page"];
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
        ui.pill.addEventListener("click", function () { ui.pill.blur(); togglePanel(); });
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
        relays.forEach(function (r) { if (r.stale(9000)) r.kick(); });
        if (anyUp() || bc) send(stateMsg("hb"));
      }, HB_MS);
      function kick() { relays.forEach(function (r) { r.probe(); }); }
      global.addEventListener("online", kick);
      document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") { kick(); if (joined) send(stateMsg("hb")); } });
      refresh();
    }).catch(function (e) { fatal = "Sync error"; refresh(); if (global.console) console.warn("SlideLink", e); });

    return global.SlideLink.link = { moved: moved, pause: setPaused, status: function () { return status()[1]; }, state: function () { return { room: !!room, topic: topic, joined: joined, slide: state.i, relays: relays.map(function (r) { return { name: r.name, up: r.up, connects: r.connects }; }), rtt: rtt, ink: ink }; } };
  }

  global.SlideLink = { version: "1.0", start: start };
})(window);
