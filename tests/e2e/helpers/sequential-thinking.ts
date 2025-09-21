import { Page } from '@playwright/test'

/**
 * Sequential Thinking Helper for Playwright Tests
 * Implements a structured approach to test execution with clear step tracking
 */
export class SequentialThinking {
  private page: Page | null
  private currentStep: number = 0
  private steps: Array<{ name: string; status: 'pending' | 'running' | 'completed' | 'failed'; duration?: number }> = []
  private startTime: number = 0

  constructor(page: Page | null) {
    this.page = page
  }

  /**
   * Start a new thinking process
   */
  async startThinking(processName: string) {
    this.startTime = Date.now()
    console.log(`\n🧠 Starting Sequential Thinking: ${processName}`)
    console.log('=' .repeat(60))
  }

  /**
   * Execute a test step with clear logging
   */
  async step(stepName: string, action: () => Promise<void>) {
    this.currentStep++
    const stepStart = Date.now()

    const step = {
      name: stepName,
      status: 'running' as const,
      duration: 0
    }
    this.steps.push(step)

    console.log(`\n📍 Step ${this.currentStep}: ${stepName}`)
    console.log('-'.repeat(40))

    try {
      step.status = 'running'
      await action()
      step.status = 'completed'
      step.duration = Date.now() - stepStart
      console.log(`✅ Completed in ${step.duration}ms`)
    } catch (error) {
      step.status = 'failed'
      step.duration = Date.now() - stepStart
      console.error(`❌ Failed after ${step.duration}ms`)
      console.error(`   Error: ${error}`)
      throw error
    }
  }

  /**
   * Analyze and log results
   */
  async analyze(analysisName: string, data: Record<string, any>) {
    console.log(`\n📊 Analysis: ${analysisName}`)
    console.log('-'.repeat(40))

    Object.entries(data).forEach(([key, value]) => {
      const formattedKey = key.replace(/([A-Z])/g, ' $1').toLowerCase()
      console.log(`  • ${formattedKey}: ${JSON.stringify(value)}`)
    })
  }

  /**
   * End the thinking process and show summary
   */
  async endThinking() {
    const totalDuration = Date.now() - this.startTime

    console.log('\n' + '=' .repeat(60))
    console.log('📈 Sequential Thinking Summary')
    console.log('=' .repeat(60))

    const completed = this.steps.filter(s => s.status === 'completed').length
    const failed = this.steps.filter(s => s.status === 'failed').length

    console.log(`Total steps: ${this.steps.length}`)
    console.log(`Completed: ${completed}`)
    console.log(`Failed: ${failed}`)
    console.log(`Total duration: ${totalDuration}ms`)

    if (this.steps.length > 0) {
      console.log('\nStep breakdown:')
      this.steps.forEach((step, index) => {
        const icon = step.status === 'completed' ? '✅' :
                    step.status === 'failed' ? '❌' :
                    step.status === 'running' ? '⏳' : '⏸️'
        console.log(`  ${icon} ${index + 1}. ${step.name} (${step.duration || 0}ms)`)
      })
    }
  }

  /**
   * Take a screenshot with annotation
   */
  async screenshot(name: string) {
    if (this.page) {
      const fileName = `screenshot-${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`
      await this.page.screenshot({
        path: `./test-results/${fileName}`,
        fullPage: true
      })
      console.log(`📸 Screenshot saved: ${fileName}`)
    }
  }

  /**
   * Wait with explanation
   */
  async wait(ms: number, reason: string) {
    console.log(`⏱️  Waiting ${ms}ms: ${reason}`)
    await new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Log an observation
   */
  observe(observation: string) {
    console.log(`👁️  Observation: ${observation}`)
  }

  /**
   * Log a decision
   */
  decide(decision: string) {
    console.log(`🎯 Decision: ${decision}`)
  }

  /**
   * Get current step number
   */
  getCurrentStep(): number {
    return this.currentStep
  }

  /**
   * Get all steps
   */
  getSteps() {
    return [...this.steps]
  }
}