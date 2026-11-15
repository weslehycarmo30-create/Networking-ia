// Minimal in-memory stand-in for window.localStorage, installed on globalThis.window.
export type MemoryStorage = Storage & { failWrites: boolean; dump(): Record<string, string> }

export function installMemoryStorage(initial: Record<string, string> = {}): MemoryStorage {
  const data = new Map(Object.entries(initial))
  const storage = {
    failWrites: false,
    get length() { return data.size },
    key: (index: number) => [...data.keys()][index] ?? null,
    getItem: (key: string) => data.get(key) ?? null,
    setItem(key: string, value: string) {
      if (storage.failWrites) throw new DOMException('quota', 'QuotaExceededError')
      data.set(key, String(value))
    },
    removeItem: (key: string) => { data.delete(key) },
    clear: () => data.clear(),
    dump: () => Object.fromEntries(data),
  }
  ;(globalThis as { window?: unknown }).window = { localStorage: storage }
  return storage as MemoryStorage
}
