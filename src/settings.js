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

var events = require('events');
var util = require('util');
var fs = require('fs');
var path = require('path');
var pkginfo = require('pkginfo').read(module).package;
var common = require('./common');
var existsSync = fs.existsSync ? fs.existsSync : path.existsSync;

/**
 * Represents a settings store.
 *
 * @constructor
 */
function Settings() {
    this.current = {};
    this.current.package = pkginfo;
}
util.inherits(Settings, events.EventEmitter);

/**
 * Returns the value for the specified setting or the default value.
 *
 * @this {Settings}
 * @param {string} key The setting key.
 * @param {*=} defaultValue The default value.
 */
Settings.prototype.get = function(key, defaultValue) {
    var path = key.split('.');
    var parent = this.current;

    for(var i = 0, l = path.length; i < l; i++) {
        var name = path[i];
        parent = parent[name];

        if(common.isNullOrUndefined(parent)) {
            return defaultValue;
        }
    }

    return parent;
};

/**
 * Sets a setting value.
 *
 * @this {Settings}
 * @param {string} key The setting key.
 * @param {*} value The new value.
 */
Settings.prototype.set = function(key, value) {
    var path = key.split('.');
    var parent = this.current;

    for(var i = 0, l = path.length - 1; i < l; i++) {
        var name = path[i];
        var item = parent[name];

        if(common.isNullOrUndefined(item)) {
            item = parent[name] = {};
        }

        parent = item;
    }

    parent[path[path.length - 1]] = value;
    this.emit('set');
};

/**
 * Imports a settings file and merge the settings.
 *
 * @this {Settings}
 * @param {string} file The settings file path.
 */
Settings.prototype.importFile = function(file) {
    if(!existsSync(file)) {
        return;
    }

    var code = common.stripBOM(fs.readFileSync(file, 'utf8'));
    var values = JSON.parse(code);
    common.extend(this.current, values);
    this.emit('set');
};

module.exports = new Settings();
