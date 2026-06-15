// CATalyst UI Kit — screen components

const { useState: useStateS, useEffect: useEffectS } = React;

// ----------- Dashboard -----------
function Dashboard({ stats, onStartPractice, onFixNow }) {
  return (
    <div className="fade-in">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Good morning, Sahil Solankey! Keep pushing 💪</p>

      <div className="hero-mistakes">
        <div className="left">
          <div className="flame">🔥</div>
          <div className="headline">
            You still have <span className="num">{stats.pending} mistakes</span> to fix
          </div>
          <div className="detail">{stats.conceptGapCount} are Concept Gap — the most damaging type</div>
        </div>
        <button className="btn-fix-now" onClick={onFixNow}>Fix Now →</button>
      </div>

      <div className="dash-grid">
        <div className="stat-tile accent-blue">
          <div className="icon">🎯</div>
          <div className="num">{stats.attempted}</div>
          <div className="lbl">Questions Attempted</div>
        </div>
        <div className="stat-tile">
          <div className="icon">✅</div>
          <div className="num">{stats.accuracy}%</div>
          <div className="lbl">Overall Accuracy</div>
        </div>

        <div className="panel">
          <div className="panel-title">Today's Goal</div>
          <SubgoalRow icon="📐" label="Quant"   value={4}  total={10} unit="Q"     status="◆" statusColor="amber" />
          <SubgoalRow icon="📊" label="LRDI"    value={1}  total={2}  unit="sets"  status="◆" statusColor="amber" doneStyle />
          <SubgoalRow icon="📖" label="VARC·RC" value={1}  total={1}  unit="sets"  status="✅" complete />
          <SubgoalRow icon="✍️" label="VARC·VA" value={3}  total={5}  unit="Q"     status="◆" statusColor="amber" />
          <button className="start-cta" onClick={onStartPractice}>Start Practicing →</button>
        </div>

        <div className="panel">
          <div className="panel-title">⚠️ Top Weak Topics</div>
          <WeakRow rank="#1" rankColor="red"   topic="VA"         count={11} />
          <WeakRow rank="#2" rankColor="amber" topic="RC"         count={10} />
          <WeakRow rank="#3" rankColor="dim"   topic="Arithmetic" count={2}  />
        </div>
      </div>
    </div>
  );
}

function SubgoalRow({ icon, label, value, total, unit, status, statusColor, complete, doneStyle }) {
  const pct = Math.min(100, (value / total) * 100);
  return (
    <div className="subgoal-row">
      <div className="sub-name"><span>{icon}</span>{label}</div>
      <div className="bar"><div className={complete || doneStyle ? "done" : ""} style={{ width: `${pct}%` }} /></div>
      <span className="status" style={{ color: statusColor === "amber" ? "var(--cat-amber)" : "inherit" }}>{status}</span>
      <span className="count">{value}/{total} {unit}</span>
      <button className="pmbtn">−</button>
      <button className="pmbtn">+</button>
    </div>
  );
}

function WeakRow({ rank, rankColor, topic, count }) {
  return (
    <div className="weak-row">
      <div className="left">
        <span className={`rank ${rankColor}`}>{rank}</span>
        <span className="topic">{topic}</span>
      </div>
      <span className="count-pill">{count} mistakes</span>
    </div>
  );
}

