/**
 * go.Tests: unit testing go.js
 *
 * @package    go.js
 * @subpackage Tests
 * @author     Grigoriev Oleg aka vasa_c <go.vasac@gmail.com>
 * @uses       QUnit (http://docs.jquery.com/QUnit)
 */
/* global ok, deepEqual */

if (!window.go) {
    throw new Error("go.core is not found");
}

go.module("Tests", null, function (go, global) {
    "use strict";

    /**
     * Prototype of test-objects
     * These objects are created using go.Test()-constructor
     * @example var test = new go.Tests(modules, testDir)
     *
     * @class go.Tests
     * @property {String} testDir
     *           directory of test files
     * @property {Array} calls
     *           list of accumulated calls (function, args).
     */
    var TestsPrototype = {
        /**
         * @lends go.Tests.prototype
         */

        /**
         * Global QUnit functions
         *
         * @const {Object}
         */
        'QUNIT': {
            'test': global.test,
            'module': global.module
        },

        /**
         * @constructs
         * @name go.Tests#__constructor
         * @param {Array.<String>} modules
         *        List of names of test modules
         * @param {String} testDir
         *        directory of test files
         */
        '__constructor': function (modules, testDir) {
            this.testDir = testDir;
            this.calls = [];
            this.loadModules(modules);
        },

        /**
         * Run accumulated tests
         *
         * @name go.Tests#run
         * @public
         * @return void
         */
        'run': function () {
            var calls = this.calls, obj = global, i, len, call;
            for (i = 0, len = calls.length; i < len; i += 1) {
                call = calls[i];
                call[0].apply(obj, call[1]);
            }
        },

        /**
         * Destructor
         *
         * @name go.Tests#destroy
         * @public
         * @return void
         */
        'destroy': function () {
            this.calls = null;
        },

        /**
         * Add test to run
         * Called from the file unit tests
         *
         * Arguments: see test() from QUnit
         * @see http://docs.jquery.com/QUnit/test#nameexpectedtest
         *
         * @name go.Tests#test
         * @public
         * @param {String} name
         * @param {Number} [expected]
         * @param {Function} test
         * @return void
         */
        'test': function () {
            this.calls.push([this.QUNIT.test, arguments]);
        },

        /**
         * Specify the current test module
         * Called from the file unit tests
         *
         * Arguments: see module() from QUnit
         * @see http://docs.jquery.com/QUnit/module#namelifecycle
         *
         * @name go.Tests#test
         * @public
         * @param {String} name
         * @param {Object} [lifecycle]
         * @return void
         */
        'module': function () {
            this.calls.push([this.QUNIT.module, arguments]);
        },

        /**
         * Comparison of the two mixed arrays
         *
         * Lists of values ​​in the array must be the same, but the order may vary.
         *
         * @param {Array} actual
         * @param {Array} expected
         * @param {String} message
         */
        'equalShuffledArrays': function (actual, expected, message) {
            var toString = Object.prototype.toString,
                o1 = {},
                o2 = {},
                len,
                i;
            if (toString.call(actual) !== "[object Array]") {
                ok(false, message);
                return;
            }
            if (toString.call(expected) !== "[object Array]") {
                ok(false, message);
                return;
            }
            len = actual.length;
            if (expected.length !== len) {
                ok(false, message);
                return;
            }
            for (i = 0; i < len; i += 1) {
                o1[actual[i]] = true;
                o2[expected[i]] = true;
            }
            deepEqual(o1, o2, message);
        },

        /**
         * Load required modules with tests
         *
         * @name go.Tests#loadModules
         * @private
         * @param {Array.<String>} modules
         *        names of modules list
         * @return void
         */
        'loadModules': function (modules) {
            var scripts = [],
                name,
                src,
                len = modules.length,
                i;
            for (i = 0; i < len; i += 1) {
                name = modules[i];
                if (name) {
                    go.include(name);
                } else {
                    name = "core";
                }
                src = this.testDir + name + ".js";
                scripts.push('<script type="text/javascript" src="' + src + '"></script>');
            }
            global.document.write(scripts.join(""));
        },

        'eoc': null
    };

    function TestsConstructor(modules, testDir) {
        this.__constructor(modules, testDir);
    }
    TestsConstructor.prototype = TestsPrototype;

    return TestsConstructor;
});
