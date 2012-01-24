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

/**
 * Command line known options.
 */
exports.options = {
    'nakefile': [path, null],
    'encoding': [String, null],
    'search': [Boolean, true],
    "tasks": [String, null],
    'include': [path, Array],
    'quiet': Boolean,
    'level': [String, null],
    'help': Boolean,
    'version': Boolean
};

/**
 * Command line options shorthands.
 */
exports.shortHands = {
    'f': ['--nakefile'],
    'e': ['--encoding'],
    'N': ['--no-search'],
    'T': ['--tasks'],
    'I': ['--include'],
    'q': ['--quiet'],
    'v': ['--level', 'debug'],
    'h': ['--help'],
    'V': ['--version']
};

/**
 * Command line options to settings map.
 */
exports.settingsMap = {
    'help': 'app.showHelp',
    'version': 'app.showVersion',
    'search': 'app.search',
    'nakefile': 'app.nakefile',
    'encoding': 'app.encoding',
    "tasks": 'app.showTasks',
    'include': 'context.includes',
    'quiet': 'output.quiet',
    'level': 'output.level'
};
