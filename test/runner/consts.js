import path from 'path';

const runner = path.join(process.cwd(), 'bin/codecept.js');
const codecept_dir = path.join(process.cwd(), 'test/data/sandbox');
const codecept_run = `${runner} run`;

export {
  codecept_run,
  codecept_dir,
  runner,
};
