
// ===== HYP Core =====
// Adding state, and diff runner

// Define vNode h()
export const h = (ty, prp, ...chd) => {
    if (!prp) prp = {};
    if (prp && (typeof prp !== 'object' || prp.ty)) { chd.unshift(prp); prp = {}; }
    const flatChildren = [];
    const flatten = arr => arr.forEach(c => {
        if (c == null || c === false) return;
        if (Array.isArray(c)) flatten(c); else flatChildren.push(c);
    });
    flatten(chd);
    return { ty, prp, chd: flatChildren, key: prp.key || null, ref: prp.ref || null };
};
// State and Signal
export const s = initial => {
    let value = initial;
    const subs = new Set();
    return {
        get: () => value,
        set: next => {
            if (next !== value) {
                value = next;
                subs.forEach(fn => fn(value));
            }
        },
        subscribe: fn => { subs.add(fn); fn(value); return () => subs.delete(fn); }
    };
};

// ===== Deploy vNode with Diffing Runner =====
let prevVNode = null;
export const r = (vnode, container) => {
    const setProp = (el, key, val) => {
        if (key === 'key' || key === 'ref') return;
        if (key.startsWith('on') && typeof val === 'function')
            el.addEventListener(key.slice(2).toLowerCase(), val);
        else if (key === 'className' || key === 'class') el.className = val || '';
        else if (key === 'style') {
            if (typeof val === 'string') el.style.cssText = val;
            else if (val) Object.assign(el.style, val);
        }
        else if (key in el && key !== 'list') { try { el[key] = val; } catch { if (val != null) el.setAttribute(key, val); } }
        else { val == null || val === false ? el.removeAttribute(key) : el.setAttribute(key, val === true ? '' : val); }
    };

    const createDOM = vnode => {
        if (typeof vnode !== 'object' || vnode == null) return document.createTextNode(String(vnode));
        if (Array.isArray(vnode)) { const frag = document.createDocumentFragment(); vnode.forEach(c => c != null && frag.appendChild(createDOM(c))); return frag; }
        const { ty, prp, chd, ref } = vnode;
        if (typeof ty === 'function' && ty._hypComponent) return createDOM(ty._render(prp, chd));
        if (typeof ty === 'function') return createDOM(ty({ ...prp, chd }));
        const el = document.createElement(ty);
        if (prp) Object.keys(prp).forEach(k => setProp(el, k, prp[k]));
        if (ref) typeof ref === 'function' ? ref(el) : ref.current = el;
        chd?.forEach(c => el.appendChild(createDOM(c)));
        return el;
    };

    const patch = (dom, oldV, newV) => {
        if (typeof oldV !== 'object' || oldV == null || typeof newV !== 'object' || newV == null) {
            if (oldV !== newV) { const newDom = createDOM(newV); dom.replaceWith(newDom); return newDom; }
            return dom;
        }
        if (oldV.ty !== newV.ty) { const newDom = createDOM(newV); dom.replaceWith(newDom); return newDom; }
        Object.keys(oldV.prp || {}).forEach(k => !(k in newV.prp) && setProp(dom, k, null));
        Object.keys(newV.prp || {}).forEach(k => oldV.prp[k] !== newV.prp[k] && setProp(dom, k, newV.prp[k]));
        const max = Math.max(oldV.chd.length, newV.chd.length);
        for (let i = 0; i < max; i++) {
            const oldC = oldV.chd[i], newC = newV.chd[i];
            const domChild = dom.childNodes[i];
            if (!oldC && newC) dom.appendChild(createDOM(newC));
            else if (!newC && oldC) dom.removeChild(domChild);
            else if (oldC && newC) patch(domChild, oldC, newC);
        }
        return dom;
    };

    if (!prevVNode) { container.textContent=''; container.appendChild(createDOM(vnode)); }
    else patch(container.firstChild, prevVNode, vnode);
    prevVNode = vnode;
};

const HYP = { h, r, s };
window.HYP = HYP;
export default HYP;
