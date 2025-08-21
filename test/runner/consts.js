import path from 'path'

const runner = path.join(process.cwd(), 'bin/codecept.js')
export const codecept_dir = path.join(process.cwd(), 'test/data/sandbox')
export const codecept_run = `${runner} run`
export { runner }
