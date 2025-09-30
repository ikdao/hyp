// ===== HYP Core =====
// Zero One One License - 011sl
// https://legal/ikdao.org/license/011sl
// Hyp UI Framework - [Hemang Tewari]

//  HYP FRAMEWORK CORE v0.1.1
// --- 1. Hyperscript ---
export const h = (ty, prp, ...chd) => {
  if (!prp) prp = {};
  if (prp && (typeof prp !== 'object' || prp.ty)) {
    chd.unshift(prp);
    prp = {};
  }

  const flatChildren = [];
  const flatten = (arr) => { arr.forEach(c => {
      if (c == null || c === false || c === undefined ) return;
      if (Array.isArray(c)) { flatten(c); return; }
      const t = typeof c;
      if (t === 'string' || t === 'number' || t === 'boolean') {
        flatChildren.push(String(c));
        return;
      }
      if (t === 'object' && c && ('ty' in c) &&
          (typeof c.ty === 'string' || typeof c.ty === 'function')) {
        flatChildren.push(c);
        return;
      }
      // Otherwise skip silently (avoid injecting functions, plain objects, symbols, etc.)
      // Optionally you could warn in dev builds:
      // if (process.env.NODE_ENV !== 'production') console.warn('Ignored invalid child in h():', c);
    });
  };
  flatten(chd);
  return{ ty, prp, chd: flatChildren, key: prp.key || null, ref: prp.ref || null};
};

// --- 1. Scheduler (s) ---
export const s = (function() {
  const pe = new Set();
  let fR = false;
  function ru() {
    pe.forEach(fn => fn());
    pe.clear();
    fR = false;
  }
  return {
    add(fn) {
      pe.add(fn);
      if (!fR) {
queueMicrotask(ru);
        fR = true;
      }
    }
  };
})();

// --- Organiser (o)---
export const o = new Map();
let oID_counter = 0;
let oID = null;
let tr = null;

function gCI() {
  if (oID === null) throw new Error("Organiser Hooks must be inside component.");
  return oID;
};
// --- 2. Actor (a) ---
export const a = initial => {
  let value = initial;
  const subs = new Set();
  return {
    get: () => { if (tr) subs.add(tr); return value; },
    set: next => {
      if (next !== value) {
        value = next;
        subs.forEach(fn => s.add(fn));
    s.add(rF); 
      }
    },
    subscribe: fn => { subs.add(fn); return () => subs.delete(fn); }
  };
};
// --- Derive Act (dA) ---
export const dA = (fn) => {
  const iD = gCI();
  const inC = o.get(iD);
  const hoK = 'dA-' + inC.ei++;
  if (!inC.hk.has(hoK)) {
    const si = a(undefined);
    const recompute = () => {
      tr = recompute;
      const newValue = fn();
      tr = null;
      if (newValue !== si.get()) si.set(newValue);
    };
    recompute();
    inC.hk.set(hoK, si);
  }
  return inC.hk.get(hoK);
};

// --- Side Act (sA) ---
export const sA = (fn, depsFn = null) => {
  const iD = gCI();
  const inC = o.get(iD);
  const hoK = 'sA-' + inC.ei++;
  const runSide = () => {
    tr = runSide;
    const depsVal = depsFn ? depsFn() : null;
    tr = null;
    const prev = inC.hk.get(hoK) || {};
    const prevDeps = prev.deps;
    const depsChanged = !depsFn ||
      !prevDeps ||
      depsVal.length !== prevDeps.length ||
      depsVal.some((v, i) => v !== prevDeps[i]);
    if (depsChanged) {
      if (typeof prev.cleanup === 'function') prev.cleanup();
      const cleanup = fn();         // run effect and optionally get cleanup
      inC.hk.set(hoK, { deps: depsVal, cleanup });
    }
  };
  s.add(runSide);
};

