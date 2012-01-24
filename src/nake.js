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
