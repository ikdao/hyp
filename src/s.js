// SCHEDULER (s)    
// Temporal Layer — queues & runs tasks efficiently    
// Self License - 01SL
// HYP UI Framework 
// Author: Hemang Tewari

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