// ----------- Practice question card -----------
function PracticeScreen({ session, onAnswer, onTag, onNext, onPrev, onEnd, state, selectedTag }) {
  const { mode, qNumber, qTotal, question, selected, isWrong, isCorrect } = state;
  const bannerByMode = {
    fix:           { cls: "red",  text: `⚡ Fix Mode — fixing your past mistakes · ${qNumber}/${qTotal}` },
    strengthening: { cls: "blue", text: `⚡ Strengthening: VA — new questions to build the skill · ${qNumber}/${qTotal}` },
    practice:      null,
  };
  const banner = bannerByMode[mode];

  return (
    <div className="fade-in">
      <div className="q-toolbar">
        <button className="meta-chip blue" style={{cursor:"pointer", background:"transparent", border:"1px solid var(--cat-blue)"}}>⌕ Filters ›</button>
      </div>

      {banner && <div className={`mode-banner ${banner.cls}`}>{banner.text}</div>}
      {mode === "practice" && (
        <div style={{textAlign:"center", color:"var(--fg-3)", fontStyle:"italic", marginBottom: 12, fontSize:14}}>
          Focus: notice where you go wrong on each question
        </div>
      )}

      <div className="q-toolbar">
        <span className="q-counter">Q {qNumber} / {qTotal}</span>
        <span className="meta-chip blue">VARC</span>
        <span className="meta-chip blue">VA</span>
        <span className="meta-chip amber">MEDIUM</span>
        <button className="icon-btn" title="Bookmark">🔖</button>
        <button className="icon-btn" title="Flag">⚑</button>
        <button className="icon-btn" title="Note">✎</button>
        <button className="icon-btn" title="Report">⚠</button>
        <span className="q-timer">0:{String(29 - qNumber).padStart(2,"0")}</span>
      </div>

      {/* The question */}
      <div className={`q-card ${isWrong ? "wrong" : ""} ${isCorrect ? "correct-state" : ""}`}>
        {mode === "fix" && (
          <div style={{color:"var(--cat-amber)", marginBottom: 12, fontWeight: 600, fontSize: 14}}>
            ⚠ You got this wrong before
          </div>
        )}
        {mode !== "fix" && (
          <div className="q-passage-tag">⚡ {mode === "strengthening" ? "Strengthening: VA" : "Practice: VA"}</div>
        )}

        <div className="q-body">
          <p>{question.prompt}</p>
          <p>{question.passage}</p>
        </div>

        <div className="options">
          {question.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            let cls = "option";
            if (isWrong || isCorrect) {
              if (i === selected && i !== question.answer) cls += " wrong";
              if (i === question.answer) cls += " correct";
            } else if (selected === i) cls += " selected";
            return (
              <div key={i} className={cls} onClick={() => !isWrong && !isCorrect && onAnswer(i)}>
                <div className="letter">{letter}</div>
                <div className="text">{opt}</div>
                {(isWrong || isCorrect) && i === selected && i !== question.answer && <span className="label">your answer</span>}
                {(isWrong || isCorrect) && i === question.answer && <span className="label">correct</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* WRONG state: tag panel + result row */}
      {isWrong && (
        <>
          <div className="wrong-banner">
            <div className="head">✕ You got this wrong!</div>
            <div className="sub">This is costing you marks.</div>
          </div>

          <div className="result-row">
            <div className="left">
              <span className="wrong-pill">✕ Wrong</span>
              <span style={{ color: "var(--fg-2)" }}>Correct: {String.fromCharCode(65 + question.answer)}</span>
            </div>
            <button className="show-solution-btn">💡 Show Solution</button>
          </div>

          <div className="tag-panel">
            <div className="header">
              <div className="question">Why did this happen?</div>
              <div className="hint">1 tap = saved</div>
            </div>
            <div className="tag-chips">
              {["🧠 Concept", "🔢 Calculation", "👁 Misread", "🎲 Guess"].map(t => (
                <button
                  key={t}
                  className={`tag-chip ${selectedTag === t ? "selected" : ""}`}
                  onClick={() => onTag(t)}
                >{t}</button>
              ))}
            </div>
            <input className="tag-note-input" placeholder="Optional note... (saved with your tag)" />
            <a className="skip-link">Skip (save as Unclassified)</a>
          </div>
        </>
      )}

      {/* Correct (non-wrong) */}
      {isCorrect && !isWrong && (
        <div className="wrong-banner" style={{background: "linear-gradient(135deg, #08200E 0%, var(--bg-2) 100%)", borderColor: "var(--cat-green-border)"}}>
          <div className="head" style={{color: "var(--cat-green)"}}>✓ Correct!</div>
          <div className="sub" style={{color: "var(--fg-2)"}}>Nice work. Auto-advancing…</div>
        </div>
      )}

      {/* Footer CTAs */}
      <div className="q-footer">
        <button className="btn-prev" onClick={onPrev}>← Prev</button>
        <button className="btn-end" onClick={onEnd}>■ End Practice</button>
        <button className="btn-next-primary" onClick={onNext}>Next →</button>
      </div>
    </div>
  );
}

// ----------- Fix Mode intro -----------
function FixModeIntro({ onStart }) {
  return (
    <div className="center-stage fade-in">
      <div className="center-card">
        <img className="bolt" src="../../assets/icon-bolt.svg" width="64" height="64" alt="" />
        <div className="center-title">Fix Mode ON</div>
        <div className="center-sub">Fixing your past mistakes — let's break the pattern.</div>
        <ul className="promise-list">
          <li><span className="check">✓</span>We'll show your wrong answers</li>
          <li><span className="check">✓</span>You solve them again</li>
          <li><span className="check">✓</span>We make sure you don't repeat</li>
        </ul>
        <button className="btn-next-primary" style={{width:"100%"}} onClick={onStart}>Let's Fix →</button>
      </div>
    </div>
  );
}

// ----------- Mistakes-fixed bridge -----------
function MistakesFixedBridge({ onContinue, onSkip }) {
  return (
    <div className="center-stage fade-in">
      <div className="center-card bridge">
        <div className="center-title">✓ Mistakes fixed.</div>
        <div className="bridge-line">But you're still weak in <span className="accent">VA</span>.</div>
        <div className="center-sub">Let's strengthen it now — 2 more minutes.</div>
        <button className="btn-next-primary" style={{width: "100%"}} onClick={onContinue}>Continue →</button>
        <a className="skip-now" onClick={onSkip}>Skip for now</a>
      </div>
    </div>
  );
}

// ----------- All-done celebratory -----------
function AllDone({ onBack }) {
  return (
    <div className="center-stage fade-in">
      <div className="center-card">
        <div className="center-title green">✓ Skill strengthened.</div>
        <div className="center-sub">VA mistakes have been re-solved AND strengthened. Pattern broken. Keep pushing 💪</div>
        <button className="btn-next-primary" style={{width:"100%"}} onClick={onBack}>Back to Dashboard →</button>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, PracticeScreen, FixModeIntro, MistakesFixedBridge, AllDone });
