interface Credentials {
  email: string
  password: string
}

type Maybe<T> = T | null

const creds: Credentials = { email: 'a@b.c', password: 'x' }

Feature('typescript')

Scenario('ts', async ({ I }: { I: CodeceptJS.I }) => {
  const title: string = I.grabTitle() as unknown as string
  I.wait(5)
})
