/**
 * Тестирование модуля go.Lang
 *
 * @package    go.js
 * @subpackage Lang
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
"use strict";

/*global window, document, go, tests, ok, equal */

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

tests.test("getType", function () {

	var undef, div, html, spans;

	equal(go.Lang.getType(undef), "undefined");
	equal(go.Lang.getType(null), "null");
	equal(go.Lang.getType(true), "boolean");
	equal(go.Lang.getType(3), "number");
	equal(go.Lang.getType(-3.3), "number");
	equal(go.Lang.getType("str"), "string");
	equal(go.Lang.getType(function () {}), "function");
	equal(go.Lang.getType({'x': 5}), "object");
	equal(go.Lang.getType([1, 2, 3]), "array");
	equal(go.Lang.getType(arguments), "arguments");

	div = document.createElement("div");
	div.innerHTML = "<span>1</span> <span>2</span>";
	spans = div.getElementsByTagName("span");

	equal(go.Lang.getType(div), "element");
	equal(go.Lang.getType(spans.item(0).firstChild), "textnode");
	equal(go.Lang.getType(spans), "collection");

	equal(go.Lang.getType({'go$type': 'user'}), "user");
});

tests.test("isArray", function () {

	var astrict   = [1, 2, 3],
		asimilar1 = arguments,
		asimilar2 = document.body.childNodes,
		anone1    = {'x': 1},
		anone2    = 5;

	ok(go.Lang.isArray(astrict));
	ok(go.Lang.isArray(asimilar1));
	ok(go.Lang.isArray(asimilar2));
	ok(!go.Lang.isArray(anone1));
	ok(!go.Lang.isArray(anone2));

	ok(go.Lang.isArray(astrict, true));
	ok(!go.Lang.isArray(asimilar1, true));
	ok(!go.Lang.isArray(asimilar2, true));
	ok(!go.Lang.isArray(anone1, true));
	ok(!go.Lang.isArray(anone2, true));
});
