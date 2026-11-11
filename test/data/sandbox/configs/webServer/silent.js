import fs from 'fs'

if (process.env.WEB_SERVER_PID_FILE) fs.appendFileSync(process.env.WEB_SERVER_PID_FILE, `${process.pid}\n`)
for (let i = 0; i < 30; i++) console.log(`server line ${i}`)
setInterval(() => {}, 1000)
