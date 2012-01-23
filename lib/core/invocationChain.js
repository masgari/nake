var util = require('util');
var common = require('./common');

/**
 * An invocation chain tracks the chain of task invocation to
 * detect circular dependencies.
 *
 * @constructor
 */
function InvocationChain() {
    /**
     * The tasks already in the chain.
     * @type {Array.<Task>}
     * @private
     */
    this._tasks = [];
}
module.exports = InvocationChain;

/**
 * Determines if the task is already in the chain.
 *
 * @this {InvocationChain}
 * @param {Task} task The task to find.
 * @returns {boolean}
 */
InvocationChain.prototype.contains = function(task) {
    for(var i=0, l=this._tasks.length; i < l; i++) {
        if(this._tasks[i] === task) {
            return true;
        }
    }

    return false;
};

/**
 * Adds a task to the chain.
 *
 * @this {InvocationChain}
 * @param {Task} task The task to add.
 */
InvocationChain.prototype.append = function(task) {
    if(this.contains(task)) {
        throw new InvocationChainError(common.sprintf('Circular dependency detected: %s => %s', this.toString(), task.toString()));
    }

    this._tasks.push(task);
};

/**
 * Returns a string representation of the chain.
 * @this {InvocationChain}
 * @returns {string}
 */
InvocationChain.prototype.toString = function() {
    return this._Tasks.join(' => ');
};

/**
 * Represents an invocation chain error.
 *
 * @param {string} message The error message.
 */
function InvocationChainError(message) {
    this.name = 'InvocationChainError';
    this.message = message;
}
util.inherits(InvocationChainError, Error);
InvocationChain.InvocationChainError = InvocationChainError;
