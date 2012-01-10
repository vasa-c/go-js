/**
 * go.Tests: юнит-тестирование для go.js
 *
 * @package    go.js
 * @subpackage Tests
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 * @uses       QUnit (http://docs.jquery.com/QUnit)
 */
"use strict";

/*global go, window */

if (!window.go) {
	throw new Error("go.core is not found");
}

go("Tests", (function (go, global) {

	/**
	 * Прототип объектов тестирования.
	 * Создаются конструктором go.Tests().
	 * @example var test = new go.Tests(modules, testDir)
	 *
	 * @namespace go
	 * @class Tests
	 * @var string testDir
	 *      каталог с js-файлами тестов
	 * @var list calls
	 *      список накопленных вызовов (function, args).
	 */
	var TestsPrototype = {

		/**
		 * Список нужных глобальных функций QUnit
		 *
		 * @const hash
		 */
		'QUNIT' : {
			'test'   : global.test,
			'module' : global.module
		},

		/**
		 * Конструктор
		 *
		 * @param string[] modules
		 *        список имён тестируемых модулей
		 * @param string testDir
		 *        каталог с js-файлами тестов
		 */
		'__constructor': function (modules, testDir) {
			this.testDir = testDir;
			this.calls   = [];
			this.loadModules(modules);
		},

		/**
		 * Запуск накопленных тестов
		 */
		'run': function () {
			var calls = this.calls, obj = global, i, len, call;
			for (i = 0, len = calls.length; i < len; i += 1) {
				call = calls[i];
				call[0].apply(obj, call[1]);
				console.log(call);
			}
		},

		/**
		 * Деструктор
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
		 * @param string name
		 * @param number expected [optional]
		 * @param function test
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
		 * @param string name
		 * @param hash lifecycle [optional]
		 */
		'module': function () {
			this.calls.push([this.QUNIT.module, arguments]);
		},

		/**
		 * Загрузка нужных модулей и тестов к ним
		 *
		 * @param string[] modules
		 *        список имён модулей
		 */
		'loadModules': function (modules) {

			var i, len, name, scripts = [], src;

			for (i = 0, len = modules.length; i < len; i += 1) {
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
}(go, window)));