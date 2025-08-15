/**
 * Gera um ID único usando crypto.randomUUID() ou fallback
 */
export function generateId(): string {
  // Usar crypto.randomUUID() se disponível (navegadores modernos)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback para ambientes que não suportam crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Gera um ID único com prefixo personalizado
 */
export function generateIdWithPrefix(prefix: string): string {
  return `${prefix}_${generateId()}`
}