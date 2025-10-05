// Scheduler s()
// HYP UIl framework 

export const s = (function () {  
  const pending = new Set();  
  let flushing = false;  
  
  function flush() {  
    flushing = false;  
    const tasks = Array.from(pending);  
    pending.clear();  
    for (const task of tasks) {  
      try { task.fn(); }  
      catch (err) { console.error("Scheduler task error:", err); }  
    }  
  }  
  
  return {  
    add(fn, eid) {  
      if (eid && !o.isAlive(eid)) return;  
      pending.add({ fn, eid });  
      if (!flushing) {  
        queueMicrotask(flush);  
        flushing = true;  
      }  
    },  
  
    flush() { flush(); },  
  
    cleanupFor(eid) {  
      for (const task of [...pending]) {  
        if (task.eid === eid) pending.delete(task);  
      }  
    }  
  };  
})();  
  