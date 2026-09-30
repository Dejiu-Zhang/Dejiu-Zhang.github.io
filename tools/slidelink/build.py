#!/usr/bin/env python3
"""Wire slidelink.js into a projector deck and its presenter view.

Usage: build.py DECK.html PRESENTER.html OUT_DIR --deck-id some-id
Works on the two-file layout used here (deck: .slide-wrap / body.projector; presenter: #stage .pv-slide).
"""
import argparse, pathlib, re, sys

HERE = pathlib.Path(__file__).parent


def once(s, old, new, what):
    if s.count(old) != 1:
        sys.exit(f"cannot patch {what}: expected exactly one match, found {s.count(old)}")
    return s.replace(old, new)


def noindex(html, what):
    """Ask search engines not to index the page (talk pages live at unlisted addresses)."""
    if re.search(r'<meta[^>]+name="robots"', html, flags=re.I):
        return html
    out, n = re.subn(r'(<meta\s+charset="?utf-8"?\s*/?>)', r'\1<meta name="robots" content="noindex, nofollow">', html, count=1, flags=re.I)
    if n != 1:
        sys.exit(f'cannot patch {what}: no <meta charset> tag found')
    return out


def inject(html, role, deck_id, module):
    start = ('<script>\n/* SlideLink: page + pen sync. Open with ?room=YOUR-CODE on both devices. */\n'
             + module + '\n</script>\n<script>\nSlideLink.start({ role: "%s", deck: "%s", aspect: 1200 / 675, host: window.SlideHost });\n</script>\n'
             % (role, deck_id))
    return once(html, '</body>', start + '</body>', '</body>')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('deck'); ap.add_argument('presenter'); ap.add_argument('out')
    ap.add_argument('--deck-id', required=True)
    a = ap.parse_args()
    module = (HERE / 'slidelink.js').read_text(encoding='utf-8')
    if '</script' in module.lower():
        sys.exit('module must not contain a closing script tag')
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)

    # ---- projector deck ----
    d = pathlib.Path(a.deck).read_text(encoding='utf-8')
    d = once(d, '''    var live = document.getElementById("live");
    if (live) live.textContent = "Slide " + (current + 1) + " of " + wraps.length;
  }''', '''    var live = document.getElementById("live");
    if (live) live.textContent = "Slide " + (current + 1) + " of " + wraps.length;
    if (window.SlideHost && window.SlideHost.onmove) window.SlideHost.onmove();
  }''', 'deck show()')
    d = once(d, '''  layout();
  var h = location.hash.replace(/^#/, "");''', '''  window.SlideHost = {
    count: wraps.length,
    index: function () { return current; },
    show: function (i) { show(i); },
    slideEl: function (i) { return slides[i] || null; }
  };

  layout();
  var h = location.hash.replace(/^#/, "");''', 'deck init')
    d = noindex(d, 'deck')
    d = inject(d, 'screen', a.deck_id, module)
    (out / pathlib.Path(a.deck).name).write_text(d, encoding='utf-8')

    # ---- presenter view ----
    p = pathlib.Path(a.presenter).read_text(encoding='utf-8')
    p = once(p, '''    try { history.replaceState(null, '', '#' + (cur + 1)); } catch (e) {}
    fit();
  }''', '''    try { history.replaceState(null, '', '#' + (cur + 1)); } catch (e) {}
    fit();
    if (window.SlideHost && window.SlideHost.onmove) window.SlideHost.onmove();
  }''', 'presenter show()')
    p = once(p, '''  onResize(); show(cur);
})();''', '''  window.SlideHost = {
    count: N,
    index: () => cur,
    show: (i) => show(i),
    slideEl: (i) => (slidesEl[i] ? slidesEl[i].querySelector('.slide') : null),
    surface: stage
  };
  onResize(); show(cur);
})();''', 'presenter init')
    p = noindex(p, 'presenter')
    p = inject(p, 'presenter', a.deck_id, module)
    (out / pathlib.Path(a.presenter).name).write_text(p, encoding='utf-8')
    print('wrote', *(str(x) for x in sorted(out.glob('*.html'))))


if __name__ == '__main__':
    main()
