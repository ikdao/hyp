// executor e()
// EI execution identity/instance
// render/update/unmount
// Self License - 01SL
// HYP UI Framework 
// Author: Hemang Tewari

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