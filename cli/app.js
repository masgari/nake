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

// enable long-stack-traces
require('long-stack-traces');

var path = require('path');
var nopt = require('nopt');
var nake = require('../src/nake');
var options = require('./options');
/**
 * Find the nakefile.
 *
 * @returns {string}
 */
var findNakefile = function() {
    var nakefiles = nake.settings.get('config.Nakefiles', ['Nakefile']);
    var search = nake.settings.get('app.search') !== false;
    var nakefile = nake.settings.get('app.nakefile');

    if(nake.common.isNullOrUndefined(nakefile)) {
        var originalCWD = process.cwd();
        do {
            var cwd = process.cwd();
            for(var i = 0, l = nakefiles.length; i < l; i++) {
                var file = path.resolve(cwd, nakefiles[i]);
                if(path.existsSync(file)) {
                    nakefile = file;
                    break;
                }
            }

            // if nakefile found exit loop.
            if(!nake.common.isNullOrUndefined(nakefile)) {
                break;
            }

            process.chdir(path.resolve(cwd, '..'));

            // if in filesystem root exit loop.
            if(process.cwd() == cwd) {
                break;
            }
        } while(search);

        // returns to the original working directory.
        process.chdir(originalCWD);
    }

    if(nake.common.isNullOrUndefined(nakefile) || !path.existsSync(nakefile)) {
        throw new Error('Nakefile not found (looking for: %s)', nakefiles.join(', '));
    }

    return nakefile;
};

/**
 * Display all tasks applying the specified regular expression.
 *
 * @param {Namespace} ns The namespace to display.
 * @param {RegExp} rx The regular expression to apply.
 */
var showTasks = function(ns, rx) {
    Object.keys(ns._tasks).forEach(function(taskName) {
        var task = ns._tasks[taskName];
        if(rx === null || task.toString().match(rx)) {
            // the full task name without the global namespace.
            var name = task.toString().slice(nake.Namespace.globalNamespaceName.length + nake.Namespace.separator.length);
            nake.output.log('%-30s# %s', name, task.description);
        }
    });

    Object.keys(ns._namespaces).forEach(function(name) {
        showTasks(ns._namespaces[name], rx);
    });
};

/**
 * Parse command line arguments and merge the settings.
 *
 * @this {Settings}
 * @param {Array.<string>} args The command line arguments to parse.
 * @param {number} slice The number of arguments to slice.
 */
var parseArgs = function(args, slice) {
    var config = nopt(options.options, options.shortHands, args, slice || 2);

    Object.keys(options.settingsMap).forEach(function(key) {
        var settingKey = options.settingsMap[key];
        var value = config[key];

        // if value is Array append values.
        if(nake.common.isArray(value)) {
            var s = nake.settings.get(settingKey);
            if(nake.common.isNullOrUndefined(s) || !nake.common.isArray(s)) {
                nake.settings.set(settingKey, value);
            } else {
                value.forEach(function(v) {
                    s.push(v);
                });
            }
        } else {
            if(!nake.common.isNullOrUndefined(value)) {
                nake.settings.set(settingKey, value);
            }
        }
    });

    return config.argv.remain || [];
};

/**
 * CLI application entry point.
 *
 * @param {Array.<string>} argv Command line arguments.
 */
exports.main = function(argv) {
    try {
        // initialize default cli settings
        nake.settings.importFile(path.resolve(__dirname, 'settings.json'));

        // parse command line arguments.
        var args = parseArgs(argv, 2);

        if(nake.settings.get('app.showHelp')) {
            nake.output.log('usage: nake [options] [task] [arg1] [arg2] ...');
            nake.output.log('');
            nake.output.log('Options:');
            nake.output.log('  -f FILE, --nakefile FILE    Read FILE as a nakefile.');
            nake.output.log('  -e ENC, --encoding ENC      The FILE encoding. Default utf8.');
            nake.output.log('  -N, --no-search             Do not search parent directories for a nakefile.');
            nake.output.log('  -T [REGEX], --tasks [REGEX] Display the tasks (matching optional regular expression).');
            nake.output.log('  -L LIBDIR, --lib LIBDIR     Auto-import any .nake files in LIBDIR.');
            nake.output.log('  -I FILE, --include FILE     Auto-import FILE as a nakefile.');
            nake.output.log('  -q, --quiet                 Do not display any messages.');
            nake.output.log('  --level LEVEL               Change logging level.');
            nake.output.log('  -v                          Same to --level debug.');
            nake.output.log('  -h, --help                  Display this help message.');
            nake.output.log('  -V, --version               Display nake version.');
            process.exit(1);
        }

        if(nake.settings.get('app.showVersion')) {
            nake.output.log("v%s", settings.get('package.version'));
            process.exit(1);
        }

        // initialize main context.
        var mainContext = new nake.Context(findNakefile(), nake.settings.get('app.encoding', 'utf8'));

        if(nake.settings.get('app.showTasks')) {
            var pattern = nake.settings.get('app.showTasks', 'true');
            showTasks(mainContext._globalNamespace, pattern == 'true' ? null : new Regexp(pattern, 'g'));
            process.exit(1);
        }

        // call the requested task
        var startTime = Date.now();
        var taskName = args.length > 0 ? args.shift() : 'default';
        mainContext.call(taskName, args, function() {
            nake.output.log('Completed successfully in %.0f seconds', (Date.now() - startTime) / 1000);
        });
    } catch(err) {
        nake.output.error(err);
        process.exit(2);
    }
};
