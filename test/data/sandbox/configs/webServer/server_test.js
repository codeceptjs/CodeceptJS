Feature('Web Server')

const url = `http://127.0.0.1:${process.env.WEB_SERVER_PORT}`

Scenario('server is reachable first', async () => {
  const body = await (await fetch(url)).text()
  if (body !== 'web server is up') throw new Error(`Unexpected response: ${body}`)
})

Scenario('server is reachable second', async () => {
  const body = await (await fetch(url)).text()
  if (body !== 'web server is up') throw new Error(`Unexpected response: ${body}`)
})
