/**
 * Тестирование модуля go.Lang
 *
 * @package    go.js
 * @subpackage Lang
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
"use strict";

/*global window, go, tests, ok, equal */

tests.module("Lang");

tests.test("bind() context", function () {

	var
		obj1 = {
			'x': 1,
			'f': function () {
				return this.x;
			}
		},
		obj2 = {
			'x': 2
		};

	obj2.f_norm = obj1.f;
	obj2.f_bind = go.Lang.bind(obj1.f, obj1);

	equal(obj2.f_norm(), 2);
	equal(obj2.f_bind(), 1);
});

tests.test("bind() arguments", function () {

	var obj = {'x': "x"}, f1, f2;

	function f(a, b, c, d) {
		return [this.x, a, b, c, d].join(", ");
	}

	f1 = go.Lang.bind(f, obj);
	f2 = go.Lang.bind(f, obj, ["a", "b"]);

	equal(f1(1, 2, 3, 4), "x, 1, 2, 3, 4");
	equal(f2(1, 2, 3, 4), "x, a, b, 1, 2");
});

tests.test("bind(global)", function () {

	function f(a, b) {
		var g = (this === window) ? "g" : "-";
		return [g, a, b].join(", ");
	}

	var obj = {
		'f_g'  : go.Lang.bind(f),
		'f_ga' : go.Lang.bind(f, null, ['a']),
		'f_n'  : f
	};

	equal(obj.f_g(1, 2), "g, 1, 2");
	equal(obj.f_ga(1, 2), "g, a, 1");
	equal(obj.f_n(1, 2), "-, 1, 2");
});

tests.test("bind() user defined", function () {

	function f() {
		return "f";
	}
	f.bind = function (thisArg, args) {
		return function () {
			return "bind";
		};
	};

	var f2 = go.Lang.bind(f);
	equal(f2(), "bind");
});