//  ORGANISER (o)  
//  Structural Layer — tracks organs, lifecycles, and context  
export const o = (function () {  
  const organs = new Map();     // eid → organ instance  
  let nextEid = 1;  
  
  function newEid() { return "eid_" + nextEid++; }  
  
  return {  
  
    // --- create organ instance ---  
    create(hid, body) {  
      const eid = newEid();  
      organs.set(eid, {  
        hid,  
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
      return eid;  
    },  
  
    // --- lifecycle management ---  
    addLifecycle(eid, phase, fn) {  
      const inst = organs.get(eid);  
      if (inst) inst.lifecycles[phase].push(fn);  
    },  
  
    runLifecycle(eid, phase, bodyRef) {  
      const inst = organs.get(eid);  
      if (!inst) return;  
      const list = inst.lifecycles[phase];  
      if (!list) return;  
      for (const fn of list)  
        s.add(() => fn(bodyRef), eid);  
    },  
  
    addEffect(eid, cleanup) {  
      const inst = organs.get(eid);  
      if (inst) inst.effects.add({ cleanup });  
    },  
  
    // --- unmount / cleanup ---  
deleteOrg(eid, { runLifecycle = true } = {}) {  
  const inst = organs.get(eid);  
  if (!inst) return;  
  
  inst.mounted = false;  
  
  if (runLifecycle) {  
    this.runLifecycle(eid, "willUnmount");  
    s.add(() => this.runLifecycle(eid, "didUnmount"), eid);  
  }  
  
  if (inst.effects) {  
    for (const ef of inst.effects)  
      if (typeof ef.cleanup === "function") {  
        try { ef.cleanup(); }  
        catch (err) { console.error("Effect cleanup error:", err); }  
      }  
  }  
  
  organs.delete(eid);  
  s.cleanupFor(eid);  
},  
    // --- helpers ---  
    get(eid) { return organs.get(eid); },  
    has(eid) { return organs.has(eid); },  
    isAlive(eid) {  
      const inst = organs.get(eid);  
      return inst ? inst.mounted : false;  
    },  
    all() { return organs; }  
  };  
})();  
  