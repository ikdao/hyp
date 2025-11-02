
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
