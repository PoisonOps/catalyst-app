


# APP_FLOW.md — CATalyst

---

# 🧠 1. Core Product Loop

Practice → Track → Analyze → Improve → Repeat

This loop drives the entire product.

---

# 🚀 2. User Journey (End-to-End)

## Entry
User opens app →

Sees Dashboard:
- Today’s progress
- Accuracy
- Weak topics

CTA:
- Start Practice
- Resume Session

---

# 🎯 3. Practice Flow (MVP CORE)

## Step 1 — Select Mode
User selects:
- Topic-wise
- Mixed
- Set-based (LRDI / RC)

---

## Step 2 — Configure Session
- Number of questions
- Subject
- Topic

---

## Step 3 — Fetch Questions

System fetches from DB:
- Based on filters
- Supports:
  - single questions
  - set-based questions

---

## Step 4 — Solve Question

User sees:
- Question
- Options (MCQ) OR Input (TITA)
- Passage (if set)

User:
- selects answer
- clicks next

---

## Step 5 — Save Attempt

Each attempt stored:
- selected answer
- correct / incorrect
- time taken

---

## Step 6 — Error Log Trigger (USP)

If answer is wrong:

Popup appears:
- Conceptual mistake
- Silly mistake
- Guess
- Time pressure

Optional note field

Saved to error_logs

---

# 📊 4. Session End

User sees:
- Total questions
- Correct answers
- Accuracy %
- Time taken

CTA:
- Review errors
- Retry wrong questions

---

# 🧠 5. Error Log Flow (CORE USP)

For each wrong question:
- Question
- User answer
- Correct answer
- Error type
- User note

Used for:
- Weak area detection
- Personalized practice (future)

---

# 📈 6. Dashboard Flow

## Daily View
- Questions solved
- Accuracy
- Time spent

## Insights
- Weak topics
- Error distribution
- Performance trend

---

# 🔁 7. Review Flow

## Retry Wrong Questions

Fetch:
- questions from error_logs

User can:
- reattempt
- mark corrected

---

# 🧪 8. Test Mode (Phase 2)

Flow:
- Select test
- Timer ON
- No instant feedback

After test:
- score
- detailed analysis
- error log auto-created

---

# 👤 9. User System

- login/signup
- user_id tracking

Stores:
- attempts
- errors
- progress

---

# 🔗 10. Data Flow

User action → attempt_logs → (if wrong) error_logs → dashboard insights

---

# ⚙️ 11. MVP Scope (STRICT)

Build ONLY:
- Practice engine
- Attempt tracking
- Error logging
- Basic dashboard

---

# ❌ Not in MVP

- AI suggestions
- Advanced analytics
- Gamification
- Themes

---

# 🚀 12. Future Expansion

- Weak-area auto practice
- Smart recommendations
- Full mock tests
- JEE version

---

# ⚡ Final Rule

Make solving easy.  
Make reviewing powerful.