// HYP UI Framework

// Zero One One License - 011sl
// https://legal/ikdao.org/license/011sl
// Hyp UI Framework - [Hemang Tewari]

// HYP Organ Factory h()
// --- 1. Hyperscript h() ---

export const h = (ty, prp, ...chd) => {
  // Normalize props & children
  if (prp == null || typeof prp !== "object" || Array.isArray(prp)) {
    chd.unshift(prp);
    prp = {};
  }

  // 🔁 Iterative (stack-safe) flattening
  const stack = [...chd];
  const flatChildren = [];

  while (stack.length > 0) {
    const item = stack.pop();
    if (item == null || item === false) continue;

    if (Array.isArray(item)) {
      // Push in reverse to preserve order
      for (let i = item.length - 1; i >= 0; i--) {
        stack.push(item[i]);
      }
    } else if (item instanceof Actor) {
      flatChildren.push(item);
    } else if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
      flatChildren.push(String(item));
    } else if (typeof item === "object" && item.ty) {
      flatChildren.push(item);
    } else if (typeof item === "function") {
      flatChildren.push(item());
    } else {
      flatChildren.push(String(item));
    }
  }

  flatChildren.reverse(); // because we popped in reverse

  // Handle component (function as type)
  if (typeof ty === "function") {
    return ty({ ...prp, children: flatChildren });
  }

  // Handle element
  return {
    ty,
    prp,
    chd: flatChildren,
    key: prp.key ?? null,
    ref: prp.ref ?? null,
  };
};

// HYP Triad Architectural Pattern
// spatial/temporal/execution

//  SCHEDULER (s)    
//  Temporal Layer — queues & runs tasks efficiently    

export const s = (function () {
    const left = new Set();
    let flushing = false;

    function flush() {
        flushing = false;
        const tasks = Array.from(left);
        left.clear();
        for (const task of tasks) {
            try { task.fn(); }
            catch (err) { console.error("Scheduler task error:", err); }
        }
    }

    return {
        add(fn, ei) {
            if (ei && !o.isAlive(ei)) return;
            left.add({ fn, ei });
            if (!flushing) {
                queueMicrotask(flush);
                flushing = true;
            }
        },

        flush() { flush(); },

        clear(ei) {
            for (const task of [...left]) {
                if (task.ei === ei) left.delete(task);
            }
        }
    };
})();

//  ORGANISER (o)    
//  Structural Layer — Organise Organs, keep identities and map

export const o = (function () {
    const organs = new Map();
    let nextEi = 1;

    function newEi() { return "ei_" + nextEi++; }

    return {
        create(hi, body) {
            const ei = newEi();
            organs.set(ei, {
                hi,
                body,
                ctx: new Map(),
                mounted: true,
                lifecycles: {
                    willMount: [], didMount: [],
                    willUpdate: [], didUpdate: [],
                    willUnmount: [], didUnmount: []
                },
                effects: new Set()
            });
            return ei;
        },
        addLifecycle(ei, phase, fn) {
            const inst = organs.get(ei);
            if (inst) inst.lifecycles[phase].push(fn);
        },
        runLifecycle(ei, phase, bodyRef) {
            const inst = organs.get(ei);
            if (!inst) return;
            const list = inst.lifecycles[phase];
            if (!list) return;
            for (const fn of list)
                s.add(() => fn(bodyRef), ei);
        },
        addEffect(ei, clear) {
            const inst = organs.get(ei);
            if (inst) inst.effects.add({ clear });
        },
        destroy(ei, { runLifecycle = true } = {}) {
            const inst = organs.get(ei);
            if (!inst) return;

            inst.mounted = false;

            if (runLifecycle) {
                this.runLifecycle(ei, "willUnmount");
                s.add(() => this.runLifecycle(ei, "didUnmount"), ei);
            }

            if (inst.effects) {
                for (const ef of inst.effects)
                    if (typeof ef.clear === "function") {
                        try { ef.clear(); }
                        catch (err) { console.error("Effect clear error:", err); }
                    }
            }
            organs.delete(ei);
            s.clear(ei);
        },
        get(ei) { return organs.get(ei); },
        has(ei) { return organs.has(ei); },
        isAlive(ei) {
            const inst = organs.get(ei);
            return inst ? inst.mounted : false;
        },
        all() { return organs; }
    };
})();

