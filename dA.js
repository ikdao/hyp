// Derived Act dA()
export const dA = (compute) => {
    const sig = a();
    const recompute = () => {
        tr = recompute;
        const val = compute();
        tr = null;
        sig.set(val);
    };
    recompute();
    return sig;
};
