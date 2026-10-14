// Utilitário de Anonimização 100% no Backend (Server-side Only)
// Garante conformidade com LGPD e segurança de dados: nenhum nome real trafega para o frontend.
// O algoritmo é determinístico (hash consistente), garantindo que o mesmo cliente real
// receba sempre o mesmo nome fictício coerente em filtros, gráficos e relatórios.

const FIRST_NAMES = [
  'Danilo', 'Camila', 'Rodrigo', 'Mariana', 'Lucas', 'Beatriz', 'Felipe', 'Juliana',
  'Rafael', 'Larissa', 'Gabriel', 'Fernanda', 'Matheus', 'Amanda', 'Leonardo', 'Bruna',
  'Thiago', 'Leticia', 'Gustavo', 'Carla', 'Eduardo', 'Patricia', 'Bruno', 'Renata',
  'Vinicius', 'Vanessa', 'Diego', 'Aline', 'Marcelo', 'Tatiane', 'Alexandre', 'Priscila'
];

const LAST_NAMES = [
  'Vieira', 'Rocha', 'Barbosa', 'Silveira', 'Mendes', 'Cardoso', 'Freitas', 'Duarte',
  'Nunes', 'Ribeiro', 'Monteiro', 'Carvalho', 'Moraes', 'Teixeira', 'Batista', 'Cavalcanti',
  'Guimaraes', 'Fonseca', 'Barros', 'Pacheco', 'Rezende', 'Coelho', 'Figueiredo', 'Antunes',
  'Borges', 'Vargas', 'Albuquerque', 'Guedes', 'Peixoto', 'Farias', 'Macedo', 'Vasconcelos'
];

const nameCache = new Map();

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Converte qualquer nome real ou razão social para um nome de pessoa física fictício consistente.
 * Exemplo: "JOSE CARLOS SILVA 12345" -> "Danilo Vieira"
 * @param {string} originalName 
 * @returns {string}
 */
export function anonymizeCustomer(originalName) {
  if (!originalName) return 'Cliente Geral';
  const trimmed = originalName.toString().trim().toUpperCase();
  if (!trimmed || trimmed === 'DESCONHECIDO' || trimmed === 'DIVERSOS' || trimmed === 'CONSUMIDOR FINAL') {
    return 'Consumidor Final';
  }

  if (nameCache.has(trimmed)) {
    return nameCache.get(trimmed);
  }

  const hash = simpleHash(trimmed);
  const firstName = FIRST_NAMES[hash % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor(hash / FIRST_NAMES.length) % LAST_NAMES.length];
  const anonymized = `${firstName} ${lastName}`;

  nameCache.set(trimmed, anonymized);
  return anonymized;
}

// Mapeamento reverso em memória no servidor (apenas para filtros que chegam do frontend com o nome fictício)
const reverseMap = new Map();

export function registerCustomerMapping(originalName, anonymizedName) {
  if (!reverseMap.has(anonymizedName)) {
    reverseMap.set(anonymizedName, new Set());
  }
  reverseMap.get(anonymizedName).add(originalName);
}

export function getOriginalNamesFromAnonymized(anonymizedName) {
  return reverseMap.get(anonymizedName) || null;
}
