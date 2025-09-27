    // ===== PART 1: h() - Hyperscript (Virtual DOM Creation) =====
    const h = function(type, props, ...children) {
        if (props === null || props === undefined) {
            props = {};
        }
        
        if (props && (
            typeof props === 'string' || 
            typeof props === 'number' || 
            typeof props === 'boolean' ||
            Array.isArray(props) || 
            (typeof props === 'object' && (props.type || props.$typeof))
        )) {
            children.unshift(props);
            props = {};
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
        flattenChildren(children);
        
        return { 
            type, 
            props: props || {}, 
            children: flatChildren,
            key: props?.key || null,
            ref: props?.ref || null
        };
    };

    // ===== PART 2: r() - Run (Render Virtual DOM to Real DOM) =====
    const r = function(vnode, container) {
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
            if (typeof vnode !== 'object' || vnode === null) {
                return document.createTextNode(String(vnode));
            }
            
            if (Array.isArray(vnode)) {
                const fragment = document.createDocumentFragment();
                vnode.forEach(child => {
                    if (child != null) {
                        fragment.appendChild(createDOM(child));
                    }
                });
                return fragment;
            }
            
            const { type, props, children, ref } = vnode;
            const element = document.createElement(type);
            
            if (props) {
                for (const key in props) {
                    setProp(element, key, props[key]);
                }
            }
            
            if (ref) {
                if (typeof ref === 'function') {
                    ref(element);
                } else if (ref && typeof ref === 'object') {
                    ref.current = element;
                }
            }
            
            if (children && children.length > 0) {
                if (children.length > 3) {
                    const fragment = document.createDocumentFragment();
                    children.forEach(child => {
                        if (child != null) {
                            fragment.appendChild(createDOM(child));
                        }
                    });
                    element.appendChild(fragment);
                } else {
                    children.forEach(child => {
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
