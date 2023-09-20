'use strict';

const path = require('path'),
  {spawn} = require('child_process'),
  error = require(path.join(__dirname, 'error.js')),
  log = require(path.join(__dirname, 'log.js')),
  transform = {
    all: arg => arg,
    rclone: arg => {
      let result;

      if ((/Transferred\:.*\%\n/).test(arg)) {
        result = arg.match(/(Transferred:.*\%\n)/)[1].trim().replace(/\s+/, ' ');
      }

      return result;
    }
  };

async function shell (arg, args = [], cwd = process.cwd(), passthru = false) {
  return new Promise((resolve, reject) => {
    const ps = spawn(arg, args, {cwd, shell: true});
    let lexit = false,
      last, lerror, lresult;

    ps.on('exit', (code, signal) => {
      if (lexit === false) {
        lexit = true;

        if (code === 0) {
          resolve(lresult);
        } else {
          reject(lerror || new Error(`[${signal || code}] Failed to execute "${arg} ${args.join(' ')}"`));
        }
      }
    });

    ps.on('error', err => {
      if (lexit === false) {
        lexit = true;
        lerror = err;
        log(`type=error, origin=shell, action=${arg}, message="${error(err)}"`);
        reject(err);
        ps.kill();
      }
    });

    ps.stdout.on('data', buf => {
      const input = buf.toString();

      try {
        const result = (transform[arg] || transform.all)(input);

        if (passthru === false) {
          if (arg !== 'ps' && result !== void 0 && result !== last) {
            log(`type=shell, action=${arg}, message="${result}"`);
            last = result;
          } else if (arg === 'ps') {
            lresult += result;
          }
        } else {
          console.log(result);
        }
      } catch (err) {
        log(`type=error, origin=shell, action=stdout-handler, message="${error(err)}"`);
      }
    });
  });
}

module.exports = shell;
