// scene.jsx — CATalyst motion graphic
// Cursor enters → hovers option A → clicks (with click sound) →
// option turns red & shakes → tension sting + "You got this wrong" reveal.

const { useEffect, useRef, useState } = React;

// ─── Audio engine ──────────────────────────────────────────────────────────
// Synthesizes click + tension sting in WebAudio. No external assets.
// Triggered by the playhead crossing specific timestamps.

const AudioFX = (() => {
  let ctx = null;
  let masterGain = null;
  let droneStarted = false;
  let droneNodes = null;

  function ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.9;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // Sharp mouse-click — a snappy noise burst with a low-frequency body thump.
  function click() {
    const ac = ensure();
    const now = ac.currentTime;

    // High-frequency noise tick
    const bufSize = Math.floor(ac.sampleRate * 0.06);
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      // Decaying white noise
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufSize, 3);
    }
    const src = ac.createBufferSource();
    src.buffer = buf;
    const hp = ac.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1800;
    const g = ac.createGain();
    g.gain.setValueAtTime(0.6, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    src.connect(hp).connect(g).connect(masterGain);
    src.start(now);
    src.stop(now + 0.08);

    // Low body thump for tactile feel
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
    const og = ac.createGain();
    og.gain.setValueAtTime(0.5, now);
    og.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(og).connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Tension sting — descending low drone with a high cinematic "stab".
  function tension() {
    const ac = ensure();
    const now = ac.currentTime;

    // Low descending drone
    const drone = ac.createOscillator();
    drone.type = "sawtooth";
    drone.frequency.setValueAtTime(110, now);
    drone.frequency.exponentialRampToValueAtTime(55, now + 1.8);
    const droneFilter = ac.createBiquadFilter();
    droneFilter.type = "lowpass";
    droneFilter.frequency.setValueAtTime(800, now);
    droneFilter.frequency.exponentialRampToValueAtTime(200, now + 1.8);
    const dg = ac.createGain();
    dg.gain.setValueAtTime(0.0001, now);
    dg.gain.exponentialRampToValueAtTime(0.18, now + 0.04);
    dg.gain.setValueAtTime(0.18, now + 0.8);
    dg.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
    drone.connect(droneFilter).connect(dg).connect(masterGain);
    drone.start(now);
    drone.stop(now + 2.3);

    // High cinematic stab — quick metallic blast
    const stab = ac.createOscillator();
    stab.type = "square";
    stab.frequency.setValueAtTime(880, now);
    stab.frequency.exponentialRampToValueAtTime(220, now + 0.5);
    const stabFilter = ac.createBiquadFilter();
    stabFilter.type = "bandpass";
    stabFilter.frequency.value = 1200;
    stabFilter.Q.value = 4;
    const sg = ac.createGain();
    sg.gain.setValueAtTime(0.0001, now);
    sg.gain.linearRampToValueAtTime(0.22, now + 0.01);
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    stab.connect(stabFilter).connect(sg).connect(masterGain);
    stab.start(now);
    stab.stop(now + 0.65);

    // Noise riser layer for tension
    const bufSize = Math.floor(ac.sampleRate * 0.7);
    const buf = ac.createBuffer(1, bufSize, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (i / bufSize);
    }
    const nsrc = ac.createBufferSource();
    nsrc.buffer = buf;
    const nFilt = ac.createBiquadFilter();
    nFilt.type = "highpass";
    nFilt.frequency.value = 3000;
    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0001, now);
    ng.gain.linearRampToValueAtTime(0.12, now + 0.5);
    ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
    nsrc.connect(nFilt).connect(ng).connect(masterGain);
    nsrc.start(now);
    nsrc.stop(now + 0.85);
  }

  // Subtle anticipatory hum that runs while the cursor approaches.
  function startApproachDrone() {
    const ac = ensure();
    if (droneStarted) return;
    droneStarted = true;
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 55;
    const osc2 = ac.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = 55.5; // beating
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.08, now + 1.2);
    osc.connect(g);
    osc2.connect(g);
    g.connect(masterGain);
    osc.start(now);
    osc2.start(now);
    droneNodes = { osc, osc2, g };
  }
  function stopApproachDrone() {
    if (!droneStarted || !droneNodes) return;
    const ac = ensure();
    const now = ac.currentTime;
    droneNodes.g.gain.cancelScheduledValues(now);
    droneNodes.g.gain.setValueAtTime(droneNodes.g.gain.value, now);
    droneNodes.g.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    droneNodes.osc.stop(now + 0.35);
    droneNodes.osc2.stop(now + 0.35);
    droneStarted = false;
    droneNodes = null;
  }

  function reset() {
    stopApproachDrone();
  }

  return { ensure, click, tension, startApproachDrone, stopApproachDrone, reset };
})();