// executor e()
// EI execution identity/instance
// render/update/unmount

export const e = (function () {
    const execStack = [];

    function pushEI(ei) { execStack.push(ei); }
    function popEI() { execStack.pop(); }
    function currentEI() { return execStack[execStack.length - 1] || null; }

    function render(vnode, body) {
        const hi = vnode?.ty?.name || vnode?.ty || "anonymous";
        const ei = o.create(hi, body);
        pushEI(ei);
        o.runLifecycle(ei, "willMount");
        const dom = createDom(vnode, ei);
        if (body) body.appendChild(dom);
        s.add(() => o.runLifecycle(ei, "didMount"), ei);
        popEI();
        return ei;
    }

            function patch(dom, oldVNode, newVNode, ei) {
                // Guard: invalid DOM or dead instance
                if (!dom || !o.isAlive(ei)) return dom;

                if (oldVNode == null) {
                    const newDom = createDom(newVNode, ei);
                    dom.replaceWith(newDom);
                    s.add(() => o.runLifecycle(ei, "didUpdate"), ei);
                    return newDom;
                }

                if (newVNode == null) {
                    dom.remove();
                    return null;
                }

                pushEI(ei);
                o.runLifecycle(ei, "willUpdate");

                // Type or key changed → full replace
                if (oldVNode.ty !== newVNode.ty || oldVNode.key !== newVNode.key) {
                    const newDom = createDom(newVNode, ei);
                    dom.replaceWith(newDom);
                    s.add(() => o.runLifecycle(ei, "didUpdate"), ei);
                    popEI();
                    return newDom;
                }

                // Handle reactive text nodes (Actor)
                if (oldVNode instanceof Actor && newVNode instanceof Actor) {
                    dom.data = newVNode.get();
                    s.add(() => o.runLifecycle(ei, "didUpdate"), ei);
                    popEI();
                    return dom;
                }

                // Handle primitive text nodes
                if ((typeof oldVNode === "string" || typeof oldVNode === "number") &&
                    (typeof newVNode === "string" || typeof newVNode === "number")) {
                    const newVal = String(newVNode);
                    if (dom.data !== newVal) dom.data = newVal;
                    s.add(() => o.runLifecycle(ei, "didUpdate"), ei);
                    popEI();
                    return dom;
                }

                // Update props and children
                updateprps(dom, oldVNode.prp || {}, newVNode.prp || {});
                patchChildren(dom, oldVNode.chd || [], newVNode.chd || [], ei);

                // Handle ref
                if (newVNode.ref) newVNode.ref(dom);

                s.add(() => o.runLifecycle(ei, "didUpdate"), ei);
                popEI();

                return dom;
            }

    function unmount(vnode = null, ei) {
        const inst = o.get(ei);
        if (!inst) return;
        pushEI(ei);
        const bodyRef = inst.body;

        o.runLifecycle(ei, "willUnmount");
        if (bodyRef?.parentNode)
            bodyRef.parentNode.removeChild(bodyRef);

        s.add(() => o.runLifecycle(ei, "didUnmount", bodyRef), ei);

        o.destroy(ei, { runLifecycle: false });
        popEI();
    }


    function createDom(v, ei) {
        // null or primitive → text node  
        if (v == null) return document.createTextNode("");
        if (typeof v === "string" || typeof v === "number")
            return document.createTextNode(String(v));

        // Reactive text node (Actor or dA)  
        if (v instanceof Actor) {
            const textNode = document.createTextNode(v.get());
            const update = () => { textNode.data = v.get(); };
            const unsub = v.subscribe(update);
            // tie cleanup to organiser (o)  
            if (ei) o.addEffect(ei, unsub);
            return textNode;
        }

        const el = document.createElement(v.ty);

        for (const [k, val] of Object.entries(v.prp || {})) {
            if (k.startsWith("on") && typeof val === "function") {
                el.addEventListener(k.slice(2).toLowerCase(), val);
                continue;
            }
            if (k === "style" && typeof val === "object") {
                for (const [sk, sv] of Object.entries(val)) {
                    if (sv instanceof Actor) {
                        const updateStyle = () => { el.style[sk] = sv.get(); };
                        updateStyle();
                        const unsub = sv.subscribe(updateStyle);
                        if (ei) o.addEffect(ei, unsub);
                    } else {
                        el.style[sk] = sv;
                    }
                }
                continue;
            }
            if (val instanceof Actor) {
                const updateAttr = () => {
                    const next = val.get();
                    if (k in el) el[k] = next;
                    else el.setAttribute(k, next);
                };
                updateAttr();
                const unsub = val.subscribe(updateAttr);
                if (ei) o.addEffect(ei, unsub);
                continue;
            }

            if (k in el) el[k] = val;
            else el.setAttribute(k, val);
        }

        (v.chd || []).forEach(ch => {
            el.appendChild(createDom(ch, ei));
        });

        if (v.ref) v.ref(el);

        return el;
    }

    function updateprps(dom, oldprps, newprps) {
        for (const k in oldprps) {
            if (!(k in newprps)) {
                if (k.startsWith("on") && typeof oldprps[k] === "function")
                    dom.removeEventListener(k.slice(2).toLowerCase(), oldprps[k]);
                else
                    dom.removeAttribute(k);
            }
        }

        for (const [k, v] of Object.entries(newprps)) {
            if (oldprps[k] !== v) {
                if (k.startsWith("on") && typeof v === "function") {
                    if (oldprps[k]) dom.removeEventListener(k.slice(2).toLowerCase(), oldprps[k]);
                    dom.addEventListener(k.slice(2).toLowerCase(), v);
                } else {
                    dom.setAttribute(k, v);
                }
            }
        }
    }

            function patchChildren(dom, oldCh, newCh, ei) {
                const oldKeyed = new Map();
                const usedKeys = new Set();

                // Index old children by key (skip non-keyed)
                oldCh.forEach((c, i) => {
                    if (c && c.key != null) {
                        oldKeyed.set(c.key, { vnode: c, dom: dom.childNodes[i], index: i });
                    }
                });

                const newDoms = [];

                // Process each new child
                for (let i = 0; i < newCh.length; i++) {
                    const newV = newCh[i];
                    let newDom;

                    if (newV && newV.key != null) {
                        // Keyed node: try to reuse
                        const oldEntry = oldKeyed.get(newV.key);
                        if (oldEntry && oldEntry.dom) {
                            newDom = patch(oldEntry.dom, oldEntry.vnode, newV, ei);
                            usedKeys.add(newV.key);
                        } else {
                            // Create new
                            newDom = createDom(newV, ei);
                        }
                    } else {
                        // Non-keyed: patch by index if possible
                        const oldV = oldCh[i];
                        const oldDom = dom.childNodes[i];
                        if (oldDom && oldV != null) {
                            newDom = patch(oldDom, oldV, newV, ei);
                        } else if (oldDom) {
                            // Replace with new content
                            newDom = createDom(newV, ei);
                            oldDom.replaceWith(newDom);
                        } else {
                            // Append new
                            newDom = createDom(newV, ei);
                        }
                    }

                    newDoms.push(newDom);
                }

                // Update DOM order to match newDoms
                for (let i = 0; i < newDoms.length; i++) {
                    const nextDom = dom.childNodes[i];
                    if (nextDom !== newDoms[i]) {
                        dom.insertBefore(newDoms[i], nextDom || null);
                    }
                }

                // Remove unused keyed nodes
                for (const [key, entry] of oldKeyed) {
                    if (!usedKeys.has(key) && entry.dom) {
                        entry.dom.remove();
                    }
                }

                // Remove extra non-keyed nodes at the end
                while (dom.childNodes.length > newCh.length) {
                    dom.lastChild.remove();
                }
            }

    return { render, patch, unmount, pushEI, popEI, currentEI };
})();

