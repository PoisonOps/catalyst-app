// CATalyst UI Kit — top-level app + state machine

const { useState: useStateA, useEffect: useEffectA, useMemo } = React;

// Sample question bank
const SAMPLE_QUESTIONS = [
  {
    prompt: "From the given options, choose the sentence that completes the paragraph in the most appropriate way.",
    passage: "Trade protectionism, disguised as concern for the climate, is raising its head. Citing competitiveness concerns, powerful industrialized countries are holding out threats of a levy on imports of energy-intensive products from developing countries that refuse to accept their demands. The actual source of protectionist sentiment in the OECD countries is, of course, their current lacklustre economic performance, combined with the challenges posed by the rapid economic rise of China and India — in that order. [CAT 2008]",
    options: [
      "Climate change is evoked to bring trade protectionism through the back door.",
      "OECD countries are taking refuge in climate change issues to erect trade barriers against these two countries.",
      "Climate change concerns have come as a convenient stick to beat the rising trade power of China and India.",
      "Defenders of the global economic status quo are posing as climate change champions.",
      "Today's climate change champions are the perpetrators of global economic inequity.",
    ],
    answer: 2,
  },
  {
    prompt: "Choose the sentence that best completes the passage.",
    passage: "Trust, in economic and social interactions, is not a constant. It builds slowly through repeated, verifiable cooperation and collapses quickly when betrayal is detected. Institutional design, therefore, ought to focus less on extracting goodwill and more on …",
    options: [
      "minimizing the cost of monitoring and the time required to detect defection.",
      "creating large punishments to deter would-be defectors.",
      "appealing to the moral intuitions of all participants.",
      "raising the social status of cooperative individuals.",
      "encouraging frequent, low-stakes interactions among strangers.",
    ],
    answer: 0,
  },
  {
    prompt: "Pick the option that completes the paragraph most coherently.",
    passage: "The chess engine had become so strong that human grandmasters no longer studied positions to find the best move — they studied positions to understand why the engine considered a certain move best. The relationship had inverted: …",
    options: [
      "the engine, once a tool, was now the teacher.",
      "humans were doomed to be relegated to spectators.",
      "the engine's calculations had become unfathomable.",
      "chess itself was no longer a fair contest.",
      "the engine and the human had reached parity.",
    ],
    answer: 0,
  },
];

const INITIAL = {
  attempted: 63,
  accuracy: 22,
  pending: 24,
  fixed: 30,
  totalLogged: 56,
  conceptGapCount: 12,
  goalDone: 9,
  goalTotal: 20,
};

