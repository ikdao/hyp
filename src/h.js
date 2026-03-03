// HYP Organ Factory h()
// Self License - 01SL
// HYP UI Framework 
// Author: Hemang Tewari

// --- 1. Hyperscript h() ---

export const h = (ty, prp, ...chd) => {
  // Normalize props & children
  if (prp == null || typeof prp !== "object" || Array.isArray(prp)) {
    chd.unshift(prp);
    prp = {};
  }

  // 🔁 Iterative (stack-safe) flattening
  const stack = [...chd];
  const flatChildren = [];

  while (stack.length > 0) {
    const item = stack.pop();
    if (item == null || item === false) continue;

    if (Array.isArray(item)) {
      // Push in reverse to preserve order
      for (let i = item.length - 1; i >= 0; i--) {
        stack.push(item[i]);
      }
    } else if (item instanceof Actor) {
      flatChildren.push(item);
    } else if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
      flatChildren.push(String(item));
    } else if (typeof item === "object" && item.ty) {
      flatChildren.push(item);
    } else if (typeof item === "function") {
      flatChildren.push(item());
    } else {
      flatChildren.push(String(item));
    }
  }

  flatChildren.reverse(); // because we popped in reverse

  // Handle component (function as type)
  if (typeof ty === "function") {
    return ty({ ...prp, children: flatChildren });
  }

  // Handle element
  return {
    ty,
    prp,
    chd: flatChildren,
    key: prp.key ?? null,
    ref: prp.ref ?? null,
  };
};
