import { Test as MochaTest, Suite as MochaSuite } from 'mocha'

declare global {
  namespace CodeceptJS {
    interface Test extends MochaTest {
      title: string
      tags: string[]
      steps: string[]
      config: Record<string, any>
      artifacts: string[]
      inject: Record<string, any>
      opts: Record<string, any>
      throws?: Error | string | RegExp | Function
      totalTimeout?: number
      addToSuite(suite: Mocha.Suite): void
      applyOptions(opts: Record<string, any>): void
      codeceptjs: boolean
    }

    interface Suite extends MochaSuite {
      title: string
      tags: string[]
      opts: Record<string, any>
      totalTimeout?: number
      addTest(test: Test): void
      applyOptions(opts: Record<string, any>): void
      codeceptjs: boolean
    }
  }
}