// Active/Reactive/Interactive Parts

// Actor a() 
let tr = null;
export class Actor {
    constructor(initial) {
        this.value = initial;
        this.subs = new Set();
    }
    get() {
        if (tr) this.subs.add(tr);
        return this.value;
    }
    set(next) {
        if (next === this.value) return;
        this.value = next;
        this.subs.forEach(fn => s.add(fn));
    }
    subscribe(fn) {
        this.subs.add(fn);
        return () => this.subs.delete(fn);
    }
}
export const a = (initial) => new Actor(initial);

// Reactor r()/Derived Act dA()
export const r = (compute) => {
    const sig = a();
    const recompute = () => {
        tr = recompute;
        const val = compute();
        tr = null;
        sig.set(val);
    };
    recompute();
    return sig;
};

// Interactor i()/Side Act sA()
export const i = (effect, explicitEI = null) => {
  const ei = explicitEI ?? e.currentEI();
  if (!ei) return;
  let cleanup; // Track previous effect cleanup
  const run = () => {
    if (cleanup) {
      try { cleanup(); } catch (err) { console.error("sA cleanup error:", err); }
    }
    tr = run;
    cleanup = effect();
    tr = null;
    if (cleanup) o.addEffect(ei, cleanup);
  };
  run();
};

/* ---- Utilities -------------------------------- */

