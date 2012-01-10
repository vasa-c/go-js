/**
 * Тестирование модуля go.Lang
 *
 * @package    go.js
 * @subpackage Lang
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global window, document, go, tests, ok, equal, deepEqual */
"use strict";

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

	var obj = {'x': "x"}, f, f1, f2;

	f = function (a, b, c, d) {
		return [this.x, a, b, c, d].join(", ");
	};

	f1 = go.Lang.bind(f, obj);
	f2 = go.Lang.bind(f, obj, ["a", "b"]);

	equal(f1(1, 2, 3, 4), "x, 1, 2, 3, 4");
	equal(f2(1, 2, 3, 4), "x, a, b, 1, 2");
});

tests.test("bind(global)", function () {

	var f, obj;

	f = function (a, b) {
		var g = (this === window) ? "g" : "-";
		return [g, a, b].join(", ");
	};

	obj = {
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
	f.bind = function () {
		return function () {
			return "bind";
		};
	};

	var f2 = go.Lang.bind(f);
	equal(f2(), "bind");
});

tests.test("getType", function () {

	var undef, div, spans;

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

tests.test("each array", function () {

	var iter, fn, expected, div;

	iter = [1, 2, 3];
	fn = function (value, key, iter) {
		return value + ":" + key + ":" + iter.length;
	};
	expected = ["1:0:3", "2:1:3", "3:2:3"];
	deepEqual(go.Lang.each(iter, fn), expected, "iterate array");

	div = document.createElement("div");
	div.innerHTML = "<span>one</span> <span>two</span>";
	iter = div.getElementsByTagName("span");
	fn = function (value) {
		return value.firstChild.nodeValue;
	};
	expected = ["one", "two"];
	deepEqual(go.Lang.each(iter, fn), expected, "iterate collection");

	iter = (function () {return arguments; }(5, 4, 3));
	fn = function (value) {
		return value + 1;
	};
	expected = [6, 5, 4];
	deepEqual(go.Lang.each(iter, fn), expected, "iterate arguments object");
});

tests.test("each object", function () {

	var objPrototype = {'a' : 1, 'b' : 2},
		obj,
		expected,
		deepResult;
	function ObjConstructor(b, c) {
		this.b = b;
		this.c = c;
	}
	ObjConstructor.prototype = objPrototype;
	obj = new ObjConstructor(3, 4);

	function fn(value, key) {
		return key + "=>" + value;
	}
	expected = {
		'b' : "b=>3",
		'c' : "c=>4"
	};
	deepEqual(go.Lang.each(obj, fn), expected);

	deepResult = go.Lang.each(obj, fn, null, true);
	equal(deepResult.a, "a=>1");
	equal(deepResult.b, "b=>3");
	equal(deepResult.c, "c=>4");
});

tests.test("each bind", function () {
	var
		objV = {
			'a': "x",
			'b': "y",
			'c': "z"
		},
		objF = {
			'x': 5,
			'y': 7,
			'z': 9,
			'f': function (value) {
				return this[value];
			}
		},
		expected = {
			'a': 5,
			'b': 7,
			'c': 9
		};

	deepEqual(go.Lang.each(objV, objF.f, objF), expected);
});