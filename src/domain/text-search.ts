import type { Message } from './models'

// Shared by member discovery and room message search: case- and accent-insensitive (pt-BR).
// \p{M} removes every combining mark, a superset of the U+0300–U+036F range used before.
export function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR')
}

// Messages of one room whose text contains the query; removed messages never match.
export function searchRoomMessages(messages: Message[], query: string): Message[] {
  const normalizedQuery = normalizeSearchText(query.trim())
  if (!normalizedQuery) return []
  return messages.filter((message) => !message.deleted && normalizeSearchText(message.text).includes(normalizedQuery))
}

// "Anterior"/"Próximo" cycle through results: -1 wraps to the last one, length wraps to 0.
export function wrapResultIndex(index: number, length: number): number {
  if (length <= 0) return -1
  return ((index % length) + length) % length
}