function App() {
  const [screen, setScreen] = useStateA("dashboard");
  // screen: dashboard | fix-intro | practice | bridge | all-done
  const [stats, setStats] = useStateA(INITIAL);
  const [theme, setTheme] = useStateA("dark");
  const [toast, setToast] = useStateA(null);

  // Practice session state
  const [mode, setMode] = useStateA("practice"); // practice | fix | strengthening
  const [qIdx, setQIdx]   = useStateA(0);
  const [selected, setSelected] = useStateA(null);
  const [revealed, setRevealed] = useStateA(false);
  const [taggedMistakes, setTaggedMistakes] = useStateA({});
  const [shakeKey, setShakeKey] = useStateA(0);

  useEffectA(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Auto-dismiss toast
  useEffectA(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  const qTotal = mode === "strengthening" ? 5 : 25;
  const question = SAMPLE_QUESTIONS[qIdx % SAMPLE_QUESTIONS.length];

  // Answer logic
  function handleAnswer(i) {
    setSelected(i);
    // Reveal after a short beat — simulates "submit" being implicit
    setTimeout(() => setRevealed(true), 200);
  }
  function handleTag(t) {
    setTaggedMistakes(m => ({ ...m, [qIdx]: t }));
  }
  function handleNext() {
    const isWrong = revealed && selected !== question.answer;
    const isCorrect = revealed && selected === question.answer;

    // If on last question, branch:
    if (qIdx + 1 >= qTotal) {
      if (mode === "fix") {
        // Move to bridge
        setStats(s => ({ ...s, pending: Math.max(0, s.pending - 25), fixed: s.fixed + 25 }));
        setScreen("bridge");
      } else if (mode === "strengthening") {
        setScreen("all-done");
      } else {
        // practice mode: back to dashboard
        setScreen("dashboard");
        setStats(s => ({ ...s, attempted: s.attempted + qTotal, goalDone: Math.min(s.goalTotal, s.goalDone + 5) }));
      }
      // Reset session vars
      setQIdx(0); setSelected(null); setRevealed(false); setTaggedMistakes({});
      return;
    }

    // Otherwise advance
    setQIdx(i => i + 1);
    setSelected(null);
    setRevealed(false);
    // Light tracking: if wrong + not tagged, count as "Unclassified"
    if (isWrong) setStats(s => ({ ...s, pending: s.pending + 1, totalLogged: s.totalLogged + 1 }));
    if (isCorrect && mode !== "practice") setStats(s => ({ ...s, fixed: s.fixed + 1 }));
  }
  function handlePrev() {
    if (qIdx > 0) {
      setQIdx(i => i - 1);
      setSelected(null);
      setRevealed(false);
    }
  }
  function handleEnd() {
    setScreen("dashboard");
    setQIdx(0); setSelected(null); setRevealed(false);
  }

  function startPractice() {
    setMode("practice");
    setQIdx(0); setSelected(null); setRevealed(false);
    setScreen("practice");
  }
  function startFixMode() {
    setMode("fix");
    setQIdx(0); setSelected(null); setRevealed(false);
    setScreen("fix-intro");
  }
  function enterFixQuestions() {
    setScreen("practice");
    setToast("Fix session loaded! Let's go 💪");
  }
  function continueStrengthening() {
    setMode("strengthening");
    setQIdx(0); setSelected(null); setRevealed(false);
    setScreen("practice");
  }
  function navigate(target, opts) {
    if (target === "dashboard") setScreen("dashboard");
    if (target === "practice" && opts?.mode === "fix") return startFixMode();
    if (target === "practice") return startPractice();
    if (target === "errors")  setScreen("dashboard"); // out of scope — would be error-log screen
  }

  const isWrong = revealed && selected != null && selected !== question.answer;
  const isCorrect = revealed && selected != null && selected === question.answer;

  // Shake the question card on wrong
  useEffectA(() => {
    if (isWrong) setShakeKey(k => k + 1);
  }, [isWrong]);

  const navActive =
    screen === "dashboard" ? "dashboard"
    : screen === "practice" && mode === "fix" ? "errors"
    : screen === "practice" ? "practice"
    : screen === "fix-intro" ? "errors"
    : screen === "bridge" ? "practice"
    : screen === "all-done" ? "practice"
    : "dashboard";

  return (
    <div className="app">
      <Sidebar
        active={navActive}
        onNav={navigate}
        mistakesLeft={stats.pending}
        goalDone={stats.goalDone}
        goalTotal={stats.goalTotal}
      />

      <main className="main">
        <TopBar theme={theme} onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} />
        <div className="divider-line" />

        {screen === "dashboard" && (
          <Dashboard
            stats={stats}
            onStartPractice={startPractice}
            onFixNow={startFixMode}
          />
        )}

        {screen === "fix-intro" && (
          <FixModeIntro onStart={enterFixQuestions} />
        )}

        {screen === "practice" && (
          <div key={`shake-${shakeKey}`} className={isWrong ? "cat-shake" : ""}>
            <PracticeScreen
              state={{
                mode,
                qNumber: qIdx + 1,
                qTotal,
                question,
                selected,
                isWrong,
                isCorrect,
              }}
              selectedTag={taggedMistakes[qIdx]}
              onAnswer={handleAnswer}
              onTag={handleTag}
              onNext={handleNext}
              onPrev={handlePrev}
              onEnd={handleEnd}
            />
          </div>
        )}

        {screen === "bridge" && (
          <MistakesFixedBridge
            onContinue={continueStrengthening}
            onSkip={() => setScreen("dashboard")}
          />
        )}

        {screen === "all-done" && (
          <AllDone onBack={() => setScreen("dashboard")} />
        )}

        <ChatFab />
        {toast && <Toast k={toast}>{toast}</Toast>}
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
