// Test-only resolver: the app's sources use extensionless relative imports (Vite "bundler"
// resolution). Node's native TypeScript support needs an explicit extension, so retry
// unresolved relative specifiers with ".ts". The app code itself is not changed.
import { registerHooks } from 'node:module'

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (error) {
      if (specifier.startsWith('.') && !/\.[cm]?[jt]sx?$/.test(specifier)) return nextResolve(`${specifier}.ts`, context)
      throw error
    }
  },
})
