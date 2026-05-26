import * as chai from 'chai';
chai.should();
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runner = path.join(process.cwd(), 'bin/codecept.js')
const codecept_dir = path.join(process.cwd(), 'test/data/sandbox')
const codecept_run = `${runner} run`

export {
  codecept_run,
  codecept_dir,
  runner,
}
