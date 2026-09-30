# SlideLink

Control and annotate projected HTML slides from an iPad.

- The laptop opens the **deck** (the page on the projector).
- The iPad opens the **presenter view** (slide on the left, script on the right).
- Turning a page on either device turns it on the other.
- Apple Pencil strokes on the iPad appear on the projector. Finger taps and swipes still turn pages.

Nothing to install and no account. The two pages talk through public MQTT-over-WebSocket relays
(EMQX, HiveMQ, shiftr.io, all three at once). Every message is encrypted with a key derived from
the room code, so only devices that know the code can read or move anything.

## Use

Open both pages with the same room code, once per device. The code is then remembered on that device.

    laptop  https://dejiu-zhang.github.io/x/<random>/slides.html?room=CODE#present
    iPad    https://dejiu-zhang.github.io/x/<random>/presenter.html?room=CODE

Without a room code the pages are plain slides and do not sync.

Talks are kept at unlisted addresses: a random folder under `site/x/`, no link from the homepage,
and both pages ask search engines not to index them. The repository is public, so the folder name
can still be found by someone who browses the repository itself.

On the iPad:

| Control | What it does |
| --- | --- |
| Pencil on the slide | draws with the selected tool |
| Finger tap left / right, swipe | previous / next page |
| Colour dots, yellow bar | pens, highlighter |
| Red dot with halo | laser pointer (fades after you lift) |
| Erase / Undo / Clear | remove a stroke by touching it / remove the last stroke / wipe this slide |
| Finger | let a finger (or mouse) draw too |
| Status pill, top left | green: projector linked, with the delay. Amber: projector not there or on another slide. Red: offline. Tap it for details, the room code, and **Pause sync** (look ahead in private) |

On the laptop everything works as before (arrow keys, click, F, P, Esc). Press `L` for the same status panel.
If the network drops, the laptop keyboard still turns pages, and both sides catch up when it returns.

## Add it to a new deck

For the two-file layout used here (`*-reading-group.html` deck and `*-presenter.html` presenter view):

    python3 build.py DECK.html PRESENTER.html OUT_DIR --deck-id some-unique-id

For any other deck, paste `slidelink.js` in a `<script>` at the end of both pages and give it a host object:

```html
<script>
SlideLink.start({
  role: "presenter",            // "screen" on the projector page
  deck: "some-unique-id",       // the same string in both pages
  aspect: 16 / 9,               // slide width / height
  host: {
    count: 51,                  // number of slides
    index: () => current,       // current slide, 0-based
    show: (i) => goTo(i),       // jump to slide i
    slideEl: (i) => slideNodes[i],   // element that is exactly the slide area (position: relative)
    surface: stageNode          // presenter only: element that receives pen input
  }
});
</script>
```

and call `host.onmove()` at the end of the deck's own "go to slide" function. Slides must scale as a
whole (fixed design size plus CSS transform), not reflow, or ink will not line up.

## Limits

- Public relays come with no guarantee. Three are used in parallel so one failing does not matter.
  To use your own, add `?sl_relays=wss://host:port/path` or pass `relays` to `SlideLink.start`.
- Ink lives in the presenter tab. It survives a reload of that tab, not closing it.
- Both pages must show the same deck (same slide count and order).