// ─── Trigger scheduler ─────────────────────────────────────────────────────
// Fires audio cues exactly once as the playhead crosses each timestamp.

function useAudioCues(time, enabled, cues) {
  const lastTimeRef = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    const last = lastTimeRef.current;
    const now = time;
    cues.forEach((cue) => {
      // Forward play across the cue point
      if (last < cue.t && now >= cue.t && now - cue.t < 0.5) {
        cue.fire();
      }
    });
    // If user scrubs backwards, reset drone state
    if (now < last - 0.1) {
      AudioFX.reset();
    }
    lastTimeRef.current = now;
  }, [time, enabled]);
}

// ─── Timeline constants ────────────────────────────────────────────────────
const T = {
  cardIn:        0.0,
  approachStart: 0.8,
  hoverArrive:   2.1,
  click:         2.5,   // <-- click sound
  flashStart:    2.55,
  shakeEnd:      3.0,
  wrongBadgeIn:  2.9,
  tensionPeak:   2.55,  // <-- tension sting
  hold:          5.5,
  end:           7.0,
};

// ─── The scene ─────────────────────────────────────────────────────────────

function Scene({ audioOn }) {
  const t = useTime();

  // Audio cues
  useAudioCues(t, audioOn, [
    { t: T.approachStart, fire: () => AudioFX.startApproachDrone() },
    { t: T.click,         fire: () => AudioFX.click() },
    { t: T.tensionPeak,   fire: () => { AudioFX.tension(); AudioFX.stopApproachDrone(); } },
  ]);

  // ── Card entrance ──
  const cardP = clamp((t - T.cardIn) / 0.55, 0, 1);
  const cardEase = Easing.easeOutCubic(cardP);
  const cardOpacity = cardEase;
  const cardY = (1 - cardEase) * 18;

  // ── Cursor path (in card-local coords: card is 880w × 560h, centered) ──
  // Path: from top-right offscreen → curves into option A (top option).
  // Option A center sits at roughly (240, 305) within the card.
  const ap = clamp((t - T.approachStart) / (T.hoverArrive - T.approachStart), 0, 1);
  const apEase = Easing.easeInOutCubic(ap);

  // Bezier-ish path via two interpolations
  const startX = 900, startY = -40;
  const midX = 620, midY = 180;
  const endX = 360, endY = 332;
  // Quadratic bezier
  const bz = (p, a, b, c) => (1 - p) * (1 - p) * a + 2 * (1 - p) * p * b + p * p * c;
  let cx = bz(apEase, startX, midX, endX);
  let cy = bz(apEase, startY, midY, endY);

  // Click squish on cursor
  const clickP = clamp((t - (T.click - 0.08)) / 0.16, 0, 1);
  // Brief scale down then back up
  const clickScale = clickP < 0.5
    ? 1 - clickP * 0.5
    : 0.75 + (clickP - 0.5) * 0.5;
  const cursorScale = ap >= 1 ? clickScale : 1;

  // Cursor opacity (fade in at start, hide at end)
  const cursorOpacity = clamp((t - T.approachStart) / 0.3, 0, 1)
    * (1 - clamp((t - T.hold) / 0.5, 0, 1));

  // ── Click ripple ──
  const rippleP = clamp((t - T.click) / 0.55, 0, 1);
  const rippleScale = 0.4 + rippleP * 2.2;
  const rippleOpacity = (1 - rippleP) * 0.7;
  const rippleVisible = t >= T.click && t <= T.click + 0.6;

  // ── Wrong state on option A ──
  const flashP = clamp((t - T.flashStart) / 0.15, 0, 1);
  // After flash starts, the option is "wrong"
  const isWrong = t >= T.flashStart;

  // Shake offset on the option (only briefly after click)
  const shakeP = clamp((t - T.flashStart) / 0.35, 0, 1);
  let shakeX = 0;
  if (shakeP > 0 && shakeP < 1) {
    // 4 oscillations, decaying
    shakeX = Math.sin(shakeP * Math.PI * 5) * (1 - shakeP) * 10;
  }

  // ── Card red-glow tension throb (after click) ──
  const tensionP = clamp((t - T.flashStart) / 0.6, 0, 1);
  const throb = t >= T.flashStart
    ? 0.5 + 0.5 * Math.sin((t - T.flashStart) * 2.5)
    : 0;
  const cardGlowOpacity = tensionP * (0.4 + throb * 0.5);

  // ── "You got this wrong" badge ──
  const badgeP = clamp((t - T.wrongBadgeIn) / 0.4, 0, 1);
  const badgeEase = Easing.easeOutBack(badgeP);
  const badgeY = (1 - badgeEase) * 24;
  const badgeOpacity = badgeP;

  // ── Vignette darkening for tension ──
  const vignetteOpacity = clamp((t - T.flashStart) / 0.5, 0, 1) * 0.55;

  // Camera punch-in on click
  const punch = (() => {
    const p = clamp((t - T.click) / 0.4, 0, 1);
    // jump up then settle back
    if (p < 0.3) return 1 + (p / 0.3) * 0.025;
    return 1.025 - ((p - 0.3) / 0.7) * 0.015;
  })();

  return (
    <div style={{
      position: "absolute", inset: 0, background: "var(--bg-0)",
      overflow: "hidden", fontFamily: "var(--font-body)",
    }}>
      {/* Ambient backdrop noise — very subtle */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 50% 45%, rgba(244,76,96,0.06), transparent 60%)",
        opacity: clamp((t - T.flashStart) / 0.5, 0, 1),
        transition: "none",
      }} />

      {/* Camera wrapper — slight punch-in */}
      <div style={{
        position: "absolute", inset: 0,
        transform: `scale(${punch})`,
        transformOrigin: "50% 50%",
      }}>
        {/* Card */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: 880, height: 560,
          transform: `translate(-50%, calc(-50% + ${cardY}px))`,
          opacity: cardOpacity,
          background: "var(--bg-2)",
          border: `1px solid ${t >= T.flashStart ? "var(--cat-red-border)" : "var(--line-2)"}`,
          borderRadius: "var(--radius-lg)",
          boxShadow: `var(--shadow-lg), 0 0 80px 0 rgba(244,76,96,${cardGlowOpacity * 0.4})`,
          padding: "32px 36px",
          boxSizing: "border-box",
        }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Chip mono>Q 1 / 25</Chip>
            <Chip color="blue">VARC</Chip>
            <Chip color="blue">VA</Chip>
            <Chip color="amber">MEDIUM</Chip>
            <div style={{ flex: 1 }} />
            <span style={{
              fontFamily: "var(--font-mono)", color: "var(--fg-2)",
              fontSize: 16, letterSpacing: "0.04em",
            }}>0:29</span>
          </div>

          {/* Question stem */}
          <div style={{
            color: "var(--fg-2)", fontSize: 17, lineHeight: 1.5,
            marginBottom: 28, maxWidth: 760,
          }}>
            Arrange the sentences B, C, D and E in the logical order to form a
            coherent paragraph. Choose the most appropriate option below.
          </div>

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Option
              letter="A"
              text="CBDE"
              wrong={isWrong}
              flashP={flashP}
              shakeX={shakeX}
              cursorHovering={ap >= 0.85 && t < T.flashStart}
            />
            <Option letter="B" text="BCDE" muted={t >= T.flashStart} />
            <Option letter="C" text="CBED" muted={t >= T.flashStart} />
            <Option letter="D" text="DBCE" muted={t >= T.flashStart} />
          </div>

          {/* Wrong banner — slides up from bottom of card */}
          {badgeP > 0 && (
            <div style={{
              position: "absolute",
              left: 36, right: 36, bottom: 32,
              padding: "14px 18px",
              background: "var(--cat-red-bg)",
              border: "1px solid var(--cat-red-border)",
              borderRadius: "var(--radius-md)",
              opacity: badgeOpacity,
              transform: `translateY(${badgeY}px)`,
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 800,
                fontSize: 26,
                color: "var(--cat-red)",
                letterSpacing: "-0.01em",
                lineHeight: 1,
              }}>✕ You got this wrong!</span>
              <span style={{
                color: "var(--cat-amber)",
                fontSize: 14, fontWeight: 600,
                marginLeft: 8,
              }}>This is costing you marks.</span>
            </div>
          )}
        </div>

        {/* Click ripple — positioned at option A's row */}
        {rippleVisible && (
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            // Card center → top-left of card, then to option A
            transform: `translate(-50%, calc(-50% + ${cardY}px))`,
            width: 880, height: 560,
            pointerEvents: "none",
          }}>
            <div style={{
              position: "absolute",
              left: endX, top: endY,
              width: 16, height: 16,
              marginLeft: -8, marginTop: -8,
              borderRadius: "50%",
              border: "2px solid var(--cat-red)",
              transform: `scale(${rippleScale})`,
              opacity: rippleOpacity,
            }} />
            <div style={{
              position: "absolute",
              left: endX, top: endY,
              width: 16, height: 16,
              marginLeft: -8, marginTop: -8,
              borderRadius: "50%",
              border: "2px solid var(--cat-red)",
              transform: `scale(${rippleScale * 0.5})`,
              opacity: rippleOpacity * 0.8,
            }} />
          </div>
        )}

        {/* Cursor — also positioned relative to card */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          transform: `translate(-50%, calc(-50% + ${cardY}px))`,
          width: 880, height: 560,
          pointerEvents: "none",
        }}>
          <Cursor x={cx} y={cy} scale={cursorScale} opacity={cursorOpacity} />
        </div>

        {/* Vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.85) 100%)",
          opacity: vignetteOpacity,
          pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}

// ─── Components ────────────────────────────────────────────────────────────

function Chip({ children, color, mono }) {
  const colorMap = {
    blue:  { bg: "var(--cat-blue-bg)",  fg: "var(--cat-blue)",  bd: "var(--cat-blue-border)" },
    amber: { bg: "var(--cat-amber-bg)", fg: "var(--cat-amber)", bd: "var(--cat-amber-border)" },
  };
  const c = colorMap[color];
  return (
    <span style={{
      padding: mono ? "6px 12px" : "6px 12px",
      borderRadius: "var(--radius-pill)",
      background: c ? c.bg : "var(--bg-3)",
      border: c ? `1px solid ${c.bd}` : "1px solid var(--line-2)",
      color: c ? c.fg : "var(--fg-2)",
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: "0.06em",
      fontFamily: mono ? "var(--font-mono)" : "var(--font-body)",
      textTransform: mono ? "none" : "uppercase",
      whiteSpace: "nowrap",
      lineHeight: 1,
      display: "inline-block",
    }}>{children}</span>
  );
}

function Option({ letter, text, wrong, flashP = 0, shakeX = 0, cursorHovering, muted }) {
  // Wrong state colors
  const bg = wrong ? "var(--cat-red-bg)" : "var(--bg-3)";
  const border = wrong ? "var(--cat-red-border)" : (cursorHovering ? "var(--cat-blue-border)" : "var(--line-2)");

  // Flash overlay — bright red wash at moment of click that fades
  const flashOverlay = wrong ? Math.max(0, 1 - flashP * 1.5) * 0.4 + 0.1 : 0;

  // Muted state for non-clicked options after click
  const opacity = muted ? 0.45 : 1;

  // Letter badge
  const letterBg = wrong ? "var(--cat-red)" : "var(--bg-4)";
  const letterColor = wrong ? "#fff" : "var(--fg-2)";

  return (
    <div style={{
      position: "relative",
      display: "flex", alignItems: "center", gap: 16,
      padding: "16px 20px",
      borderRadius: "var(--radius-md)",
      background: bg,
      border: `1.5px solid ${border}`,
      transform: `translateX(${shakeX}px)`,
      opacity,
      boxShadow: wrong
        ? `0 0 0 1px var(--cat-red-border), 0 0 32px -4px rgba(244,76,96,${0.6 - flashP * 0.4})`
        : (cursorHovering ? "var(--glow-blue)" : "none"),
    }}>
      {/* Bright flash overlay at moment of click */}
      {wrong && flashOverlay > 0 && (
        <div style={{
          position: "absolute", inset: 0,
          background: "var(--cat-red)",
          borderRadius: "var(--radius-md)",
          opacity: flashOverlay,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }} />
      )}
      <span style={{
        width: 36, height: 36,
        borderRadius: "var(--radius-sm)",
        background: letterBg,
        color: letterColor,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontWeight: 700, fontSize: 16,
        flexShrink: 0,
      }}>{letter}</span>
      <span style={{
        flex: 1,
        color: wrong ? "var(--cat-red-soft)" : "var(--fg-1)",
        fontSize: 18,
        fontWeight: 500,
        letterSpacing: "0.04em",
        fontFamily: "var(--font-mono)",
      }}>{text}</span>
      {wrong && (
        <span style={{
          color: "var(--cat-red)",
          fontSize: 13,
          fontWeight: 600,
          textTransform: "lowercase",
          opacity: clamp(flashP, 0, 1),
        }}>your answer</span>
      )}
    </div>
  );
}

