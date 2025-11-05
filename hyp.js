// HYP UI Framework

// Zero One One License - 011sl
// https://legal/ikdao.org/license/011sl
// Hyp UI Framework - [Hemang Tewari]

// HYP Organ Factory h()
// --- 1. Hyperscript h() ---

export const h = (ty, prp, ...chd) => {
    if (prp == null || typeof prp !== "object" || Array.isArray(prp)) {
        chd.unshift(prp);
        prp = {};
    }

    const flatChildren = [];
    const flatten = (arr) => {
        for (const c of arr) {
            if (c == null || c === false) continue;

            if (Array.isArray(c)) {
                flatten(c);
            }
            else if (c instanceof Actor) {
                flatChildren.push(c);
            }
            else if (typeof c === "string" || typeof c === "number" || typeof c === "boolean") {
                flatChildren.push(String(c));
            }
            else if (typeof c === "object" && c.ty) {
                flatChildren.push(c);
            }
            else if (typeof c === "function") {
                flatChildren.push(c());
            }
            else {
                flatChildren.push(String(c));
            }
        }
    };
    flatten(chd);

    if (typeof ty === "function") {
        return ty({ ...prp, children: flatChildren });
    }
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
        const usedIndices = new Set();

        oldCh.forEach((c, i) => {
            if (c && c.key != null) oldKeyed.set(c.key, { vnode: c, index: i });
        });

        newCh.forEach((nV, newIndex) => {
            let matched;
            const oldNode = dom.childNodes[newIndex];

            if (nV.key != null) {
                matched = oldKeyed.get(nV.key);
                if (matched) {
                    const childNode = dom.childNodes[matched.index];
                    patch(childNode, matched.vnode, nV, ei);
                    usedIndices.add(matched.index);

                    const refNode = dom.childNodes[newIndex] || null;
                    if (childNode !== refNode) dom.insertBefore(childNode, refNode);
                    return;
                } else {
                    const el = createDom(nV, ei);
                    const refNode = dom.childNodes[newIndex] || null;
                    dom.insertBefore(el, refNode);
                    return;
                }
            }

            if (nV instanceof Actor) {
                if (oldNode && oldCh[newIndex] instanceof Actor) {
                    // update text node directly
                    oldNode.data = nV.get();
                } else {
                    const newNode = createDom(nV, ei);
                    if (oldNode) dom.replaceChild(newNode, oldNode);
                    else dom.appendChild(newNode);
                }
                return;
            }

            // Normal patching for primitives/elements
            if (oldNode && !usedIndices.has(newIndex)) {
                patch(oldNode, oldCh[newIndex], nV, ei);
            } else if (!oldNode) {
                dom.appendChild(createDom(nV, ei));
            }

            // update ref if present
            if (nV.ref) {
                const currentNode = dom.childNodes[newIndex];
                if (currentNode) nV.ref(currentNode);
            }
        });

        // remove excess old nodes
        for (let i = oldCh.length - 1; i >= 0; i--) {
            const oV = oldCh[i];
            if (!usedIndices.has(i) && (!oV.key || !newCh.find(n => n.key === oV.key))) {
                const node = dom.childNodes[i];
                if (node) dom.removeChild(node);
            }
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

// Derived Act dA()
export const dA = (compute) => {
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

// Side Act sA()
export const sA = (effect, depsFn = null, explicitEI = null) => {
    const ei = explicitEI ?? e.currentEI(); // fallback to currentEI
    if (!ei) return;
    const inst = o.get(ei);
    if (!inst) return;

    if (!inst.ctx.has('sA-hooks')) inst.ctx.set('sA-hooks', new Map());
    const hk = inst.ctx.get('sA-hooks');
    const key = `sA-${hk.size}`;

    const isEqualDeps = (a, b) => {
        if (!a || !b || a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!Object.is(a[i], b[i])) return false;
        }
        return true;
    };
    let unsubscribers = [];
    const run = () => {
        tr = run;
        const deps = depsFn ? depsFn() : [];
        tr = null;

        const prev = hk.get(key);
        const changed = !prev || !isEqualDeps(deps, prev.deps);

        if (changed) {
            // cleanup previous effect and Actor subscriptions
            prev?.clear?.();
            unsubscribers.forEach(u => u());
            unsubscribers = [];

            // run effect
            const clear = effect();
            hk.set(key, { deps, clear });
            if (clear) inst.effects.add({ clear });

            // auto re-run if any Actor deps change
            for (const d of deps) {
                if (d instanceof Actor) {
                    const unsub = d.subscribe(() => s.add(run, ei));
                    unsubscribers.push(unsub);
                    if (ei) o.addEffect(ei, unsub);
                }
            }
        }
    };
    run();
    s.add(run, ei);
};
const HYP = { h, e, o, s, a, sA, dA };
window.HYP = HYP;
export default HYP;
