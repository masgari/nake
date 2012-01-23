var path = require('path');

/**
 * Command line known options.
 */
exports.options = {
    'nakefile': [path, null],
    'encoding': [String, null],
    'search': [Boolean, true],
    "tasks": [String, null],
    'lib': [path, Array],
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
    'L': ['--lib'],
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
    'lib': 'context.libs',
    'include': 'context.includes',
    'quiet': 'output.quiet',
    'level': 'output.level'
};
