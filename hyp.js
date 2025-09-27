// ===== PART 1: h() - Hyperscript (Virtual DOM Creation) =====
const h = function (ty, prp, ...chd) {
    if (prp === null || prp === undefined) {
        prp = {};
    }

    if (prp && (
        typeof prp === 'string' ||
        typeof prp === 'number' ||
        typeof prp === 'boolean' ||
        Array.isArray(prp) ||
        (typeof prp === 'object' && (prp.ty || prp.$typeof))
    )) {
        chd.unshift(prp);
        prp = {};
    }

    const flatChildren = [];
    const flattenChildren = (arr) => {
        for (let i = 0; i < arr.length; i++) {
            const child = arr[i];
            if (child === null || child === undefined || child === false) {
                continue;
            }
            if (Array.isArray(child)) {
                flattenChildren(child);
            } else {
                flatChildren.push(child);
            }
        }
    };
    flattenChildren(chd);

    return {
        ty,
        prp: prp || {},
        chd: flatChildren,
        key: prp?.key || null,
        ref: prp?.ref || null
    };
};

// ===== PART 2: r() - Run (Render Virtual DOM to Real DOM) =====
const r = function (vnode, container) {
    const setProp = (element, key, value) => {
        if (key === 'key' || key === 'ref') {
            return;
        }

        if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
        } else if (key === 'className' || key === 'class') {
            if (value) element.className = value;
        } else if (key === 'style') {
            if (typeof value === 'string') {
                element.style.cssText = value;
            } else if (value && typeof value === 'object') {
                Object.assign(element.style, value);
            }
        } else if (key === 'dangerouslySetInnerHTML') {
            if (value && value.__html) {
                element.innerHTML = value.__html;
            }
        } else if (key in element && key !== 'list') {
            try {
                element[key] = value;
            } catch (e) {
                if (value !== false && value != null) {
                    element.setAttribute(key, value);
                }
            }
        } else {
            if (value === false || value == null) {
                element.removeAttribute(key);
            } else if (value === true) {
                element.setAttribute(key, '');
            } else {
                element.setAttribute(key, String(value));
            }
        }
    };
    const createDOM = (vnode) => {
        // Handle primitive values (string, number, etc.)
        if (typeof vnode !== 'object' || vnode === null) {
            return document.createTextNode(String(vnode));
        }

        // Handle arrays (DocumentFragment)
        if (Array.isArray(vnode)) {
            const fragment = document.createDocumentFragment();
            vnode.forEach(child => {
                if (child != null) {
                    fragment.appendChild(createDOM(child));
                }
            });
            return fragment;
        }

        // Destructure vnode
        const { ty, prp, chd, ref } = vnode;

        // Handle functional components
        if (typeof ty === "function") {
            return createDOM(ty({ ...prp, chd }));
        }

        // Handle DOM elements
        const element = document.createElement(ty);

        // Apply prp
        if (prp) {
            for (const key in prp) {
                setProp(element, key, prp[key]);
            }
        }

        // Handle refs
        if (ref) {
            if (typeof ref === 'function') {
                ref(element);
            } else if (ref && typeof ref === 'object') {
                ref.current = element;
            }
        }

        // Append chd
        if (chd && chd.length > 0) {
            if (chd.length > 3) {
                const fragment = document.createDocumentFragment();
                chd.forEach(child => {
                    if (child != null) {
                        fragment.appendChild(createDOM(child));
                    }
                });
                element.appendChild(fragment);
            } else {
                chd.forEach(child => {
                    if (child != null) {
                        element.appendChild(createDOM(child));
                    }
                });
            }
        }

        return element;
    };


    container.textContent = '';
    const dom = createDOM(vnode);
    container.appendChild(dom);

    return dom;
};
