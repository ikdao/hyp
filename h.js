// HYP Organ Factory h()
// Hyperscript h() ---

export const h = (ty, prp, ...chd) => {
    if (prp == null || typeof prp !== "object" || Array.isArray(prp)) {
        chd.unshift(prp);
        prp = {};
    }

    const flatChildren = [];
    const flatten = (arr) => {
        for (const c of arr) {
            if (c == null || c === false) continue;

            if (Array.isArray(c)) {
                flatten(c);
            }
            else if (c instanceof Actor) {
                flatChildren.push(c);
            }
            else if (typeof c === "string" || typeof c === "number" || typeof c === "boolean") {
                flatChildren.push(String(c));
            }
            else if (typeof c === "object" && c.ty) {
                flatChildren.push(c);
            }
            else if (typeof c === "function") {
                flatChildren.push(c());
            }
            else {
                flatChildren.push(String(c));
            }
        }
    };
    flatten(chd);

    if (typeof ty === "function") {
        return ty({ ...prp, children: flatChildren });
    }
    return {
        ty,
        prp,
        chd: flatChildren,
        key: prp.key ?? null,
        ref: prp.ref ?? null,
    };
};
