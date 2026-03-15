/**
 * KAJUN CHICKEN & SEAFOOD — Admin Store v5
 * Designed & Built by ZAI (Zawwar Sami)
 * github.com/zawwarsami16
 * All Rights Reserved © 2025 Zawwar Sami
 *
 * Persistence: JSONBin.io (free cloud storage)
 * Falls back to localStorage if cloud unavailable
 */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { MENU } from '../data/menu';
import { COUPONS as BASE_COUPONS, DAILY_SPECIALS as BASE_SPECIALS } from '../data/specials';

const LOCAL_KEY = 'kajun_admin_v5';
const AUTH_KEY  = 'kajun_auth_v5';

// JSONBin config — free at jsonbin.io
// Admin sets this once in Branding tab
const JSONBIN_URL = 'https://api.jsonbin.io/v3/b';

const DEFAULT = {
  unavailable: [
    'fish-tender-1','fish-tender-3','fish-tender-5','fish-nuggets-8',
    'jalapeno-shrimp','fish-sandwich','shrimp-sandwich','surf-turf',
    'chipotle-bbq','onion-crunch','poutine','cauliflower-12',
    'mozz-sticks-4','mozz-sticks-6','jalapeno-fiesta','mac-cheese-6',
  ],
  priceOverrides: {},
  imageOverrides: {},
  customItems: [],
  customCoupons: [],
  activeCouponIds: ['coupon-2cd-sandwich','coupon-2cd-6tenders','coupon-2cd-6dark','coupon-10pc-dark'],
  customDeals: [],
  activeDealIds: ['mon-sandwich','tue-wed-chicken'],
  announcement: '',
  logoUrl: 'https://kajunchicken.ca/wp-content/uploads/2024/07/Kajun-Chicken_logo.png',
  siteName: 'KAJUN CHICKEN & SEAFOOD',
  footerCredit: 'Designed & Built by ZAI',
  footerGithub: 'https://github.com/zawwarsami16',
  footerRights: 'All Rights Reserved © 2025 Zawwar Sami',
  kaiGreeting: "Hey! I'm KAI — your Kajun order guide. How many people are eating today?",
  // Cloud sync config
  jsonbinId:  '69b6e5c8aa77b81da9e89e74',
  jsonbinKey: '$2a$10$N1KAZBtfevrn7vTGLtilYenMQgjbx24wHTykaftMUOTOIoGq9aspW',
};

function loadLocal() {
  try {
    const s = localStorage.getItem(LOCAL_KEY);
    if (s) {
      const p = JSON.parse(s);
      return {
        ...DEFAULT, ...p,
        unavailable:     Array.isArray(p.unavailable)     ? p.unavailable     : DEFAULT.unavailable,
        customItems:     Array.isArray(p.customItems)      ? p.customItems      : [],
        customCoupons:   Array.isArray(p.customCoupons)    ? p.customCoupons    : [],
        activeCouponIds: Array.isArray(p.activeCouponIds)  ? p.activeCouponIds  : DEFAULT.activeCouponIds,
        customDeals:     Array.isArray(p.customDeals)      ? p.customDeals      : [],
        activeDealIds:   Array.isArray(p.activeDealIds)    ? p.activeDealIds    : DEFAULT.activeDealIds,
        priceOverrides:  (p.priceOverrides  && typeof p.priceOverrides==='object')  ? p.priceOverrides  : {},
        imageOverrides:  (p.imageOverrides  && typeof p.imageOverrides==='object')  ? p.imageOverrides  : {},
      };
    }
  } catch {}
  return { ...DEFAULT };
}

const Ctx = createContext(null);

