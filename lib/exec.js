/*
 * Nake
 * Copyright 2012 Carlos Prado <cpradog@me.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

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
                console.log(line);
            }
        });

        if(cb && typeof cb === 'function') {
            cb();
        }
    });
};
