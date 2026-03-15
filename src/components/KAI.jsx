/**
 * Designed & Built by ZAI (Zawwar Sami)
 * github.com/zawwarsami16
 * All Rights Reserved © 2025 Zawwar Sami
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { AI_SYSTEM_PROMPT, MENU } from '../data/menu';
import { COUPONS, DAILY_SPECIALS } from '../data/specials';
import { useCart } from '../context/CartContext';
import { useAdmin } from '../context/AdminContext';
import { useToast } from './Toast';
import './KAI.css';

// ── Detect mentioned menu items in AI reply ───────────────────
function extractMenuItems(text, availableIds = null) {
  const found = [];
  const lower = text.toLowerCase();
  MENU.forEach(item => {
    if (availableIds && !availableIds.has(item.id)) return; // skip unavailable
    const names = [item.name, item.fullName].filter(Boolean);
    if (names.some(n => lower.includes(n.toLowerCase()))) {
      if (!found.find(f => f.id === item.id)) found.push(item);
    }
  });
  return found.slice(0, 4);
}

// ── Render markdown-ish formatting ───────────────────────────
function renderText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n---\n/g, '<hr style="border-color:var(--k-border);margin:10px 0"/>')
    .replace(/\n/g, '<br/>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,.08);padding:1px 6px;border-radius:3px;font-size:11px;font-family:monospace">$1</code>');
}

// ── Menu card shown inside chat ───────────────────────────────
function MenuCard({ item, onAdd }) {
  const [added, setAdded] = useState(false);
  const handleAdd = () => {
    onAdd(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  return (
    <div className="kai-card">
      <img src={item.image} alt={item.name} className="kai-card__img"
        onError={e => { e.target.src = 'https://kajunchicken.ca/wp-content/uploads/2024/07/Family-Feast.webp'; }} />
      <div className="kai-card__info">
        <div className="kai-card__name">{item.name}</div>
        {item.includes && <div className="kai-card__inc">incl. {item.includes}</div>}
        <div className="kai-card__price">${item.price.toFixed(2)} CAD</div>
      </div>
      <button
        className={`kai-card__btn ${added ? 'kai-card__btn--added' : ''}`}
        onClick={handleAdd}
        title={added ? 'Added!' : 'Add to cart'}
      >
        {added ? '✓' : '+'}
      </button>
    </div>
  );
}

// ── Quick prompt chips ────────────────────────────────────────
const QUICK = [
  { icon: '👥', text: 'Best for 2 people?' },
  { icon: '👨‍👩‍👧‍👦', text: 'Family meal options?' },
  { icon: '🌶️', text: 'What\'s spicy?' },
  { icon: '💰', text: 'Best value deal?' },
  { icon: '🦐', text: 'Seafood options?' },
  { icon: '📋', text: 'Summarize my order' },
];

// ── Main KAI Component ────────────────────────────────────────
export default function KAI() {
  // Read Groq key from .env (injected by Vite) or localStorage
  const ENV_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) || '';
  const { store, isAvailable, fullMenu, isCouponActive } = useAdmin();

  // Build available items set for this session
  const availableIds = new Set(MENU.filter(m => isAvailable(m.id)).map(m => m.id));
  const unavailableNames = MENU.filter(m => !isAvailable(m.id)).map(m => m.name);
  const activeCouponsList = COUPONS.filter(c => isCouponActive(c.id));
  const todayDay = new Date().toLocaleDateString('en-CA', { weekday:'long' });

  // Dynamic system prompt — updated with real availability
  const dynamicPrompt = AI_SYSTEM_PROMPT + `

## CURRENT AVAILABILITY UPDATE (LIVE — today is ${todayDay})

AVAILABLE RIGHT NOW:
${MENU.filter(m => isAvailable(m.id)).map(m => `- ${m.name} — $${m.price.toFixed(2)}`).join('\n')}

UNAVAILABLE TODAY (DO NOT SUGGEST THESE):
${unavailableNames.length > 0 ? unavailableNames.map(n => `- ${n} (sold out today)`).join('\n') : 'All items available'}

## ACTIVE DEALS & COUPONS (mention these proactively)
${activeCouponsList.length > 0 ? activeCouponsList.map(c => `- ${c.tag}: ${c.title} — $${c.price.toFixed(2)} (${c.includes})`).join('\n') : 'No active coupons right now'}

## TODAY'S SPECIALS
- Monday: Chicken Sandwich for $5.99
- Tuesday & Wednesday: 2 Pc Chicken + Fries for $5.99

## UPSELL PRIORITY (always try to mention in this order)
1. Family Feast meals first (highest value — 8pc $34.99, 12pc $44.99, 16pc $54.99)
2. 2 Can Dine coupons for groups of 2 (great value)
3. 5 Pc Tenders or 3 Pc Bone-In for solo orders
4. Always suggest adding biscuits (3 for $5.99)
5. Mention today's daily special if relevant

## CRITICAL RULES FOR AVAILABILITY
- NEVER suggest any item listed as unavailable today
- If someone asks for an unavailable item, say "that's not available today unfortunately" and redirect to what IS available
- Be honest but positive — "we don't have X today, but the [available alternative] is amazing"
`;

  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput]     = useState('');
  const [unread, setUnread]   = useState(0);
  const [firstVisit, setFirstVisit] = useState(() => {
    // Auto-open KAI after 4 seconds on first visit
    return !sessionStorage.getItem('kai_visited');
  });

  // First visit: auto open after delay
  useEffect(() => {
    if (firstVisit && !open) {
      const t = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem('kai_visited', '1');
        setFirstVisit(false);
      }, 4000);
      return () => clearTimeout(t);
    }
  }, []);
  const [keyMode, setKeyMode] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const [apiKey, setApiKey]   = useState(() => localStorage.getItem('kai_key') || ENV_KEY);

  const [msgs, setMsgs] = useState([{
    role: 'assistant', id: 'init', cards: [],
    content: "Hey! 👋 I\'m KAI, your Kajun order guide.\n\nI know the full menu, every price, and every deal. I\'ll help you build your order and you can add items to your cart right from here.\n\nHow many people are eating today — or what are you in the mood for?",
  }]);

  const endRef   = useRef(null);
  const inputRef = useRef(null);
  const { add, items: cartItems, itemCount } = useCart();
  const toast = useToast();

  // Scroll to bottom
  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading, open]);

  // Clear unread when opened
  useEffect(() => { if (open) setUnread(0); }, [open]);

  const saveKey = () => {
    const k = keyDraft.trim();
    if (!k) return;
    setApiKey(k);
    localStorage.setItem('kai_key', k);
    setKeyMode(false);
    setKeyDraft('');
  };

  const removeKey = () => {
    localStorage.removeItem('kai_key');
    setApiKey(ENV_KEY || '');
    setKeyDraft('');
  };

  const addToCart = useCallback((item) => {
    add(item);
    toast(`${item.name} added to cart!`, '🍗');
  }, [add, toast]);

  const send = useCallback(async (textOverride) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    if (!apiKey) {
      setKeyMode(true);
      return;
    }

    const userMsg = { role: 'user', content: text, id: Date.now(), cards: [] };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build conversation history (last 14 msgs for context)
      const history = msgs.slice(-14).map(m => ({ role: m.role, content: m.content }));

      // Try best model → fallback to fast model
      const MODELS = ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'llama3-8b-8192'];
      let reply = null;

      for (const model of MODELS) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              max_tokens: 500,
              temperature: 0.78,
              messages: [
                { role: 'system', content: dynamicPrompt },
                ...history,
                { role: 'user', content: text },
              ],
            }),
          });

          if (res.ok) {
            const data = await res.json();
            reply = data.choices?.[0]?.message?.content;
            if (reply) break;
          } else if (res.status === 429) {
            // Rate limit — try next model
            continue;
          } else {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.error?.message || `HTTP ${res.status}`);
          }
        } catch (modelErr) {
          if (modelErr.message.includes('HTTP')) throw modelErr;
          continue; // try next model
        }
      }

      if (!reply) throw new Error('Unable to get response — please try again');

      // Extract any menu items mentioned in the reply
      const cards = extractMenuItems(reply, availableIds);

      setMsgs(prev => [...prev, {
        role: 'assistant',
        content: reply,
        id: Date.now(),
        cards,
      }]);

      if (!open) setUnread(u => u + 1);

    } catch (err) {
      setMsgs(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, something went wrong: **${err.message}**\n\nTry checking your Groq API key in ⚙️ settings.`,
        id: Date.now(),
        cards: [],
      }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, apiKey, msgs, open]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* ── FLOATING BUBBLE — Promoted ──────────────────── */}
      {!open && (
        <div className="kai-promo-wrap">
          {/* Pulsing ring */}
          <div className="kai-promo-ring" />
          <div className="kai-promo-ring kai-promo-ring--2" />
          {/* Callout tooltip */}
          <div className="kai-callout">
            <div className="kai-callout__dot" />
            <span>🤖 Ask KAI — Build your order!</span>
          </div>
          {/* Main bubble */}
          <button
            className="kai-bubble"
            onClick={() => setOpen(true)}
            aria-label="Open KAI Order Assistant"
          >
            <span className="kai-bubble__icon">🤖</span>
            <div className="kai-bubble__info">
              <span className="kai-bubble__name">KAJUN AI</span>
              <span className="kai-bubble__sub">Order Assistant</span>
            </div>
            {unread > 0 && <span className="kai-bubble__badge">{unread}</span>}
          </button>
        </div>
      )}
      {/* Close button when open */}
      {open && (
        <button className="kai-bubble kai-bubble--open" onClick={() => setOpen(false)} aria-label="Close KAI">
          <span className="kai-bubble__icon">✕</span>
        </button>
      )}

      {/* ── FULL WINDOW ──────────────────────────────────── */}
      {open && (
        <div className="kai-window">
          <div className="kai-window__overlay" onClick={() => setOpen(false)} />

          <div className="kai-window__panel">

            {/* Header */}
            <div className="kai-head">
              <div className="kai-head__avatar">🤖</div>
              <div className="kai-head__info">
                <div className="kai-head__name">KAI — Kajun Order Assistant</div>
                <div className="kai-head__sub">
                  <span className="kai-live" />
                  Online · Knows full menu &amp; prices · Powered by Groq
                </div>
              </div>

              {itemCount > 0 && (
                <div className="kai-head__cart">🛒 {itemCount}</div>
              )}

              <button className="kai-head__settings" onClick={() => setKeyMode(v => !v)} title="API Settings">⚙️</button>
              <button className="kai-head__close" onClick={() => setOpen(false)} title="Close" aria-label="Close KAI">✕</button>
            </div>

            {/* API Key Panel */}
            {keyMode && (
              <div className="kai-keypanel">
                <div className="kai-kp__title">🔑 Groq API Key</div>
                <p className="kai-kp__desc">
                  Free at <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer">console.groq.com</a>
                  {' — or add '}
                  <code>VITE_GROQ_API_KEY=gsk_...</code>
                  {' to your '}
                  <code>.env</code> file
                </p>
                <div className="kai-kp__row">
                  <input
                    type="password"
                    value={keyDraft}
                    onChange={e => setKeyDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveKey()}
                    placeholder="gsk_..."
                    className="kai-kp__input"
                    autoFocus
                  />
                  <button className="btn btn-red" style={{ fontSize: 10, padding: '10px 18px', whiteSpace: 'nowrap' }} onClick={saveKey}>
                    Connect
                  </button>
                </div>
                {apiKey && (
                  <button className="kai-kp__remove" onClick={removeKey}>Remove saved key</button>
                )}
                {apiKey && (
                  <div className="kai-kp__status">✅ Key saved · {apiKey.slice(0,8)}...</div>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="kai-msgs">
              {msgs.map(m => (
                <div key={m.id} className={`kai-msg kai-msg--${m.role}`}>
                  {m.role === 'assistant' && (
                    <div className="kai-msg__av">🤖</div>
                  )}
                  <div className="kai-msg__wrap">
                    <div
                      className="kai-msg__bubble"
                      dangerouslySetInnerHTML={{ __html: renderText(m.content) }}
                    />
                    {m.cards && m.cards.length > 0 && (
                      <div className="kai-cards">
                        {m.cards.map(item => (
                          <MenuCard key={item.id} item={item} onAdd={addToCart} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="kai-msg kai-msg--assistant">
                  <div className="kai-msg__av">🤖</div>
                  <div className="kai-typing">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Quick prompts */}
            <div className="kai-quick">
              {QUICK.map(q => (
                <button
                  key={q.text}
                  className="kai-quick__btn"
                  onClick={() => { setInput(q.text); setTimeout(() => send(q.text), 0); }}
                >
                  {q.icon} {q.text}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div className="kai-input-area">
              <div className="kai-disclaimer">
                🧾 Orders are NOT placed online — show your receipt to the counter to start preparation
              </div>
              <div className="kai-input-row">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about menu, prices, deals — or build your order..."
                  className="kai-input"
                  disabled={loading}
                />
                <button
                  className="kai-send"
                  onClick={() => send()}
                  disabled={loading || !input.trim()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
