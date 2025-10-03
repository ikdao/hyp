// --- 1. Hyperscript ---
export const h = (ty, prp, ...chd) => {
if (!prp) prp = {};
if (prp && (typeof prp !== 'object' || prp.ty)) {
chd.unshift(prp);
prp = {};
}

const flatChildren = [];
const flatten = (arr) => {
arr.forEach(c => {
if (c == null || c === false || c === undefined) return;
if (Array.isArray(c)) { flatten(c); return; }
const t = typeof c;
if (t === 'string' || t === 'number' || t === 'boolean') {
flatChildren.push(String(c));
return;
}
if (t === 'object' && c && ('ty' in c) &&
(typeof c.ty === 'string' || typeof c.ty === 'function')) {
flatChildren.push(c);
return;
}
// Otherwise skip silently (avoid injecting functions, plain objects, symbols, etc.)
// Optionally you could warn in dev builds:
// if (process.env.NODE_ENV !== 'production') console.warn('Ignored invalid child in h():', c);
});
};
flatten(chd);
return { ty, prp, chd: flatChildren, key: prp.key || null, ref: prp.ref || null };
};
