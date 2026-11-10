const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

function readHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
      reject(new Error('Run this command in an interactive terminal.'));
      return;
    }

    let value = '';
    const finish = (error) => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error);
      else resolve(value);
    };

    const onData = (input) => {
      for (const character of input.toString('utf8')) {
        if (character === '\u0003') {
          finish(new Error('Password entry cancelled.'));
          return;
        }
        if (character === '\r' || character === '\n') {
          finish();
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = Array.from(value).slice(0, -1).join('');
        } else if (character >= ' ') {
          value += character;
        }
      }
    };

    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', onData);
  });
}

async function main() {
  const password = await readHidden('Enter Admin password (input hidden): ');
  const confirmation = await readHidden('Confirm Admin password (input hidden): ');

  if (password !== confirmation) throw new Error('Passwords do not match.');
  if (Buffer.byteLength(password, 'utf8') < 12) {
    throw new Error('Use an Admin password at least 12 bytes long.');
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('bcrypt supports passwords up to 72 bytes; choose a shorter password.');
  }

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  process.stdout.write('\nCopy this bcrypt hash into backend/.env as ADMIN_PASSWORD_HASH:\n');
  process.stdout.write(`${hash}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