// --- 4. Executor (e) ---
let prevVNode = null;
export const e = (vnode, container) => {
  const wC = (vN) => {
    const fn = vN.ty;
    const iD = vN.coI || ++oID_counter;
    vN.coI = iD;
    if (!o.has(iD)) {
      o.set(iD, { hk: new Map(), ei: 0 });
    }
    const oldoID = oID;
    oID = iD;
    o.get(iD).ei = 0;
    const rN = fn(vN.prp || {});
    oID = oldoID;
    return rN;
  };
  const setprp = (el, key, val) => {
    if (key === 'key' || key === 'ref') return;
    if (key.startsWith('on') && typeof val === 'function')
      el.addEventListener(key.slice(2).toLowerCase(), val);
    else if (key === 'className' || key === 'class') el.className = val || '';
    else if (key === 'style') {
      if (typeof val === 'string') el.style.cssText = val;
      else if (val) Object.assign(el.style, val);
    } else if (key in el && key !== 'list') {
      try { el[key] = val; } 
      catch { if (val != null) el.setAttribute(key, val); }
    } else {
      val == null || val === false ? el.removeAttribute(key) : el.setAttribute(key, val === true ? '' : val);
    }
  };
  const removeprp = (el, key, val) => {
    if (key.startsWith('on') && typeof val === 'function') {
      el.removeEventListener(key.slice(2).toLowerCase(), val);
    } else setprp(el, key, null);
  };
  const unmount = (vnode) => {
    if (!vnode?.coI) return;
    const ctx = o.get(vnode.coI);
    if (ctx) {
      ctx.hk.forEach(h => { if (h && typeof h.cleanup === 'function') h.cleanup(); });
      o.delete(vnode.coI);
    }
    vnode.chd?.forEach(unmount);
  };
const SVG_NS = "http://www.w3.org/2000/svg";
const createDOM = (vnode, inSVG = false) => {
  if (typeof vnode !== 'object' || vnode == null) return document.createTextNode(String(vnode));
  if (Array.isArray(vnode)) {
    const frag = document.createDocumentFragment();
    vnode.forEach(c => c != null && frag.appendChild(createDOM(c, inSVG)));
    return frag;
  }
  const { ty, prp, chd, ref } = vnode;
  if (typeof ty === 'function') {
    const rN = wC(vnode);
    vnode.chd = [rN];
    return createDOM(rN, inSVG);
  }
  const isSVG = inSVG || ty === 'svg';
  const el = isSVG
    ? document.createElementNS(SVG_NS, ty)
    : document.createElement(ty);
  if (prp) Object.keys(prp).forEach(k => {
    if (k.startsWith('on') && typeof prp[k] === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), prp[k]);
    } else if (isSVG) {
      el.setAttribute(k, prp[k]);
    } else {
      setprp(el, k, prp[k]);
    }
  });
  if (ref) typeof ref === 'function' ? ref(el) : ref.current = el;
  chd?.forEach(c => el.appendChild(createDOM(c, isSVG)));
  return el;
};

 const patch = (dom, oldV, newV) => {
  if (typeof oldV !== 'object' || oldV == null ||
      typeof newV !== 'object' || newV == null ||
      oldV.ty !== newV.ty) {
    if (oldV !== newV || oldV.ty !== newV.ty) {
      unmount(oldV);
      const newDom = createDOM(newV);
      dom.replaceWith(newDom);
      return newDom;
    }
    return dom;
  }

  if (typeof newV.ty === 'function') {
    const resultVNode = wC(newV);
    newV.chd = [resultVNode];
    return patch(dom, oldV.chd[0], resultVNode);
  }

  // --- Update prps ---
  const oldprp = oldV.prp || {};
  const newprp = newV.prp || {};
  Object.keys(oldprp).forEach(k => { if (!(k in newprp)) removeprp(dom, k, oldprp[k]); });
  Object.keys(newprp).forEach(k => {
    const oldVal = oldprp[k];
    const newVal = newprp[k];
    if (oldVal !== newVal) {
      if (k === 'value' && (dom.tagName === 'INPUT' || dom.tagName === 'TEXTAREA')) {
        if (dom.value !== newVal) dom.value = newVal;
        return;
      }
      if (k === 'checked' && dom.tagName === 'INPUT') {
        if (dom.checked !== newVal) dom.checked = newVal;
        return;
      }
      if (k.startsWith('on') && typeof oldVal === 'function') dom.removeEventListener(k.slice(2).toLowerCase(), oldVal);
      setprp(dom, k, newVal);
    }
  });

  // --- Hybrid key/index diffing for children ---
  const oldChildren = oldV.chd || [];
  const newChildren = newV.chd || [];

  // Build map of old children by key
  const oldKeyed = new Map();
  oldChildren.forEach((c, i) => {
    if (c?.prp?.key != null) oldKeyed.set(c.prp.key, { vnode: c, index: i });
  });

  const max = Math.max(oldChildren.length, newChildren.length);
  let domIndex = 0;

  for (let i = 0; i < max; i++) {
    const newC = newChildren[i];
    const oldC = newC?.prp?.key != null ? oldKeyed.get(newC.prp.key)?.vnode : oldChildren[domIndex];

    if (!oldC && newC) {
      // Create new DOM node
      const newNode = createDOM(newC);
      dom.appendChild(newNode);
      domIndex++;
    } else if (!newC && oldC) {
      // Remove old DOM node
      const domChild = dom.childNodes[domIndex];
      unmount(oldC);
      dom.removeChild(domChild);
    } else if (oldC && newC) {
      // Patch existing node
      const domChild = dom.childNodes[domIndex];
      patch(domChild, oldC, newC);
      domIndex++;
      // Remove keyed from map to avoid double-remove
      if (newC.prp?.key != null) oldKeyed.delete(newC.prp.key);
    }
  }

  // Remove leftover old keyed nodes not matched
  oldKeyed.forEach(({ vnode, index }) => {
    const domChild = dom.childNodes[index];
    if (domChild) {
      unmount(vnode);
      dom.removeChild(domChild);
    }
  });

  return dom;
};


  const targetDom = container.firstChild;
  if (!prevVNode || !targetDom) {
    container.textContent='';
    container.appendChild(createDOM(vnode));
  } else {
    patch(targetDom, prevVNode, vnode);
  }
  prevVNode = vnode;
};


const HYP = {h,e,a,sA,dA,o,s};
window.HYP = HYP;
export default HYP;
