import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import lighthouse from 'lighthouse'
import * as chromeLauncher from 'chrome-launcher'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const reportsDir = path.join(__dirname, 'reports')

if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true })
}

const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'))

function median(values) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

async function startPreviewServer() {
  console.log('[Lighthouse] Building application with mocks...')
  await new Promise((resolve, reject) => {
    const build = spawn('npm', ['run', 'build:demo'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit',
      shell: true,
    })
    build.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Build exited with code ${code}`))
    })
  })

  console.log('[Lighthouse] Starting preview server on port 4173...')
  const preview = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'pipe',
    shell: true,
  })

  // Wait for server ready
  await new Promise((resolve) => setTimeout(resolve, 3000))
  return preview
}

async function runAudit() {
  let serverProcess = null
  let chrome = null

  try {
    serverProcess = await startPreviewServer()

    console.log('[Lighthouse] Launching headless Chrome...')
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    })

    const resultsSummary = []

    for (const pageItem of config.auditConditions.pages) {
      for (const profile of config.auditConditions.profiles) {
        console.log(`\n========================================`)
        console.log(`Auditing: ${pageItem.name} (${pageItem.path}) | Profile: ${profile.name}`)
        console.log(`========================================`)

        const runs = []

        for (let runIndex = 1; runIndex <= config.auditConditions.runsPerProfile; runIndex++) {
          console.log(`-> Run ${runIndex} of ${config.auditConditions.runsPerProfile}...`)
          const url = `http://localhost:4173${pageItem.path}`

          const flags = {
            logLevel: 'error',
            output: ['html', 'json'],
            port: chrome.port,
            formFactor: profile.formFactor,
            screenEmulation: profile.screenEmulation,
            throttling: profile.throttling,
          }

          const runnerResult = await lighthouse(url, flags)

          // Save reports for first run
          if (runIndex === 1) {
            const htmlPath = path.join(reportsDir, `${pageItem.name}-${profile.name}-report.html`)
            const jsonPath = path.join(reportsDir, `${pageItem.name}-${profile.name}-report.json`)
            fs.writeFileSync(htmlPath, runnerResult.report[0])
            fs.writeFileSync(jsonPath, runnerResult.report[1])
            console.log(`   Saved reports to ${path.basename(htmlPath)} & ${path.basename(jsonPath)}`)
          }

          const categories = runnerResult.lhr.categories
          const audits = runnerResult.lhr.audits

          runs.push({
            performance: Math.round((categories.performance?.score ?? 0) * 100),
            accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
            bestPractices: Math.round((categories['best-practices']?.score ?? 0) * 100),
            seo: Math.round((categories.seo?.score ?? 0) * 100),
            lcp: Math.round(audits['largest-contentful-paint']?.numericValue ?? 0),
            cls: parseFloat((audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)),
            tbt: Math.round(audits['total-blocking-time']?.numericValue ?? 0),
          })
        }

        const medianPerf = median(runs.map((r) => r.performance))
        const medianA11y = median(runs.map((r) => r.accessibility))
        const medianBP = median(runs.map((r) => r.bestPractices))
        const medianSEO = median(runs.map((r) => r.seo))
        const medianLCP = median(runs.map((r) => r.lcp))
        const medianCLS = median(runs.map((r) => r.cls))
        const medianTBT = median(runs.map((r) => r.tbt))

        resultsSummary.push({
          page: pageItem.name,
          profile: profile.name,
          performance: medianPerf,
          accessibility: medianA11y,
          bestPractices: medianBP,
          seo: medianSEO,
          lcp: `${medianLCP} ms`,
          cls: medianCLS,
          tbt: `${medianTBT} ms`,
        })
      }
    }

    console.log('\n\n======================================================')
    console.log('           LIGHTHOUSE AUDIT RESULTS (MEDIAN)          ')
    console.log('======================================================')
    console.table(resultsSummary)

    // Save summary json
    const summaryFile = path.join(reportsDir, 'summary.json')
    fs.writeFileSync(summaryFile, JSON.stringify(resultsSummary, null, 2))
    console.log(`\nResults summary saved to ${summaryFile}`)
  } catch (err) {
    console.error('[Lighthouse] Error during audit:', err)
  } finally {
    if (chrome) await chrome.kill()
    if (serverProcess) serverProcess.kill()
    process.exit(0)
  }
}

runAudit()
