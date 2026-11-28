// crypto.randomUUID only exists in secure contexts (HTTPS or localhost). Opening the demo over
// plain http on a local network, to test on a phone, must not break sending or inviting.
// These ids only need to be unique inside one browser's demo data; they are not secrets.
export function createDemoId(prefix: string): string {
  const source = globalThis.crypto
  if (typeof source?.randomUUID === 'function') return `${prefix}-${source.randomUUID()}`
  const random = typeof source?.getRandomValues === 'function'
    ? Array.from(source.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, '0')).join('')
    : `${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`
  return `${prefix}-${Date.now().toString(36)}-${random}`
}
