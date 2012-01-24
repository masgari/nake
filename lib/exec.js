var child_process = require('child_process');

/**
 * Execute a command.
 *
 * @param {string} cmd Command line to execute.
 * @param {function} cb Callback.
 */
module.exports = function(cmd, cb) {
    child_process.exec(cmd, function(error, stdout, stderr) {
        if(error) {
            throw error;
        }

        stdout.split('\n').forEach(function(line) {
            if(line.length > 0) {
                console.log(line);
            }
        });

        stderr.split('\n').forEach(function(line) {
            if(line.length > 0) {
                console.err(line);
            }
        });

        if(cb && typeof cb === 'function') {
            cb();
        }
    });
};
