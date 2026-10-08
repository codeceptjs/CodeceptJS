import http from 'http'
import fs from 'fs'

const port = Number(process.env.WEB_SERVER_PORT)
const pidFile = process.env.WEB_SERVER_PID_FILE

const server = http.createServer((req, res) => {
  res.statusCode = req.method === 'HEAD' ? 500 : 200
  res.end('web server is up')
})

server.listen(port, '127.0.0.1', () => {
  if (pidFile) fs.appendFileSync(pidFile, `${process.pid}\n`)
  console.log(`listening on ${port}`)
})
