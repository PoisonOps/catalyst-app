// ============================================================
// CONFIG.JS — ENV detection · Supabase credentials · Feature flags
// ============================================================

// ── ENVIRONMENT DETECTION ───────────────────────────────────
// 'dev'  → localhost / 127.0.0.1 / any hostname containing 'dev.' or 'staging'
// 'prod' → everything else (deployed site, Netlify, etc.)
const ENV = (() => {
  const host = location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'dev';
  if (host.includes('dev.') || host.includes('staging')) return 'dev';
  return 'prod';
})();

// ── SUPABASE CREDENTIALS (per-env) ──────────────────────────
// PROD → your live Supabase project (real users, real data)
// DEV  → separate Supabase project for safe testing (ywejteozxichsmterelj)
const _CONFIGS = {
  prod: {
    SUPABASE_URL: 'https://lvbqmaarriglqaegemgc.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2YnFtYWFycmlnbHFhZWdlbWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NzA2MTQsImV4cCI6MjA5MzQ0NjYxNH0.o284rHiW_XCPulBUdmFSMFJftNKTCkipCJ-mTwBQjaw',
  },
  dev: {
    SUPABASE_URL: 'https://ywejteozxichsmterelj.supabase.co',
    SUPABASE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3ZWp0ZW96eGljaHNtdGVyZWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0NjA3MzUsImV4cCI6MjA5NDAzNjczNX0.Isd_uUZ4Y5cKkIyoF1sdcLPRRkVl1cvB8LQV69q0bjw',
  }
};

// Exported as top-level vars — identical names to before, zero changes needed elsewhere
const SUPABASE_URL = _CONFIGS[ENV].SUPABASE_URL;
const SUPABASE_KEY = _CONFIGS[ENV].SUPABASE_KEY;

// ── FEATURE FLAGS ────────────────────────────────────────────
// Toggle features without code changes. To disable a feature: set to false, save, deploy.
// To re-enable: set to true. No git revert needed.
const FLAGS = {
  SUPABASE_SYNC: true,   // Write attempts/errors/reports/feedback to Supabase
  // Set to false to go fully local (safe testing / offline mode)
  DEBUG_LOG: ENV === 'dev',  // Console logs only in dev
};

// ── RUNTIME STATE ────────────────────────────────────────────
let sbClient = null;
let USE_DEMO = false;

// ============================================================
// DEMO DATA
// All questions use correct_option (A/B/C/D) for MCQ
// and correct_value (string) for TITA
// set_id links to DEMO_SETS
// ============================================================

const DEMO_SETS = [
  {
    id: 's1',
    subject: 'LRDI',
    topic: 'Data Interpretation',
    difficulty: 'Medium',
    instruction: 'Study the table carefully and answer the following questions.',
    passage: `The table below shows the sales (in units) of 4 products A, B, C, D across 5 months (Jan–May):

        A      B      C      D
Jan    120    80     95     60
Feb    150    100    85     75
Mar    130    120    110    90
Apr    160    90     130    80
May    140    110    120    100`
  },
  {
    id: 's2',
    subject: 'VARC',
    topic: 'Reading Comprehension',
    difficulty: 'Medium',
    instruction: 'Read the passage carefully and answer the questions.',
    passage: `The concept of emotional intelligence (EI) was first formally conceptualized by psychologists Peter Salovey and John Mayer in 1990 and was later popularized by Daniel Goleman in his 1995 book. Emotional intelligence refers to the ability to recognize, understand, manage, and effectively use emotions — both one's own and those of others.

Research has increasingly shown that EI may be more predictive of success in various life domains than traditional measures of cognitive ability (IQ). In organizational settings, leaders with high EI tend to build stronger teams, navigate conflict more effectively, and inspire greater employee engagement.

Critics, however, argue that EI is poorly defined and difficult to measure objectively, often overlapping with existing personality traits like agreeableness or neuroticism. Some researchers believe the construct lacks the scientific rigor necessary to be considered distinct from established psychological models.

Despite this debate, EI training programs have proliferated in corporate and educational settings. Proponents maintain that unlike IQ, which remains relatively fixed, emotional intelligence can be developed through targeted practice and self-reflection.`
  }
];

