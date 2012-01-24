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
