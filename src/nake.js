var path = require('path');
var output = require('./output');
var settings = require('./settings');

// initialize output module
output.init();

// load default settings
settings.importFile(path.resolve(__dirname, '../settings.json'));

/**
 * The nake output module.
 * @type {object}
 */
module.exports.output = output;

/**
 * The nake settings manager.
 * @type {Settings}
 */
module.exports.settings = settings;

/**
 * Some useful methods.
 * @type {object}
 */
module.exports.common = require('./common');

/**
 * A Context is where nakefiles are executed.
 *
 * @constructor
 */
module.exports.Context = require('./context');

/**
 * A task is the main unit of work in a nakefile.
 *
 * @constructor
 */
module.exports.Task = require('./task');

/**
 * A namespace is a container of tasks.
 *
 * @constructor
 */
module.exports.Namespace = require('./namespace');
