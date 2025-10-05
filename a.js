// Actor a()

export const a = (initial) => {
  let value = initial;
  const subs = new Set();

  return {
    get() { if (tracking) subs.add(tracking); return value; },
    set(next) {
      if (next === value) return;
      value = next;
      subs.forEach(fn => s.add(fn));
    },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
  };
};