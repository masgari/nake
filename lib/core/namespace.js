var util = require('util');
var common = require('./common');
var output = require('./output');

/**
 * A namespace is a container of tasks.
 *
 * @constructor
 * @param {string} name The namespace name.
 * @param {Namespace=} parent The parent namespace for this instance.
 */
function Namespace(name, parent) {
    output.assert(!common.isNullOrUndefined(name) && typeof(name) === 'string', 'Namespace name must be a string');
    output.assert(common.isNullOrUndefined(parent) || parent instanceof Namespace, 'Namespace parent must be null, undefined or a Namespace object');

    /**
     * The namespace name.
     * @type {string}
     * @public
     */
    this.name = name;

    /**
     * The parent namespace
     * @type {Namespace}
     * @private
     */
    this._parent = parent || null;

    /**
     * The namespace children namespaces.
     * @type {Object.<Namespace>}
     * @private
     */
    this._namespaces = {};

    /**
     * The namespace tasks.
     * @type {Object.<Task>}
     * @private
     */
    this._tasks = {};

    // register namespace with its parent.
    if(!common.isNullOrUndefined(this._parent)) {
        this._parent._namespaces[this.name] = this;
    }
}
module.exports = Namespace;

/**
 * Register a task in this namespace.
 *
 * @public
 * @this {Namespace}
 * @param {Task} task The task to register.
 */
Namespace.prototype.addTask = function(task) {
    if(common.isNullOrUndefined(task.namespace)) {
        task.namespace = this;
    } else if(task.namespace !== this) {
        throw new NamespaceError(common.sprintf('The task "%s" already registered in other namespace', task.toString()));
    }

    if(!common.isNullOrUndefined(this.lookup(task.name))) {
        throw new NamespaceError(common.sprintf('There is other task with the name "%s" in namespace "%s".', task.toString(), this.toString()));
    }

    if(!common.isNullOrUndefined(this._namespaces[task.name])) {
        throw new NamespaceError('Duplicated names. There is a namespace with name "%s" in namespace "%s"', base, this.toString());
    }

    this._tasks[task.name] = task;
};

/**
 * Search for the specified task.
 *
 * @public
 * @this {Namespace}
 * @param {string} taskName The name of the task.
 * @returns {Task}
 */
Namespace.prototype.lookup = function(taskName) {
    var names = taskName.split(Namespace.separator);

    // if is a local task returns it.
    if(names.length == 1) {
        return this._tasks[taskName] || null;
    } else {
        var baseNamespace = names.shift();
        var taskPath = names.join(Namespace.separator);

        // if is a full name and this isn't the global namespace go to parent.
        if(baseNamespace == Namespace.globalNamespaceName && !common.isNullOrUndefined(this._parent)) {
            return this._parent.lookup(taskName);
        }

        // if this is the base namespace retry without the rest of the path.
        if(this.name == baseNamespace) {
            return this.lookup(taskPath);
        }

        // find the base namespace.
        var ns = this._namespaces[baseNamespace] || null;
        if(ns === null) {
            return null;
        }

        return ns.lookup(taskPath);
    }
};

/**
 * Returns the specified namespace.
 *
 * @public
 * @this {Namespace}
 * @param {string} name The namespace to find.
 * @returns {Namespace}
 */
Namespace.prototype.getNamespace = function(name) {
    var names = name.split(Namespace.separator);
    var base = names.shift();
    var path = names.join('Namespace.separator');

    var ns = this._namespaces[base];
    if(common.isNullOrUndefined(ns)) {
        if(!common.isNullOrUndefined(this.lookup(base))) {
            throw new NamespaceError('Duplicated names. There is a task with name "%s" in namespace "%s"', base, this.toString());
        }

        ns = new Namespace(base, this);
    }

    if(path.length > 0) {
        return ns.getNamespace(path);
    } else {
        return ns;
    }
};

/**
 * The global namespace name.
 * @type {string}
 * @static
 */
Namespace.globalNamespaceName = 'global';

/**
 * Namespace separation string.
 * @type {string}
 * @static
 */
Namespace.separator = ':';

/**
 * Returns a string representation of the namespace.
 *
 * @this {Namespace}
 * @returns {string}
 */
Namespace.prototype.toString = function() {
    if(!common.isNullOrUndefined(this._parent)) {
        return this._parent.toString() + Namespace.separator + this.name;
    } else {
        return this.name;
    }
};

/**
 * Represents a namespace error.
 *
 * @param {string} message The error message.
 */
function NamespaceError(message) {
    this.name = 'NamespaceError';
    this.message = message;
}
util.inherits(NamespaceError, Error);
Namespace.NamespaceError = NamespaceError;
