var util = require('util');

/**
 * Determine if val is an object.
 *
 * @param {*} val The value to validate.
 * @returns {boolean}
 */
exports.isObject = function(val) {
    return val && typeof val === 'object' && !exports.isFunction(val) && !exports.isArray(val);
};

/**
 * Determine if val is a function.
 *
 * @param {*} val The value to validate.
 * @returns {boolean}
 */
exports.isFunction = function(val) {
    return (val && typeof val === 'function' && val.apply && val.call) ? true : false;
};

/**
 * Determine if val is an array.
 *
 * @param {*} val The value to validate.
 * @returns {boolean}
 */
exports.isArray = function(val) {
    return Array.isArray(val);
};

/**
 * Determine if val is null or undefined.
 *
 * @param {*} val The value to validate.
 * @returns {boolean}
 */
exports.isNullOrUndefined = function(val) {
    return val === undefined || val === null;
};

/**
 * Returns the current window size.
 * @returns {Array.<number>}
 */
exports.getWindowSize = function() {
    if(process.stdout.getWindowSize) {
        return process.stdout.getWindowSize();
    } else {
        return require('tty').getWindowSize();
    }
};

/**
 * A printf-style formatting function.
 *
 * @param {string} format The format string.
 * @param {...} va_args The format arguments.
 * @returns {string}
 */
exports.sprintf = function(format, va_args) {
    var regex = /%%|%(\d+\$)?([-+'#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuidfegEGj])/g;
    var a = arguments, i = 1;

    // pad()
    var pad = function(str, len, chr, leftJustify) {
        if(!chr) {
            chr = ' ';
        }
        //noinspection JSPotentiallyInvalidConstructorUsage
        var padding = (str.length >= len) ? '' : Array(1 + len - str.length >>> 0).join(chr);
        return leftJustify ? str + padding : padding + str;
    };

    // justify()
    var justify = function(value, prefix, leftJustify, minWidth, zeroPad, customPadChar) {
        var diff = minWidth - value.length;
        if(diff > 0) {
            if(leftJustify || !zeroPad) {
                value = pad(value, minWidth, customPadChar, leftJustify);
            } else {
                value = value.slice(0, prefix.length) + pad('', diff, '0', true) + value.slice(prefix.length);
            }
        }
        return value;
    };

    // formatBaseX()
    var formatBaseX = function(value, base, prefix, leftJustify, minWidth, precision, zeroPad) {
        // Note: casts negative numbers to positive ones
        var number = value >>> 0;
        prefix = prefix && number && {
            '2': '0b',
            '8': '0',
            '16': '0x'
        }[base] || '';
        //noinspection JSCheckFunctionSignatures
        value = prefix + pad(number.toString(base), precision || 0, '0', false);
        return justify(value, prefix, leftJustify, minWidth, zeroPad);
    };

    // formatString()
    var formatString = function(value, leftJustify, minWidth, precision, zeroPad, customPadChar) {
        if(precision !== null) {
            value = value.slice(0, precision);
        }
        return justify(value, '', leftJustify, minWidth, zeroPad, customPadChar);
    };

    // doFormat()
    var doFormat = function(substring, valueIndex, flags, minWidth, _, precision, type) {
        var number;
        var prefix;
        var method;
        var textTransform;
        var value;

        if(substring == '%%') {
            return '%';
        }

        // parse flags
        var leftJustify = false, positivePrefix = '', zeroPad = false, prefixBaseX = false, customPadChar = ' ';
        for(var j = 0, flagsLength = flags.length; flags && j < flagsLength; j++) {
            switch(flags.charAt(j)) {
                case ' ':
                    positivePrefix = ' ';
                    break;
                case '+':
                    positivePrefix = '+';
                    break;
                case '-':
                    leftJustify = true;
                    break;
                case "'":
                    customPadChar = flags.charAt(j + 1);
                    break;
                case '0':
                    zeroPad = true;
                    break;
                case '#':
                    prefixBaseX = true;
                    break;
            }
        }

        // parameters may be null, undefined, empty-string or real valued
        // we want to ignore null, undefined and empty-string values
        //noinspection IfStatementWithTooManyBranchesJS
        if(!minWidth) {
            minWidth = 0;
        } else if(minWidth == '*') {
            minWidth = +a[i++];
        } else if(minWidth.charAt(0) == '*') {
            minWidth = +a[minWidth.slice(1, -1)];
        } else {
            minWidth = +minWidth;
        }

        // Note: undocumented perl feature:
        if(minWidth < 0) {
            minWidth = -minWidth;
            leftJustify = true;
        }

        if(!isFinite(minWidth)) {
            throw new Error('sprintf: (minimum-)width must be finite');
        }

        // parameters may be null, undefined, empty-string or real valued
        // we want to ignore null, undefined and empty-string values
        //noinspection IfStatementWithTooManyBranchesJS
        if(!precision) {
            precision = 'fFeE'.indexOf(type) > -1 ? 6 : (type == 'd') ? 0 : undefined;
        } else if(precision == '*') {
            precision = +a[i++];
        } else if(precision.charAt(0) == '*') {
            precision = +a[precision.slice(1, -1)];
        } else {
            precision = +precision;
        }

        // grab value using valueIndex if required?
        value = valueIndex ? a[valueIndex.slice(0, -1)] : a[i++];

        switch(type) {
            case 's':
                return formatString(String(value), leftJustify, minWidth, precision, zeroPad, customPadChar);
            case 'c':
                return formatString(String.fromCharCode(+value), leftJustify, minWidth, precision, zeroPad);
            case 'b':
                return formatBaseX(value, 2, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'o':
                return formatBaseX(value, 8, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'x':
                return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'X':
                return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad).toUpperCase();
            case 'u':
                return formatBaseX(value, 10, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
            case 'i':
            case 'd':
                number = (+value) || 0;
                prefix = number < 0 ? '-' : positivePrefix;
                value = prefix + pad(String(Math.abs(number)), precision, '0', false);
                return justify(value, prefix, leftJustify, minWidth, zeroPad);
            case 'e':
            case 'E':
            case 'f':
            case 'F':
            case 'g':
            case 'G':
                number = +value;
                prefix = number < 0 ? '-' : positivePrefix;
                method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(type.toLowerCase())];
                textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(type) % 2];
                value = prefix + Math.abs(number)[method](precision);
                return justify(value, prefix, leftJustify, minWidth, zeroPad)[textTransform]();
            case 'j':
                prefix = '';
                value = util.inspect(value);
                return justify(value, prefix, leftJustify, minWidth, zeroPad);
            default:
                return substring;
        }
    };

    return format.replace(regex, doFormat);
};

/**
 * Extend target object with source objects.
 *
 * @param {object} target The target object.
 * @param {...object} va_args The source objects.
 */
exports.extend = function(target, va_args) {
    for(var i = 1, l = arguments.length; i < l; i++) {
        var source = arguments[i];

        for(var item in source) {
            if(source.hasOwnProperty(item)) {
                var value = source[item];
                if(typeof(value) == 'object') {
                    if(exports.isArray(value)) {
                        target[item] = value;
                    } else {
                        if(exports.isNullOrUndefined(target[item])) {
                            target[item] = {};
                        }

                        exports.extend(target[item], value);
                    }
                } else {
                    target[item] = value;
                }
            }
        }
    }

    return target;
};

exports.stripBOM = function(content) {
    // Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
    // because the buffer-to-string conversion in `fs.readFileSync()`
    // translates it to FEFF, the UTF-16 BOM.
    if(content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    return content;
};
