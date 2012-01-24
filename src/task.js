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
 * @param {boolean} async Determines if the task should be executed in asynchronous mode.
 */
function Task(name, ns, desc, dependencies, actions, async) {
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
     * Determines if the task should be executed in asynchronous mode.
     * @type {boolean}
     * @public
     */
    this.async = (async === true);

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
 * @param {function} cb Callback.
 */
Task.prototype.execute = function(args, cb) {
    var self = this;
    if(common.isFunction(this.actions)) {
        var sandbox = {};
        sandbox.done = function() {
            if(self.async && common.isFunction(cb)) {
                cb();
            }
        };

        this.actions.apply(sandbox, args);

        if(!this.async) {
            if(common.isFunction(cb)) {
                cb();
            }
        }
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
 * @param {Array} args Task arguments.
 * @param {function} cb Callback.
 */
Task.prototype.invoke = function(args, cb) {
    invokeWithChain(this, args, new InvocationChain(), cb);
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
 * @param {function} cb Callback.
 */
function invokeWithChain(task, args, chain, cb) {
    output.info('Invoking task: %s', task.toString());
    output.debug('  with arguments: %j', args);

    if(task._invoked) {
        output.info('Omitting task. Already invoked.');
        if(common.isFunction(cb)) {
            cb();
        }
    }

    task._invoked = true;
    chain.append(task);
    invokeDependencies(task, chain, function() {
        if(task.isNeeded()) {
            output.log(task.toString().slice(Namespace.globalNamespaceName.length + Namespace.separator.length) + ':');
            output.indent += 4;

            try {
                task.execute(args, function() {
                    output.indent -= 4;
                    if(common.isFunction(cb)) {
                        cb();
                    }
                });
            } catch(e) {
                output.indent -= 4;
                throw e;
            }
        }
    });
}

/**
 * Invoke all task dependencies.
 *
 * @param {Task} task The task.
 * @param {InvocationChain} chain The invocation chain to use.
 * @param {function} cb Callback for continue execution.
 */
function invokeDependencies(task, chain, cb) {
    if(common.isArray(task.dependencies) && task.dependencies.length > 0) {
        var invoke = function(i, cb) {
            if(i >= task.dependencies.length) {
                if(common.isFunction(cb)) {
                    cb();
                }
            }

            var dep = task.namespace.lookup(task.dependencies[i]);
            if(common.isNullOrUndefined(dep)) {
                throw new TaskError('Task "%s" not found in namespace %s', name, task.namespace.toString());
            }

            invokeWithChain(dep, [], chain, function() {
                if(task.dependencies.length > ++i) {
                    invoke(i, cb);
                } else {
                    if(common.isFunction(cb)) {
                        cb();
                    }
                }
            });
        };

        invoke(0, cb);
    } else {
        if(common.isFunction(cb)) {
            cb();
        }
    }
}
