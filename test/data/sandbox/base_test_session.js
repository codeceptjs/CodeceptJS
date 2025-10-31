Feature('Session')

Scenario('basic session @1', ({ I }) => {
  I.do('writing')
  session('davert', () => {
    I.do('reading')
  })
  I.do('playing')
  session('john', () => {
    I.do('crying')
  })
  session('davert', () => {
    I.do('smiling')
  })
  I.do('laughing')
  session('mike', () => {
    I.do('spying')
  })
  session('john', () => {
    I.do('lying')
  })
  I.do('waving')
})

Scenario('session defined not used @2', ({ I }) => {
  session('davert')
  I.do('writing')
  I.do('playing')
  session('john', () => {
    I.do('crying')
  })
  session('davert', () => {
    I.do('smiling')
  })
  I.do('laughing')
  session('davert', () => {
    I.do('singing')
  })
  I.do('waving')
})

Scenario('tryTo inside session @3', async ({ I }) => {
  const { tryTo } = await import('../../../lib/effects.js')
  I.do('before session')
  session('tryTo-test', async () => {
    I.do('inside session')
    await tryTo(() => {
      I.do('inside tryTo')
    })
    I.do('after tryTo')
  })
  I.do('after session')
})

Scenario('session inside tryTo @4', async ({ I }) => {
  const { tryTo } = await import('../../../lib/effects.js')
  I.do('before tryTo')
  await tryTo(async () => {
    I.do('inside tryTo')
    await session('nested-session', () => {
      I.do('inside nested session')
    })
    I.do('after session')
  })
  I.do('after tryTo')
})
