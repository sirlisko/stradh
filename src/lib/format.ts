const numerals: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function toRoman(n: number): string {
  let out = '';
  for (const [value, symbol] of numerals) {
    while (n >= value) {
      out += symbol;
      n -= value;
    }
  }
  return out;
}

export function longDate(d: Date): string {
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}
