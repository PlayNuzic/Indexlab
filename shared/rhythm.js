export function generateITPermutations(iT) {
  if (!Number.isInteger(iT) || iT < 1 || iT > 9) return [];
  const result = [];
  function recurse(remaining, combo) {
    if (remaining === 0) {
      result.push(combo);
      return;
    }
    for (let i = 1; i <= remaining; i++) {
      recurse(remaining - i, [...combo, i]);
    }
  }
  recurse(iT, []);
  return result;
}
