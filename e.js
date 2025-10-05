// executor e() 

export const e = (function () {  
  
  // ---- mount organ into a body ----  
  function render(vnode, body) {  
    const hid = vnode?.ty?.name || vnode?.ty || "anonymous";  
    const eid = o.create(hid, body);  
  
    // willMount  
    o.runLifecycle(eid, "willMount");  
  
    // mount phase  
    const dom = createDomFromVNode(vnode, eid);  
    if (body) body.appendChild(dom);  
  
    // didMount  
    s.add(() => o.runLifecycle(eid, "didMount"), eid);  
  
    return eid;  
  }  
  
  // ---- patch/update organ ----  
  function patch(dom, oldVNode, newVNode, eid) {  
    if (!dom || !o.isAlive(eid)) return;  
  
    o.runLifecycle(eid, "willUpdate");  
  
    // Type or key mismatch → replace node  
    if (oldVNode.ty !== newVNode.ty || oldVNode.key !== newVNode.key) {  
      const newDom = createDomFromVNode(newVNode, eid);  
      dom.replaceWith(newDom);  
      s.add(() => o.runLifecycle(eid, "didUpdate"), eid);  
      return newDom;  
    }  
  
    // Update props  
    updateProps(dom, oldVNode.prp || {}, newVNode.prp || {});  
  
    // Update children with keyed + index diff  
    patchChildren(dom, oldVNode.chd || [], newVNode.chd || [], eid);  
  
    // Update ref if present  
    if (newVNode.ref) newVNode.ref(dom);  
  
    // didUpdate lifecycle  
    s.add(() => o.runLifecycle(eid, "didUpdate"), eid);  
  
    return dom;  
  }  
  function unmount(vnode, eid) {  
    if (!vnode) return;  
    const inst = o.get(eid);  
    if (!inst) return;  
  
    const bodyRef = inst.body; // snapshot for async safety  
  
    // pre-unmount lifecycle  
    o.runLifecycle(eid, "willUnmount");  
  
    // detach DOM  
    if (bodyRef?.parentNode)  
      bodyRef.parentNode.removeChild(bodyRef);  
  
    // schedule post-unmount lifecycle  
    s.add(() => {  
      o.runLifecycle(eid, "didUnmount", bodyRef);  
    }, eid);  
  
    // delegate cleanup + removal to organiser  
    o.deleteOrg(eid, { skipLifecycle: true });  
  }  
  
  
  // ---------------- Helper functions ----------------  
  function createDomFromVNode(v, eid) {  
    if (v == null) return document.createTextNode("");  
    if (typeof v === "string" || typeof v === "number")  
      return document.createTextNode(String(v));  
  
    const el = document.createElement(v.ty);  
  
    // apply props  
    for (const [k, val] of Object.entries(v.prp || {})) {  
      if (k.startsWith("on") && typeof val === "function")  
        el.addEventListener(k.slice(2).toLowerCase(), val);  
      else el.setAttribute(k, val);  
    }  
  
    // children  
    (v.chd || []).forEach(ch => {  
      el.appendChild(createDomFromVNode(ch, eid));  
    });  
  
    // ref assignment  
    if (v.ref) v.ref(el);  
  
    return el;  
  }  
  
  function updateProps(dom, oldProps, newProps) {  
    // Remove old props  
    for (const k in oldProps) {  
      if (!(k in newProps)) {  
        if (k.startsWith("on") && typeof oldProps[k] === "function")  
          dom.removeEventListener(k.slice(2).toLowerCase(), oldProps[k]);  
        else  
          dom.removeAttribute(k);  
      }  
    }  
  
    // Add/update new props  
    for (const [k, v] of Object.entries(newProps)) {  
      if (oldProps[k] !== v) {  
        if (k.startsWith("on") && typeof v === "function") {  
          if (oldProps[k]) dom.removeEventListener(k.slice(2).toLowerCase(), oldProps[k]);  
          dom.addEventListener(k.slice(2).toLowerCase(), v);  
        } else {  
          dom.setAttribute(k, v);  
        }  
      }  
    }  
  }  
  
  function patchChildren(dom, oldCh, newCh, eid) {  
    const oldKeyed = new Map();  
    const usedIndices = new Set();  
  
    // Build a map of old keyed children  
    oldCh.forEach((c, i) => {  
      if (c && c.key != null) oldKeyed.set(c.key, { vnode: c, index: i });  
    });  
  
    // Patch or insert new children  
    newCh.forEach((nV, newIndex) => {  
      let matched;  
      if (nV.key != null) {  
        matched = oldKeyed.get(nV.key);  
        if (matched) {  
          const childNode = dom.childNodes[matched.index];  
          patch(childNode, matched.vnode, nV, eid);  
          usedIndices.add(matched.index);  
  
          // Move node if necessary  
          const refNode = dom.childNodes[newIndex] || null;  
          if (childNode !== refNode) {  
            dom.insertBefore(childNode, refNode);  
          }  
        } else {  
          // New keyed node  
          const el = createDomFromVNode(nV, eid);  
          const refNode = dom.childNodes[newIndex] || null;  
          dom.insertBefore(el, refNode);  
        }  
      } else {  
        // Index-based diffing for unkeyed nodes  
        const oldNode = dom.childNodes[newIndex];  
        if (oldNode && !usedIndices.has(newIndex)) {  
          patch(oldNode, oldCh[newIndex], nV, eid);  
        } else if (!oldNode) {  
          dom.appendChild(createDomFromVNode(nV, eid));  
        }  
      }  
  
      // Assign ref  
      if (nV.ref) {  
        const currentNode = dom.childNodes[newIndex];  
        if (currentNode) nV.ref(currentNode);  
      }  
    });  
  
    // Remove old nodes not reused (reverse iteration for live NodeList safety)  
    for (let i = oldCh.length - 1; i >= 0; i--) {  
      const oV = oldCh[i];  
      if (!usedIndices.has(i) && (!oV.key || !newCh.find(n => n.key === oV.key))) {  
        const node = dom.childNodes[i];  
        if (node) dom.removeChild(node);  
      }  
    }  
  }  
  
  
  // ---- expose ----  
  return { render, patch, unmount };  
})();  
 