function parseQuery(search) {
  return Object.fromEntries(new URLSearchParams(search || ""));
}

function compileMatcher(pattern) {
  const keys = [];
  const regex = new RegExp(
    "^" +
      pattern
        .replace(/\/+$/, "")
        .replace(/:([^/]+)/g, (_, k) => {
          keys.push(k);
          return "([^/]+)";
        }) +
      "$"
  );

  return (path) => {
    const m = path.replace(/\/+$/, "").match(regex);
    if (!m) return null;
    const params = {};
    keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
    return params;
  };
}

/* ---- Navigator factory -------------- */

export function createNavigator({
  url = null,
  historyEnabled = true
} = {}) {
  const initialURL = url
    ? new URL(url, "http://localhost")
    : typeof window !== "undefined"
      ? window.location
      : { pathname: "/", search: "" };

  /* path is ALWAYS a string */
  const path = a(String(initialURL.pathname));
  const query = a(parseQuery(initialURL.search));
  const params = a({});

  /* async state */
  const loading = a(false);
  const error = a(null);

  const routes = [];
  let beforeEach = null;

  /* canonical path setter */
  function setPath(next) {
    if (typeof next !== "string") {
      console.warn("[navigator] path must be string, got:", next);
      next = String(next);
    }
    path.set(next);
  }

  function syncFromLocation() {
    if (typeof window === "undefined") return;
    setPath(window.location.pathname);
    query.set(parseQuery(window.location.search));
    matchRoutes();
  }

  function matchRoutes() {
    const p = path.get();
    for (const r of routes) {
      const res = r.match(p);
      if (res) {
        params.set(res);
        return r;
      }
    }
    params.set({});
    return null;
  }

  async function navigate(to, replace = false) {
    const from = path.get();
    const target = String(to);

    /* Guards */
    if (beforeEach) {
      const result = await beforeEach(target, from);
      if (result === false) return;
      if (typeof result === "string") {
        return navigate(result, true);
      }
    }

    if (typeof window !== "undefined" && historyEnabled) {
      if (replace) history.replaceState(null, "", target);
      else history.pushState(null, "", target);
    }

    setPath(target);
    matchRoutes();
  }

  if (typeof window !== "undefined" && historyEnabled) {
    window.addEventListener("popstate", syncFromLocation);
  }

  /* -------- 4: async resolve ---------------- */

  async function resolveAsync() {
    loading.set(true);
    error.set(null);

    try {
      const r = matchRoutes();
      if (!r) {
        loading.set(false);
        return null;
      }

      let view = r.view;

      // Allow lazy / async route views
      if (typeof view === "function") {
        const res = view();
        view = res instanceof Promise ? await res : res;
      }

      loading.set(false);
      return view;
    } catch (err) {
      error.set(err);
      loading.set(false);
      throw err;
    }
  }

  return {
    /* Reactive state */
    path,
    query,
    params,
    loading,
    error,

    /* Routing table */
    route(pattern, view) {
      routes.push({
        pattern,
        view,
        match: compileMatcher(pattern)
      });
    },

    /* Navigation */
    go(to) {
      return navigate(to, false);
    },

    replace(to) {
      return navigate(to, true);
    },

    back() {
      if (typeof window !== "undefined") history.back();
    },

    forward() {
      if (typeof window !== "undefined") history.forward();
    },

    /* Guards */
    beforeEach(fn) {
      beforeEach = fn;
    },

    /* Sync resolve (unchanged) */
    resolve() {
      const r = matchRoutes();
      return r ? r.view : null;
    },

    /* Async resolve (NEW) */
    resolveAsync
  };
}

export const n = createNavigator();

const HYP = { h, e, o, s, a, r, i, n };
window.HYP = HYP;
export default HYP;