const DEMO_QUESTIONS = [
  // ── QUANT STANDALONE ──────────────────────────────────────
  {
    id: 1, global_q_no: 1,
    subject: 'Quant', topic: 'Linear Equations', subtopic: 'Two Variables',
    question_type: 'single', answer_type: 'mcq', difficulty: 'Easy',
    question: 'If 2x + 3y = 12 and x − y = 1, find the value of x + y.',
    option_a: '3', option_b: '4', option_c: '5', option_d: '6',
    correct_option: 'C', correct_value: null,
    solution: 'From x − y = 1 → x = y + 1. Substituting: 2(y+1) + 3y = 12 → 5y = 10 → y = 2, x = 3. So x + y = 5.',
    set_id: null, pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  },
  {
    id: 2, global_q_no: 2,
    subject: 'Quant', topic: 'Time, Speed and Distance', subtopic: 'Average Speed',
    question_type: 'single', answer_type: 'mcq', difficulty: 'Medium',
    question: 'A train travels 60 km/hr for the first half of the journey and 40 km/hr for the second half. What is the average speed for the entire journey?',
    option_a: '48 km/hr', option_b: '50 km/hr', option_c: '52 km/hr', option_d: '45 km/hr',
    correct_option: 'A', correct_value: null,
    solution: 'For equal distances: Avg speed = 2v₁v₂/(v₁+v₂) = 2×60×40/(60+40) = 4800/100 = 48 km/hr.',
    set_id: null, pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  },
  {
    id: 3, global_q_no: 3,
    subject: 'Quant', topic: 'Profit and Loss', subtopic: 'Discount and Markup',
    question_type: 'single', answer_type: 'mcq', difficulty: 'Easy',
    question: 'A shopkeeper marks up goods by 25% and offers a 10% discount. What is his profit percentage?',
    option_a: '10%', option_b: '12%', option_c: '12.5%', option_d: '15%',
    correct_option: 'C', correct_value: null,
    solution: 'CP = 100. MP = 125. SP = 125 × 0.9 = 112.5. Profit % = 12.5%.',
    set_id: null, pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  },
  {
    id: 4, global_q_no: 4,
    subject: 'Quant', topic: 'Time and Work', subtopic: 'Efficiency',
    question_type: 'single', answer_type: 'mcq', difficulty: 'Easy',
    question: 'A can complete a work in 12 days. B is 50% more efficient than A. In how many days will B complete the same work?',
    option_a: '6 days', option_b: '8 days', option_c: '9 days', option_d: '10 days',
    correct_option: 'B', correct_value: null,
    solution: 'A does 1/12 per day. B is 1.5× more efficient → 1.5/12 = 1/8 per day. B finishes in 8 days.',
    set_id: null, pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  },
  {
    id: 5, global_q_no: 5,
    subject: 'Quant', topic: 'Number Systems', subtopic: 'Remainders',
    question_type: 'single', answer_type: 'mcq', difficulty: 'Hard',
    question: 'What is the remainder when 7¹⁰⁰ is divided by 48?',
    option_a: '1', option_b: '7', option_c: '11', option_d: '17',
    correct_option: 'A', correct_value: null,
    solution: '7² = 49 ≡ 1 (mod 48). So 7¹⁰⁰ = (7²)⁵⁰ ≡ 1⁵⁰ = 1 (mod 48). Remainder = 1.',
    set_id: null, pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  },
  {
    id: 6, global_q_no: 6,
    subject: 'Quant', topic: 'Quadratic Equations', subtopic: 'Comparison',
    question_type: 'single', answer_type: 'mcq', difficulty: 'Medium',
    question: 'If x² − 5x + 6 = 0 and y² − 7y + 12 = 0, which of the following is always true?',
    option_a: 'x > y', option_b: 'x < y', option_c: 'x = y', option_d: 'x ≥ y',
    correct_option: 'B', correct_value: null,
    solution: 'x = 2 or 3. y = 3 or 4. In all combinations (2,3), (2,4), (3,4) — x < y always holds.',
    set_id: null, pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  },
  // ── QUANT TITA ────────────────────────────────────────────
  {
    id: 7, global_q_no: 7,
    subject: 'Quant', topic: 'Logarithms', subtopic: 'Base Change',
    question_type: 'single', answer_type: 'tita', difficulty: 'Medium',
    question: 'If log₂(x) + log₄(x) = 3, find the value of x.',
    option_a: null, option_b: null, option_c: null, option_d: null,
    correct_option: null, correct_value: '4',
    solution: 'log₄(x) = log₂(x)/2. So log₂(x) + log₂(x)/2 = 3 → (3/2)log₂(x) = 3 → log₂(x) = 2 → x = 4.',
    set_id: null, pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  },
  {
    id: 8, global_q_no: 8,
    subject: 'Quant', topic: 'Averages', subtopic: 'Weighted Average',
    question_type: 'single', answer_type: 'tita', difficulty: 'Easy',
    question: 'The average of 5 consecutive odd numbers is 21. What is the largest of these numbers?',
    option_a: null, option_b: null, option_c: null, option_d: null,
    correct_option: null, correct_value: '25',
    solution: 'Middle number = 21. The 5 consecutive odds are 17, 19, 21, 23, 25. Largest = 25.',
    set_id: null, pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  },
  // ── LRDI SET QUESTIONS ───────────────────────────────────
  {
    id: 101, global_q_no: 9,
    subject: 'LRDI', topic: 'Data Interpretation', subtopic: 'Table',
    question_type: 'set_question', answer_type: 'mcq', difficulty: 'Easy',
    question: 'Which product had the highest total sales over all 5 months?',
    option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D',
    correct_option: 'A', correct_value: null,
    solution: 'A: 120+150+130+160+140 = 700. B: 500. C: 540. D: 405. A is highest.',
    set_id: 's1', pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  },
  {
    id: 102, global_q_no: 10,
    subject: 'LRDI', topic: 'Data Interpretation', subtopic: 'Table',
    question_type: 'set_question', answer_type: 'mcq', difficulty: 'Medium',
    question: 'What is the percentage increase in sales of product C from February to April?',
    option_a: '40%', option_b: '50%', option_c: '52.9%', option_d: '60%',
    correct_option: 'C', correct_value: null,
    solution: 'Feb C = 85, Apr C = 130. Increase = 45. % = (45/85)×100 = 52.94% ≈ 52.9%.',
    set_id: 's1', pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  },
  {
    id: 103, global_q_no: 11,
    subject: 'LRDI', topic: 'Data Interpretation', subtopic: 'Table',
    question_type: 'set_question', answer_type: 'tita', difficulty: 'Medium',
    question: 'What is the total sales (in units) of all products combined in the month of March?',
    option_a: null, option_b: null, option_c: null, option_d: null,
    correct_option: null, correct_value: '450',
    solution: 'March totals: A=130, B=120, C=110, D=90. Sum = 450.',
    set_id: 's1', pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  },
  // ── VARC RC SET QUESTIONS ────────────────────────────────
  {
    id: 201, global_q_no: 12,
    subject: 'VARC', topic: 'Reading Comprehension', subtopic: 'Inference',
    question_type: 'set_question', answer_type: 'mcq', difficulty: 'Medium',
    question: 'According to the passage, which best describes the main argument made by critics of emotional intelligence?',
    option_a: 'EI is less important than IQ', option_b: 'EI lacks clear definition and scientific distinctness', option_c: 'EI training programs are ineffective', option_d: 'EI cannot be developed through practice',
    correct_option: 'B', correct_value: null,
    solution: 'Critics argue EI is "poorly defined and difficult to measure objectively" and "lacks the scientific rigor necessary to be considered distinct."',
    set_id: 's2', pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  },
  {
    id: 202, global_q_no: 13,
    subject: 'VARC', topic: 'Reading Comprehension', subtopic: 'Inference',
    question_type: 'set_question', answer_type: 'mcq', difficulty: 'Easy',
    question: 'What can be inferred about the relationship between EI and IQ from the passage?',
    option_a: 'EI has replaced IQ as a measure of intelligence', option_b: 'EI and IQ measure the same construct', option_c: 'Unlike IQ, EI may be improvable through deliberate effort', option_d: 'High IQ individuals always have low EI',
    correct_option: 'C', correct_value: null,
    solution: 'The passage states: "unlike IQ, which remains relatively fixed, emotional intelligence can be developed through targeted practice and self-reflection."',
    set_id: 's2', pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  },
  // ── VARC VA STANDALONE ───────────────────────────────────
  {
    id: 301, global_q_no: 14,
    subject: 'VARC', topic: 'Para Jumble', subtopic: 'Sentence Ordering',
    question_type: 'single', answer_type: 'mcq', difficulty: 'Medium',
    question: 'The four sentences (A, B, C, D) given below, when properly sequenced, form a coherent paragraph. Identify the correct sequence.\nA. The discovery overturned decades of established belief.\nB. Scientists had long assumed the compound was stable at room temperature.\nC. In 2019, a team in Berlin observed unexpected reactions under ordinary conditions.\nD. The implications for industrial chemistry are still being worked out.',
    option_a: 'BCAD', option_b: 'BACD', option_c: 'ABCD', option_d: 'CBAD',
    correct_option: 'A', correct_value: null,
    solution: 'B (established belief) → C (discovery in 2019) → A (overturned belief) → D (implications). Sequence: BCAD.',
    set_id: null, pdf_name: 'Demo', source: 'Demo',
    has_image: false, image_url: null
  }
];
