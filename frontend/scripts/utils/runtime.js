#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { spawnSync } from 'child_process'
import { chromium } from 'playwright'
import { globSync } from 'glob'

export const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
let cachedChromiumPath = ''

const installChromium = (cwd, { withDeps = false } = {}) => {
  const args = ['exec', 'playwright', 'install']
  if (withDeps) {
    args.push('--with-deps')
  }
  args.push('chromium')

  const result = spawnSync(npmCmd, args, {
    cwd,
    stdio: 'inherit'
  })

  return result.status === 0
}

const shouldInstallSystemDeps = () => {
  if (process.platform !== 'linux') {
    return false
  }

  if (process.env.PLAYWRIGHT_SKIP_DEPENDENCY_INSTALL === '1') {
    return false
  }

  if (process.env.CI) {
    return true
  }

  if (typeof process.getuid === 'function') {
    try {
      return process.getuid() === 0
    } catch (error) {
      return false
    }
  }

  return false
}

const resolveChromiumExecutable = () => {
  try {
    const executable = typeof chromium.executablePath === 'function'
      ? chromium.executablePath()
      : ''
    if (executable && fs.existsSync(executable)) {
      return executable
    }
  } catch (error) {
    return ''
  }
  return ''
}

export const ensurePlaywrightChromium = ({ cwd }) => {
  if (cachedChromiumPath && fs.existsSync(cachedChromiumPath)) {
    return cachedChromiumPath
  }

  let executablePath = resolveChromiumExecutable()
  if (!executablePath) {
    let success = installChromium(cwd)

    if (!success && shouldInstallSystemDeps()) {
      console.log('   • Playwright dependency install fallback (chromium + system deps)')
      success = installChromium(cwd, { withDeps: true })
    }

    if (!success) {
      throw new Error('Failed to install Playwright Chromium browser dependencies')
    }

    executablePath = resolveChromiumExecutable()
  }

  if (!executablePath) {
    throw new Error('Chromium executable not found after installation')
  }

  cachedChromiumPath = executablePath
  process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = '1'
  return cachedChromiumPath
}

export const getBuildCacheMetadataPath = projectRoot => path.join(projectRoot, 'test-results', '.phase3-build-cache.json')

export const computeBuildCacheKey = projectRoot => {
  const hash = crypto.createHash('sha1')
  const files = globSync([
    'package.json',
    'package-lock.json',
    'vite.config.ts',
    'tsconfig.json',
    'src/**/*.{ts,tsx,js,jsx,vue,scss,css,json}'
  ], {
    cwd: projectRoot,
    nodir: true
  }).sort()

  files.forEach(relativePath => {
    const absolutePath = path.join(projectRoot, relativePath)
    try {
      const content = fs.readFileSync(absolutePath)
      hash.update(relativePath)
      hash.update(content)
    } catch (error) {
      // Ignore unreadable files (they may have been removed during hashing)
    }
  })

  return hash.digest('hex')
}

export const loadCachedBuildKey = projectRoot => {
  const metadataPath = getBuildCacheMetadataPath(projectRoot)
  if (!fs.existsSync(metadataPath)) {
    return null
  }

  try {
    const cache = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
    return cache.hash || null
  } catch (error) {
    return null
  }
}

export const writeBuildCacheKey = (projectRoot, hash) => {
  const metadataPath = getBuildCacheMetadataPath(projectRoot)
  fs.mkdirSync(path.dirname(metadataPath), { recursive: true })
  const payload = {
    hash,
    generatedAt: new Date().toISOString()
  }
  fs.writeFileSync(metadataPath, JSON.stringify(payload, null, 2))
}
