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
var glob = require('glob');

/**
 * Specifies the available FileList operations.
 * @enum {number}
 */
var operationTypes = {
    include: 1,
    exclude: 2
};

/**
 * A file list allows to generate a list of files based en glob expressions.
 *
 * @constructor
 * @param {string} basePath The base directory path for file resolution.
 */
function FileList(basePath) {
    /**
     * The base directory path.
     * @type {string}
     * @private
     */
    this._basePath = basePath;

    /**
     * The list of operations.
     * @type {Array.<object>}
     * @private
     */
    this._operations = [];

    /**
     * The list of selected files.
     * @type {Array.<string>}
     * @private
     */
    this._files = [];
}
module.exports = FileList;

/**
 * Add an include operation.
 *
 * @this {FileList}
 * @public
 * @param {string} expression The expression.
 * @param {boolean=} force For the expression.
 */
FileList.prototype.include = function(expression, force) {
    this._operations.push({ type: operationTypes.include, expression: expression, force: (force === true) });
    this._files = [];
};

/**
 * Add an exclude operation.
 *
 * @this {FileList}
 * @public
 * @param {string} expression The expression.
 * @param {boolean=} force For the expression.
 */
FileList.prototype.exclude = function(expression, force) {
    this._operations.push({ type: operationTypes.exclude, expression: expression, force: (force === true) });
    this._files = [];
};

/**
 * Returns the selected files.
 *
 * @this {FileList}
 * @public
 * @returns {Array.<string>}
 */
FileList.prototype.getFiles = function() {
    var self = this;

    if(this._files.length === 0) {
        this._operations.forEach(function(op) {
            if(!op.force) {
                var matches = glob(op.expression, { cwd: this._basePath, mark: true, sync: true });

                matches.forEach(function(file) {
                    if(op.type == operationTypes.include) {
                        if(self._files.indexOf(file) === -1) {
                            self._files.push(file);
                        }
                    } else {
                        var idx = self._files.indexOf(file);
                        if(idx >= 0) {
                            delete self._files[idx];
                        }
                    }
                });
            }
        });

        this._operations.forEach(function(op) {
            if(op.force) {
                var matches = glob(op.expression, { cwd: this._basePath, mark: true, sync: true });

                matches.forEach(function(file) {
                    if(op.type == operationTypes.include) {
                        if(self._files.indexOf(file) === -1) {
                            self._files.push(file);
                        }
                    } else {
                        var idx = self._files.indexOf(file);
                        if(idx >= 0) {
                            delete self._files[idx];
                        }
                    }
                });
            }
        });
    }

    return this._files;
};
