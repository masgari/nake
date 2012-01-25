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

var util = require('util');
var stackTrace = require('stack-trace');
var common = require('./common');
var settings = require('./settings');

/**
 * An output object allow to write to the console.
 *
 * @constructor
 */
function Output() {
    /**
     * If true no output is written.
     * @type {boolean}
     */
    this._quietMode = false;

    /**
     * The output level threshold.
     * @type {number|string|object}
     */
    this._level = 5;

    /**
     * Store all severity levels configuration.
     * type {object}
     */
    this._levels = {};

    /**
     * Store all created timers.
     * @type {object.<Date>}
     */
    this._timers = {};

    /**
     * Current output indentation.
     * @type {number}
     */
    this.indent = 0;
}

/**
 * Returns the level configuration.
 *
 * @this {Output}
 * @private
 * @param {number|string|object} level The level to find.
 * @returns {object}
 */
Output.prototype._getLevelConfiguration = function(level) {
    if(common.isNullOrUndefined(level)) {
        return null;
    }

    if(common.isObject(level)) {
        return level;
    }

    switch(typeof(level)) {
        case 'string':
            if(this._levels.hasOwnProperty(level)) {
                return this._levels[level];
            }
            break;
        case 'number':
            var self = this;
            Object.keys(this._levels).forEach(function(name) {
                var item = self._levels[name];
                if(item.value === level) {
                    return item;
                }
            });
            break;
    }

    return null;
};

/**
 * Write a message.
 *
 * @this {Output}
 * @private
 * @param {number|string|object} level The message severity level.
 * @param {string} msg The message to write.
 */
Output.prototype._write = function(level, msg) {
    level = this._getLevelConfiguration(level) || {};
    var threshold = this._getLevelConfiguration(this._level) || {};

    // omit any messages if in quiet mode or over the severity level threshold.
    if(this._quietMode || level.value > threshold.value) {
        return;
    }

    var s = level.isError ? process.stdout : process.stderr;

    var lines = msg.split('\n');
    lines.forEach(function(line) {
        for(var i = 0; i < this.indent; i++) {
            s.write(' ');
        }
        s.write(level.format || '');
        s.write(level.prefix || '');
        s.write(line);
        s.write('\n');
        s.write('\x1B[0m');
    });
};

/**
 * Formats the arguments.
 * @this {Output}
 * @public
 * @param {*} value The value to format.
 * @returns {string}
 */
Output.prototype.format = function(value) {
    var self = this;
    var type = typeof(value);
    var msg = '';

    switch(type) {
        case 'string':
            msg = common.sprintf.apply(common, arguments);
            break;
        case 'function':
            msg = value();
            break;
        case 'object':
            if(common.isArray(value)) {
                value.forEach(function(item) {
                    msg += self.format(item) + '\n';
                });
            } else if(value instanceof Error || value.stack) {
                msg = value.stack || value.toString() + '\n' + this._getTrace();
            } else {
                msg = util.inspect(value);
            }
            break;
        default:
            msg = value;
            break;
    }

    return msg;
};

/**
 * Writes a message with debug severity level.
 * @this {Output}
 * @public
 */
Output.prototype.debug = function() {
    this._write('debug', Output.prototype.format.apply(this, arguments));
};

/**
 * Writes a message with information severity level.
 * @this {Output}
 * @public
 */
Output.prototype.info = function() {
    this._write('information', Output.prototype.format.apply(this, arguments));
};

/**
 * Writes a message with notice severity level.
 * @this {Output}
 * @public
 */
Output.prototype.log = function() {
    this._write('notice', Output.prototype.format.apply(this, arguments));
};

/**
 * Writes a message with warning severity level.
 * @this {Output}
 * @public
 */
Output.prototype.warn = function() {
    this._write('warning', Output.prototype.format.apply(this, arguments));
};

/**
 * Writes a message with error severity level.
 * @this {Output}
 * @public
 */
Output.prototype.err = function() {
    this._write('error', Output.prototype.format.apply(this, arguments));
};

/**
 * Writes a message with notice severity level.
 * @this {Output}
 * @public
 */
Output.prototype.dir = function() {
    this._write('notice', Output.prototype.format.apply(this, arguments));
};

/**
 * If expression is false throws an assertion error.
 *
 * @this {Output}
 * @public
 * @param {boolean} expression The expression to evaluate.
 */
Output.prototype.assert = function(expression) {
    if(expression === false) {
        var args = Array.prototype.slice.call(arguments, 1);
        if(args.length > 0) {
            throw new Error(Output.prototype.format.apply(this, args));
        } else {
            throw new Error('Assertion Error');
        }
    }
};

/**
 * Create a new timer with the specified label.
 *
 * @this {Output}
 * @public
 * @param {string} label The timer label.
 */
Output.prototype.time = function(label) {
    this._timers[label] = Date.now();
};

/**
 * Finalize a timer and writes the duration.
 *
 * @this {output}
 * @public
 * @param {string} label The timer label.
 */
Output.prototype.timeEnd = function(label) {
    var duration = Date.now() - this._timers[label];
    delete this._timers[label];

    this.log('%s: %dms', label, duration);
};

/**
 * Returns the current stack trace.
 *
 * @this {Output}
 * @private
 * @returns {string}
 */
Output.prototype._getTrace = function() {
    // get the current stack-trace.
    var trace = stackTrace.get();

    // remove any internal trace methods.
    while(trace.length > 0 && trace[0].receiver == this) {
        trace.shift();
    }

    // prepare stack-trace
    trace = Error.prepareStackTrace({}, trace).split('\n');

    // remove dummy object
    trace.shift();

    return trace.join('\n');
};

/**
 * Writes a message with trace information.
 *
 * @this {Output}
 * @public
 */
Output.prototype.trace = function() {
    this._write('information', Output.prototype.format.apply(this, arguments) + '\n' + this._getTrace());
};

/**
 * Initialize output object.
 */
Output.prototype.init = function() {
    var self = this;

    var configure = function() {
        self._quietMode = settings.get('output.quiet', self._quietMode);
        self._level = settings.get('output.level', self._level);

        // remove old severity level methods
        Object.keys(self._levels).forEach(function(level) {
            if(self.hasOwnProperty(level)) {
                delete self[level];
            }
        });

        self._levels = common.extend(self._levels, settings.get('output.levels', self._levels));
        Object.keys(self._levels).forEach(function(level) {
            var l = self._levels[level];

            if(l.format) {
                // adds escape character to any not escaped [.
                l.format = l.format.replace(/\x1B{0}\[/g, '\x1B[');
            }

            // create a facility method for any defined severity level.
            self[level] = function() {
                self._write(self._levels[level], Output.prototype.format.apply(self, arguments));
            };
        });
    };

    // Listen for any change in settings
    settings.on('set', configure);

    // initialize configuration
    configure();
};

module.exports = new Output();