export function AdminProvider({ children }) {
  const [store, setStore]   = useState(loadLocal);
  const [authed, setAuthed] = useState(() => {
    try { return localStorage.getItem(AUTH_KEY) === '1'; } catch { return false; }
  });
  const [cloudStatus, setCloudStatus] = useState('idle'); // idle | saving | saved | error
  const saveTimer = useRef(null);

  // Always save to localStorage
  useEffect(() => {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(store)); } catch {}
  }, [store]);

  // Load from cloud on first visit (if configured)
  useEffect(() => {
    const { jsonbinId, jsonbinKey } = loadLocal();
    if (jsonbinId && jsonbinKey) {
      fetch(`${JSONBIN_URL}/${jsonbinId}/latest`, {
        headers: { 'X-Master-Key': jsonbinKey }
      })
      .then(r => r.json())
      .then(data => {
        if (data?.record) {
          const merged = {
            ...DEFAULT,
            ...data.record,
            unavailable:     Array.isArray(data.record.unavailable)     ? data.record.unavailable     : DEFAULT.unavailable,
            customItems:     Array.isArray(data.record.customItems)      ? data.record.customItems      : [],
            customCoupons:   Array.isArray(data.record.customCoupons)    ? data.record.customCoupons    : [],
            activeCouponIds: Array.isArray(data.record.activeCouponIds)  ? data.record.activeCouponIds  : DEFAULT.activeCouponIds,
            customDeals:     Array.isArray(data.record.customDeals)      ? data.record.customDeals      : [],
            activeDealIds:   Array.isArray(data.record.activeDealIds)    ? data.record.activeDealIds    : DEFAULT.activeDealIds,
            priceOverrides:  (data.record.priceOverrides && typeof data.record.priceOverrides==='object') ? data.record.priceOverrides : {},
            imageOverrides:  (data.record.imageOverrides && typeof data.record.imageOverrides==='object') ? data.record.imageOverrides : {},
          };
          setStore(merged);
        }
      })
      .catch(() => {}); // silently fall back to localStorage
    }
  }, []);

  // Save to cloud (debounced 1.5s after last change)
  const saveToCloud = useCallback((newStore) => {
    const { jsonbinId, jsonbinKey } = newStore;
    if (!jsonbinId || !jsonbinKey) return;
    clearTimeout(saveTimer.current);
    setCloudStatus('saving');
    saveTimer.current = setTimeout(() => {
      fetch(`${JSONBIN_URL}/${jsonbinId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': jsonbinKey,
        },
        body: JSON.stringify(newStore),
      })
      .then(r => r.json())
      .then(() => { setCloudStatus('saved'); setTimeout(() => setCloudStatus('idle'), 2500); })
      .catch(() => { setCloudStatus('error'); });
    }, 1500);
  }, []);

  const set = useCallback((patch) => {
    setStore(prev => {
      const next = { ...prev, ...patch };
      saveToCloud(next);
      return next;
    });
  }, [saveToCloud]);

  // Auth
  const login  = useCallback((pass) => {
    const ok = (typeof import.meta!=='undefined' && import.meta.env?.VITE_ADMIN_PASS) || 'kajun2025';
    if (pass === ok) { setAuthed(true); localStorage.setItem(AUTH_KEY,'1'); return true; }
    return false;
  }, []);
  const logout = useCallback(() => { setAuthed(false); localStorage.removeItem(AUTH_KEY); }, []);

  // Availability
  const isAvailable = useCallback((id) => !(store.unavailable||[]).includes(id), [store.unavailable]);
  const toggleItem  = useCallback((id) => {
    setStore(prev => {
      const l = (prev.unavailable||[]).includes(id)
        ? (prev.unavailable||[]).filter(x=>x!==id)
        : [...(prev.unavailable||[]),id];
      const next = { ...prev, unavailable: l };
      saveToCloud(next);
      return next;
    });
  }, [saveToCloud]);

  // Price / image overrides
  const setPrice   = useCallback((id,price) => set({ priceOverrides: { ...(store.priceOverrides||{}), [id]: parseFloat(price) } }), [set, store.priceOverrides]);
  const resetPrice = useCallback((id) => { const o={...(store.priceOverrides||{})}; delete o[id]; set({ priceOverrides: o }); }, [set, store.priceOverrides]);
  const getPrice   = useCallback((item) => { const o=store.priceOverrides||{}; return o[item.id]!==undefined ? o[item.id] : item.price; }, [store.priceOverrides]);
  const setImage   = useCallback((id,url) => set({ imageOverrides: { ...(store.imageOverrides||{}), [id]: url } }), [set, store.imageOverrides]);
  const resetImage = useCallback((id) => { const o={...(store.imageOverrides||{})}; delete o[id]; set({ imageOverrides: o }); }, [set, store.imageOverrides]);
  const getImage   = useCallback((item) => { const o=store.imageOverrides||{}; return o[item.id]||item.image; }, [store.imageOverrides]);

  // Custom items
  const addCustomItem    = useCallback((item) => set({ customItems: [...(store.customItems||[]), {...item,id:'custom-'+Date.now(),custom:true}] }), [set, store.customItems]);
  const editCustomItem   = useCallback((id,u) => set({ customItems: (store.customItems||[]).map(i=>i.id===id?{...i,...u}:i) }), [set, store.customItems]);
  const removeCustomItem = useCallback((id) => set({ customItems: (store.customItems||[]).filter(i=>i.id!==id) }), [set, store.customItems]);

  // Coupons
  const toggleBaseCoupon   = useCallback((id) => { const ids=(store.activeCouponIds||[]).includes(id)?(store.activeCouponIds||[]).filter(x=>x!==id):[...(store.activeCouponIds||[]),id]; set({activeCouponIds:ids}); }, [set,store.activeCouponIds]);
  const isCouponActive     = useCallback((id) => { const c=(store.customCoupons||[]).find(x=>x.id===id); if(c) return c.active!==false; return (store.activeCouponIds||[]).includes(id); }, [store]);
  const addCoupon          = useCallback((c) => set({ customCoupons:[...(store.customCoupons||[]),{...c,id:'coupon-custom-'+Date.now(),active:true}] }), [set,store.customCoupons]);
  const editCoupon         = useCallback((id,u) => set({ customCoupons:(store.customCoupons||[]).map(c=>c.id===id?{...c,...u}:c) }), [set,store.customCoupons]);
  const deleteCoupon       = useCallback((id) => set({ customCoupons:(store.customCoupons||[]).filter(c=>c.id!==id) }), [set,store.customCoupons]);
  const toggleCustomCoupon = useCallback((id) => set({ customCoupons:(store.customCoupons||[]).map(c=>c.id===id?{...c,active:!c.active}:c) }), [set,store.customCoupons]);

  // Deals
  const toggleBaseDeal = useCallback((id) => { const ids=(store.activeDealIds||[]).includes(id)?(store.activeDealIds||[]).filter(x=>x!==id):[...(store.activeDealIds||[]),id]; set({activeDealIds:ids}); }, [set,store.activeDealIds]);
  const isDealActive   = useCallback((id) => { const d=(store.customDeals||[]).find(x=>x.id===id); if(d) return d.active!==false; return (store.activeDealIds||[]).includes(id); }, [store]);
  const addDeal        = useCallback((d) => set({ customDeals:[...(store.customDeals||[]),{...d,id:'deal-custom-'+Date.now(),active:true}] }), [set,store.customDeals]);
  const editDeal       = useCallback((id,u) => set({ customDeals:(store.customDeals||[]).map(d=>d.id===id?{...d,...u}:d) }), [set,store.customDeals]);
  const deleteDeal     = useCallback((id) => set({ customDeals:(store.customDeals||[]).filter(d=>d.id!==id) }), [set,store.customDeals]);

  const setAnnouncement = useCallback((msg) => set({ announcement: msg }), [set]);
  const setBranding     = useCallback((patch) => set(patch), [set]);

  const allCoupons     = [...BASE_COUPONS, ...(store.customCoupons||[])];
  const visibleCoupons = allCoupons.filter(c => isCouponActive(c.id));
  const allDeals       = [...BASE_SPECIALS, ...(store.customDeals||[])];
  const visibleDeals   = allDeals.filter(d => isDealActive(d.id));
  const fullMenu       = [...MENU, ...(store.customItems||[])];
  const resetAll       = useCallback(() => { setStore({...DEFAULT}); saveToCloud({...DEFAULT}); }, [saveToCloud]);

  return (
    <Ctx.Provider value={{
      store, authed, fullMenu, allCoupons, visibleCoupons, allDeals, visibleDeals,
      cloudStatus,
      login, logout,
      isAvailable, toggleItem,
      setPrice, resetPrice, getPrice,
      setImage, resetImage, getImage,
      addCustomItem, editCustomItem, removeCustomItem,
      toggleBaseCoupon, isCouponActive,
      addCoupon, editCoupon, deleteCoupon, toggleCustomCoupon,
      toggleBaseDeal, isDealActive,
      addDeal, editDeal, deleteDeal,
      setAnnouncement, setBranding, set,
      resetAll,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAdmin = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAdmin must be inside AdminProvider');
  return c;
};
