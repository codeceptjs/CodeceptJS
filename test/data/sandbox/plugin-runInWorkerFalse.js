export default function (config) {
  process.stdout.write('plugin-runInWorkerFalse:loaded\n')
  if (config.reportDir) {
    process.stdout.write(`plugin-runInWorkerFalse:reportDir=${config.reportDir}\n`)
  }
}
