const COUNCIL_ORDER = [
  'robusca', 'cto', 'skunkworks', 'drfixit',
  'cashclaw', 'denchclaw', 'charlie',
  'research', 'openfang', 'the-lady', 'robusca'
];

const STUDEX_MEAT_ORDER = ['cashclaw', 'charlie', 'denchclaw'];

export function getRosterForSession(type: string): string[] {
  switch (type) {
    case 'council': return [...COUNCIL_ORDER];
    case 'studex-meat': return [...STUDEX_MEAT_ORDER];
    default: return ['robusca'];
  }
}
