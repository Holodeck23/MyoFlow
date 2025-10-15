import { existsSync, readFileSync } from 'fs'
import path from 'path'

const GLOBAL_FLAG = '__MYOFLOW_DB_TEST_ENV_LOADED__'

if (!(globalThis as Record<string, unknown>)[GLOBAL_FLAG]) {
  loadEnvFiles()
  ;(globalThis as Record<string, unknown>)[GLOBAL_FLAG] = true
}

function loadEnvFiles() {
  const rootDir = path.resolve(__dirname, '../../../..')
  const candidates = [
    path.join(rootDir, '.env.test.local'),
    path.join(rootDir, '.env.test'),
    path.join(rootDir, '.env.local'),
    path.join(rootDir, '.env'),
  ]

  for (const filePath of candidates) {
    applyEnvFromFile(filePath)
  }

  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. Prisma integration tests require a running Postgres instance. Set DATABASE_URL before running @myoflow/db tests.')
  }
}

function applyEnvFromFile(filePath: string) {
  if (!existsSync(filePath)) {
    return
  }

  const content = readFileSync(filePath, 'utf8')
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) {
      return
    }

    const separatorIndex = trimmed.indexOf('=')
    if (separatorIndex === -1) {
      return
    }

    const key = trimmed.slice(0, separatorIndex).trim()
    if (!key) {
      return
    }

    let value = trimmed.slice(separatorIndex + 1).trim()

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }

    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  })
}
