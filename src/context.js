var fs = require('fs');
var path = require('path');
var vm = require('vm');
var common = require('./common');
var settings = require('./settings');
var output = require('./output');
var Namespace = require('./namespace');
var Task = require('./task');

/**
 * Resolve a path reference.
 *
 * @param {string} p Path to resolve.
 * @returns {string}
 */
var resolvePath = function(p) {
    return p.replace(/\$\{(.*?)\}/g, function(match, envName) {
        if(envName == 'NAKE_HOME') {
            return path.resolve(path.dirname(module.filename), '..');
        }

        return process.env[envName];
    });
};

/**
 * Create a new sandbox for the specified context.
 *
 * @param {Context} ctx The context for the sandbox.
 * @param {string} file The script file path.
 * @returns {object}
 */
var createSandbox = function(ctx, file) {
    var sandbox = {};
    sandbox.global = (ctx._parent !== null) ? ctx._parent._sandbox.global : sandbox;
    sandbox.require = require;
    sandbox.console = output;
    sandbox.setTimeout = setTimeout;
    sandbox.clearTimeout = clearTimeout;
    sandbox.setInterval = setInterval;
    sandbox.clearInterval = clearInterval;
    sandbox.process = process;
    sandbox.__filename = file;
    sandbox.__dirname = path.dirname(file);

    // clone all context functions to the sandbox.
    Object.keys(Context.prototype).forEach(function(name) {
        sandbox[name] = function() {
            return Context.prototype[name].apply(ctx, arguments);
        };
    });

    // prepare required modules
    var requires = settings.get('context.require', {});
    Object.keys(requires).forEach(function(name) {
        sandbox[name] = require(path.resolve(sandbox.__dirname, resolvePath(requires[name])));
    });

    return sandbox;
};

/**
 * Represents an execution context.
 *
 * @constructor
 * @param {string} file The script file to execute.
 * @param {string=} encoding The script file encoding.
 * @param {Context=} parent The parent context.
 */
function Context(file, encoding, parent) {
    output.assert(common.isNullOrUndefined(parent) || parent instanceof Context, 'Context parent must be null, undefined or a Context object');
    if(!path.existsSync(file)) {
        throw new Error('File not found: ' + file);
    }

    /**
     * The parent context for this context.
     * @type {Context}
     * @private
     */
    this._parent = parent || null;

    /**
     * Reference to the global namespace for this context.
     * @type {Namespace}
     * @private
     */
    this._globalNamespace = (this._parent !== null) ? this._parent._globalNamespace : new Namespace(Namespace.globalNamespaceName);

    /**
     * Store user defined properties.
     * @type {object}
     * @private
     */
    this._propertiesStore = (this._parent !== null) ? this._parent._propertiesStore : {};

    /**
     * Current namespace.
     * @type {Namespace}
     * @private
     */
    this._namespace = this._globalNamespace;

    /**
     * Stores last defined description.
     * @type {string}
     * @private
     */
    this._lastDescription = '';

    /**
     * The execution sandbox.
     * @type {object}
     * @private
     */
    this._sandbox = createSandbox(this, file);

    output.info('Loading file: %s', file);
    var script = common.stripBOM(fs.readFileSync(file, encoding || 'utf8'));
    vm.runInNewContext(script, this._sandbox, file);

    // Include all configured includes
    var includes = settings.get('context.include', []);
    var self = this;
    includes.forEach(function(include) {
        try {
            self.include(path.resolve(path.dirname(file), resolvePath(include)));
        } catch(e) {
            output.warn('Unable to include: %s', include);
            output.warn(e.message);
        }
    });
}
module.exports = Context;

/**
 * Invoke the specified task.
 *
 * @public
 * @param {string} taskName The name of the task to invoke.
 * @param {Array} args Task arguments.
 * @param {function} cb Callback.
 */
Context.prototype.call = function(taskName, args, cb) {
    var task = this._globalNamespace.lookup(taskName);
    if(common.isNullOrUndefined(task)) {
        throw new Error('Task not found: ' + taskName);
    }

    task.invoke(args, cb);
};

/**
 * Adds the description for the next task.
 *
 * @public
 * @this {Context}
 * @param {string} desc The description to add.
 */
Context.prototype.desc = function(desc) {
    this._lastDescription = (desc || '').toString();
};

/**
 * Defines a task.
 *
 * @public
 * @this {Context}
 * @param {string} name The task name.
 * @param {!function|Array.<string>} dependencies The task dependencies or the actions if no dependencies needed.
 * @param {!function} actions The task actions.
 * @param {object} options Other task options.
 */
Context.prototype.task = function(name, dependencies, actions, options) {
    if(common.isFunction(dependencies)) {
        options = actions;
        actions = dependencies;
        dependencies = [];
    }

    var desc = this._lastDescription;
    this._lastDescription = '';

    var ns = this._namespace;

    var i = name.lastIndexOf(Namespace.separator);
    if(i >= 0) {
        ns = this._namespace.getNamespace(name.substr(0, i));
        name = name.substr(i + Namespace.separator.length);
    }

    var task = new Task(name, ns, desc, dependencies, actions, (options && options.async));
    ns.addTask(task);
};

/**
 * Define a namespace.
 *
 * @public
 * @this {Context}
 * @param {string} name The namespace name.
 * @param {function} fn The namespace content.
 */
Context.prototype.namespace = function(name, fn) {
    var temp = this._namespace;
    var ns = this._globalNamespace.getNamespace(name);
    try {
        this._namespace = ns;
        fn.apply(this);
    } finally {
        this._namespace = temp;
    }
};

/**
 * Loads a file or library in this context.
 *
 * @public
 * @param {string} p The file or library path.
 * @param {string=} encoding The file encoding.
 */
Context.prototype.include = function(p, encoding) {
    p = path.resolve(this.__dirname, p);
    if(!path.existsSync(p)) {
        throw new Error('File not found: ' + p);
    }

    var s = fs.lstatSync(p);
    if(s.isFile()) {
        output.info('loading file: %s', p);
        new Context(p, encoding, this);
        return;
    }

    output.info('loading directory: %s', p);
    var files = fs.readdirSync(p);
    for(var i = 0, l = files.length; i < l; i++) {
        var file = path.resolve(p, files[i]);
        var stats = fs.lstatSync(file);
        if(stats.isDirectory() || (stats.isFile() && path.extname(file) == '.nake')) {
            this.include(file, encoding);
        }
    }
};

/**
 * Gets or sets a user defined property.
 *
 * @this {Context}
 * @public
 * @param {string} name The property name.
 * @param {*=} value The property value.
 */
Context.prototype.property = function(name, value) {
    if(value === undefined) {
        return this._propertiesStore[name];
    } else {
        this._propertiesStore[name] = value;
    }
};
