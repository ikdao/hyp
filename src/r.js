// Reactor r()/Derived Act dA()
// Self License - 01SL
// HYP UI Framework 
// Author: Hemang Tewari

export const r = (compute) => {
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