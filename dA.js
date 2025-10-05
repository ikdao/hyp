// Derived Act dA()

export const dA = (compute) => {
  const sig = a();
  const recompute = () => {
    tracking = recompute;
    const val = compute();
    tracking = null;
    sig.set(val);
  };
  recompute();
  return sig;
};