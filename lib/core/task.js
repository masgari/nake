var util = require('util');
var common = require('./common');
var output = require('./output');
var Namespace = require('./namespace');
var InvocationChain = require('./invocationChain');

/**
 * A task is the main unit of work in a nakefile.
 *
 * @constructor
 * @param {string} name The task name.
 * @param {Namespace} ns The namespace that contains the task.
 * @param {string} desc The description of the task.
 * @param {Array} dependencies The task dependencies.
 * @param {function} actions The function with the actions associated to the task.
 */
function Task(name, ns, desc, dependencies, actions) {
    output.assert(typeof(name) === 'string', 'Task name must be a string.');
    output.assert(ns instanceof Namespace, 'Task namespace must be a Namespace object.');

    /**
     * The task name.
     * @type {string}
     * @public
     */
    this.name = name;

    /**
     * The task description.
     * @type {string}
     * @public
     */
    this.description = desc;

    /**
     * The namespace that contains the task.
     * @type {Namespace}
     * @public
     */
    this.namespace = ns;

    /**
     * The task dependencies
     * @type {Array.<string>}
     * @public
     */
    this.dependencies = dependencies;

    /**
     * The task actions.
     * @type {function}
     * @public
     */
    this.actions = actions;

    /**
     * Determines if the task already has invoked.
     * @type {boolean}
     * @private
     */
    this._invoked = false;
}
module.exports = Task;

/**
 * Determines if the task is needed in the current context.
 * Some task types, like file tasks, can be omitted if the file is already up to date.
 *
 * @protected
 * @this {Task}
 * @returns {boolean}
 */
Task.prototype.isNeeded = function() {
    return true;
};

/**
 * Execute the actions associated with the task.
 *
 * @protected
 * @this {Task}
 * @param {Array} args The task arguments.
 */
Task.prototype.execute = function(args) {
    if(common.isFunction(this.actions)) {
        this.actions.apply({}, args);
    }
};

/**
 * Returns a string representation of the task.
 *
 * @this {Task}
 * @returns {string}
 */
Task.prototype.toString = function() {
    return this.namespace.toString() + Namespace.separator + this.name;
};

/**
 * Invoke the task.
 *
 * @this {Task}
 */
Task.prototype.invoke = function() {
    var args = Array.prototype.slice.call(arguments) || [];
    invokeWithChain(this, args, new InvocationChain())
};

/**
 * Represents a task error.
 *
 * @param {string} message The error message.
 */
function TaskError(message) {
    this.name = 'TaskError';
    this.message = message;
}
util.inherits(TaskError, Error);
Task.TaskError = TaskError;

/**
 * Invoke a task with the specified invocation chain.
 *
 * @param {Task} task The task to invoke.
 * @param {Array} args The task arguments.
 * @param {InvocationChain} chain The invocation chain to use.
 */
function invokeWithChain(task, args, chain) {
    output.info('Invoking task: %s', task.toString());
    output.debug('  with arguments: %j', args);

    if(task._invoked) {
        output.info('Omitting task. Already invoked.');
        return;
    }

    task._invoked = true;
    chain.append(task);
    invokeDependencies(task, chain);

    if(task.isNeeded()) {
        output.log(task.name + ':');
        output.indent += 4;

        try {
            task.execute(args);
        } finally {
            output.indent -= 4;
        }
    }
}

/**
 * Invoke all task dependencies.
 *
 * @param {Task} task The task.
 * @param {InvocationChain} chain The invocation chain to use.
 */
function invokeDependencies(task, chain) {
    if(common.isArray(task.dependencies) && task.dependencies.length > 0) {
        task.dependencies.forEach(function(name) {
            var dep = task.namespace.lookup(name);
            if(common.isNullOrUndefined(dep)) {
                throw new TaskError('Task "%s" not found in namespace %s', name, task.namespace.toString());
            }

            invokeWithChain(dep, [], chain);
        })
    }
}