function Cursor({ x, y, scale, opacity }) {
  return (
    <svg
      width="32" height="38"
      viewBox="0 0 32 38"
      style={{
        position: "absolute",
        left: x, top: y,
        transform: `scale(${scale})`,
        transformOrigin: "4px 4px",
        opacity,
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
        pointerEvents: "none",
      }}
    >
      <path
        d="M2 2 L2 26 L8 21 L12 30 L16 28 L12 19 L20 19 Z"
        fill="#fff"
        stroke="#000"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Root with audio-unlock overlay ────────────────────────────────────────

function App() {
  const [audioOn, setAudioOn] = useState(false);
  const [started, setStarted] = useState(false);

  const start = () => {
    AudioFX.ensure();
    setAudioOn(true);
    setStarted(true);
  };

  return (
    <>
      <Stage width={1280} height={720} duration={T.end} background="var(--bg-0)" loop>
        <Scene audioOn={audioOn} />
      </Stage>

      {!started && (
        <div
          onClick={start}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(7,7,12,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            zIndex: 1000,
            fontFamily: "var(--font-body)",
          }}
        >
          <div style={{
            textAlign: "center",
            padding: "40px 48px",
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "var(--shadow-lg)",
            maxWidth: 480,
          }}>
            <div style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontWeight: 800,
              fontSize: 36,
              color: "var(--fg-1)",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              marginBottom: 14,
            }}>
              Press play <span style={{ color: "var(--cat-red)" }}>with sound</span>
            </div>
            <div style={{ color: "var(--fg-3)", fontSize: 14, marginBottom: 24 }}>
              Browsers block audio until you tap. Click anywhere to start.
            </div>
            <button style={{
              padding: "14px 28px",
              background: "var(--cat-red)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-body)",
              fontWeight: 700,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "var(--glow-red)",
            }}>▶ Start with sound →</button>
          </div>
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
