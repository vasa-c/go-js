/**
 * go.Tests: юнит-тестирование для go.js
 *
 * @package    go.js
 * @subpackage Tests
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 * @uses       QUnit (http://docs.jquery.com/QUnit)
 */
/*jslint nomen: true */
/*global go, window */

if (!window.go) {
    throw new Error("go.core is not found");
}

go("Tests", function (go, global) {
    "use strict";

    /**
     * Прототип объектов тестирования.
     * Создаются конструктором go.Tests().
     * @example var test = new go.Tests(modules, testDir)
     *
     * @class go.Tests
     * @property {String} testDir
     *      каталог с js-файлами тестов
     * @property {Array} calls
     *      список накопленных вызовов (function, args).
     */
    var TestsPrototype = {

        /**
         * @lends go.Tests.prototype
         */

        /**
         * Список нужных глобальных функций QUnit
         *
         * @const dict
         */
        'QUNIT' : {
            'test'   : global.test,
            'module' : global.module
        },

        /**
         * @constructs
         * @name go.Tests#__constructor
         * @param {Array.<String>} modules
         *        список имён тестируемых модулей
         * @param {String} testDir
         *        каталог с js-файлами тестов
         */
        '__constructor': function (modules, testDir) {
            this.testDir = testDir;
            this.calls   = [];
            this.loadModules(modules);
        },

        /**
         * Запуск накопленных тестов
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
         * Деструктор
         *
         * @name go.Tests#destroy
         * @public
         * @return void
         */
        'destroy': function () {
            this.calls = null;
        },

        /**
         * Определить тест
         * Вызывается из файла юнит-тестов
         *
         * Аргументы соответствуют test() из QUnit
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
         * Указать текущий тестируемый модуль
         * Вызывается из файла юнит-тестов
         *
         * Аргументы соответствуют module() из QUnit
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
         * Загрузка нужных модулей и тестов к ним
         *
         * @name go.Tests#loadModules
         * @private
         * @param {Array.<String>} modules
         *        список имён модулей
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