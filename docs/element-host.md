# Embedding the player

Build with `pnpm build`, then serve `dist/`. The plain HTML host example is at `/element-host.html`; it loads `/mystira-player.js`. The element bundle includes React and its shadow styles, so the host does not load the generated CSS file. React hosts can also import the `Player` export from `src/element/index.ts` in this source repository.

```html
<script type="module" src="/mystira-player.js"></script>
<mystira-player theme="mystira-light" music="host" locale="en" notes="off">
  <div slot="end-cta">Host end action</div>
</mystira-player>
<script type="module">
  const player = document.querySelector('mystira-player');
  player.engine = hostEngine; // Implements startSession, resumeSession and respond.
  player.addEventListener('mp-node-enter', ({ detail }) => updateHostChrome(detail));
  player.start({ activityId: 'story', players: [{ type: 'Profile', profileId: 'selected-profile' }] });
</script>
```

The host supplies the authorized `Engine`, calls `start(request)` after an appropriate user gesture, or calls `resume(sessionId)` with its existing session. `muted` is a Boolean property. `notes="on"` means the host has authorized grown-up notes. The element owns only its scene surface; the host owns authentication, session persistence, page chrome, navigation, awards, music and telemetry. A removed element aborts requests and stops its media; the host should call `resume` after remount.

The element emits bubbling, composed `mp-ready`, `mp-node-enter`, `mp-answer`, `mp-complete` and `mp-error` events. `mp-answer` contains the answer **kind** only, never values or participant identity. Treat `mp-complete` as a notification and read authoritative completion and awards from the host session; repeated completion after Back is possible. The current element supports host-owned music (`music="host"`) and English UI chrome (`locale="en"`). Self-owned music, locale packs, typed unsupported-node details and the Blazor bridge remain in later integration work.

The four built-in themes are `manor`, `mystira-light`, `mystira-dark` and `mystira-bright`. The host can override `--mp-bg`, `--mp-surface`, `--mp-text`, `--mp-muted`, `--mp-accent`, `--mp-overlay`, `--mp-radius` and `--mp-glow` on the element. Size the element in host CSS. The player does not change the host URL or install global event listeners.

For the legacy Blazor story bridge and host-owned roll protocol, see [Blazor interop](./blazor-interop.md). Roll is an opt-in host capability; the bundled local demo does not author or resolve rolls.
