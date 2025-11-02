
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
        if (!dom || !o.isAlive(ei)) return;
        pushEI(ei);
        o.runLifecycle(ei, "willUpdate");

        if (oldVNode.ty !== newVNode.ty || oldVNode.key !== newVNode.key) {
            const newDom = createDom(newVNode, ei);
            dom.replaceWith(newDom);
            s.add(() => o.runLifecycle(ei, "didUpdate"), ei);
            popEI();
            return newDom;
        }

        if (oldVNode instanceof Actor && newVNode instanceof Actor) {
            dom.data = newVNode.get();
            s.add(() => o.runLifecycle(ei, "didUpdate"), ei);
            popEI();
            return dom;
        }
        if ((typeof oldVNode === "string" || typeof oldVNode === "number") &&
            (typeof newVNode === "string" || typeof newVNode === "number")) {
            const newVal = String(newVNode);
            if (dom.data !== newVal) dom.data = newVal;
            s.add(() => o.runLifecycle(ei, "didUpdate"), ei);
            popEI();
            return dom;
        }
        updateprps(dom, oldVNode.prp || {}, newVNode.prp || {});
        patchChildren(dom, oldVNode.chd || [], newVNode.chd || [], ei);

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
