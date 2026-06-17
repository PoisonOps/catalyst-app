// ============================================================
// api/interview-chat.js — CATalyst Max interview proxy
// Holds the AI keys SERVER-SIDE (Vercel env vars) so they're never
// exposed to the browser. Gemini 2.5 Flash primary, Groq fallback,
// with silent retry so a busy server never breaks a live interview.
// Env vars required: GEMINI_API_KEY, GROQ_API_KEY
// ============================================================

const GEMINI_MODEL = 'gemini-2.5-flash';
const GROQ_MODEL   = 'llama-3.3-70b-versatile';
const wait = ms => new Promise(r => setTimeout(r, ms));

async function callGemini(key, system, messages) {
  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.text }] }));
  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { temperature: 0.9, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } },
  };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (res.status === 503 || res.status === 429) { const e = new Error('busy'); e.retryable = true; throw e; }
  if (!res.ok) { const e = new Error('gemini ' + res.status); e.retryable = false; throw e; }
  const j = await res.json();
  const t = j && j.candidates && j.candidates[0] && j.candidates[0].content
    && j.candidates[0].content.parts && j.candidates[0].content.parts[0] && j.candidates[0].content.parts[0].text;
  if (!t) { const e = new Error('empty'); e.retryable = true; throw e; }
  return t.trim();
}

async function callGroq(key, system, messages) {
  const msgs = [{ role: 'system', content: system }].concat(
    messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text }))
  );
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
    body: JSON.stringify({ model: GROQ_MODEL, messages: msgs, temperature: 0.9 }),
  });
  if (!res.ok) throw new Error('groq ' + res.status);
  const j = await res.json();
  return ((j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '').trim();
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const gkey = process.env.GEMINI_API_KEY;
  const qkey = process.env.GROQ_API_KEY;
  if (!gkey && !qkey) return res.status(500).json({ error: 'No AI key configured on server' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  const system = (body && body.system) || '';
  let messages = (body && body.messages) || [];
  if (!system || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'system + messages required' });
  }

  // basic abuse guards
  if (messages.length > 80) messages = messages.slice(-80);
  messages = messages
    .filter(m => m && typeof m.text === 'string')
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', text: m.text.slice(0, 6000) }));

  let lastErr = null;

  if (gkey) {
    for (let i = 0; i < 3; i++) {
      try { return res.status(200).json({ text: await callGemini(gkey, system, messages) }); }
      catch (e) { lastErr = e; if (!e.retryable) break; await wait(700 * (i + 1)); }
    }
  }
  if (qkey) {
    try { return res.status(200).json({ text: await callGroq(qkey, system, messages) }); }
    catch (e) { lastErr = e; }
  }
  if (gkey) {
    try { return res.status(200).json({ text: await callGemini(gkey, system, messages) }); }
    catch (e) { lastErr = e; }
  }

  return res.status(503).json({ error: 'AI temporarily busy — please retry', detail: (lastErr && lastErr.message) || '' });
};
