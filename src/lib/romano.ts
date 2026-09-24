const simboli: [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
];

export function romano(n: number): string {
  let out = '';
  for (const [valore, simbolo] of simboli) {
    while (n >= valore) {
      out += simbolo;
      n -= valore;
    }
  }
  return out;
}

export function dataLunga(d: Date): string {
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
}
