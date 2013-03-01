/**
 * Тестирование модуля go.Lang
 *
 * @package    go.js
 * @subpackage Lang
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global window, document, go, tests, ok, equal, deepEqual, alert */
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

tests.test("bind() no builtin Function.bind", function () {
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

    obj1.f.bind = null;

    obj2.f_norm = obj1.f;
    obj2.f_bind = go.Lang.bind(obj1.f, obj1);

    equal(obj2.f_norm(), 2);
    equal(obj2.f_bind(), 1);
});

tests.test("bind() arguments + no builtin Function.bind", function () {

    var obj = {'x': "x"}, f, f1, f2;

    f = function (a, b, c, d) {
        return [this.x, a, b, c, d].join(", ");
    };

    f.bind = null;

    f1 = go.Lang.bind(f, obj);
    f2 = go.Lang.bind(f, obj, ["a", "b"]);

    equal(f1(1, 2, 3, 4), "x, 1, 2, 3, 4");
    equal(f2(1, 2, 3, 4), "x, a, b, 1, 2");
});

tests.test("getType", function () {

    var undef,
        ConstructorEArray,
        div,
        span,
        collection,
        ConstructorEObject,
        instance;

    equal(go.Lang.getType(undef), "undefined", "undefined");

    equal(go.Lang.getType(null), "null", "null");

    equal(go.Lang.getType(5), "number", "positive number");
    equal(go.Lang.getType(-5), "number", "negative number");
    equal(go.Lang.getType(10 / 3), "number", "float number");
    equal(go.Lang.getType(0), "number", "number 0");
    equal(go.Lang.getType(Number["NaN"]), "number", "NaN");
    equal(go.Lang.getType(Number.NEGATIVE_INFINITY), "number", "-Infinity");
    equal(go.Lang.getType(Number.POSITIVE_INFINITY), "number", "+Infinity");
    equal(go.Lang.getType(new Number(3)), "number", "object Number");

    equal(go.Lang.getType(true), "boolean", "true boolean");
    equal(go.Lang.getType(false), "boolean", "false boolean");
    equal(go.Lang.getType(new Boolean(true)), "boolean", "object Boolean");

    equal(go.Lang.getType("string"), "string", "string");
    equal(go.Lang.getType(""), "string", "empty string");
    equal(go.Lang.getType(new String("string")), "string", "object String");

    equal(go.Lang.getType(function () {return true; }), "function", "user function");
    equal(go.Lang.getType(Math.floor), "function", "built-in function");
    equal(go.Lang.getType(Array), "function", "built-in constructor");
    equal(go.Lang.getType(alert), "function", "host function (alert)");
    equal(go.Lang.getType(document.getElementById), "function", "host (dom) function");
    /*jslint evil: true */
    equal(go.Lang.getType(new Function('return true')), "function", "new Function");
    /*jslint evil: false */

    equal(go.Lang.getType([1, 2, 3]), "array", "literal array");
    equal(go.Lang.getType(new Array(1, 2, 3)), "array", "new Array");
    equal(go.Lang.getType([]), "array", "empty Array");

    ConstructorEArray = function () {};
    ConstructorEArray.prototype = new Array();
    equal(go.Lang.getType(new ConstructorEArray()), "array", "extended Array");

    equal(go.Lang.getType(/\s/), "regexp", "literal RegExp");
    equal(go.Lang.getType(new RegExp("^a")), "regexp", "new RegExp");

    equal(go.Lang.getType(new Error()), "error", "base Error");
    equal(go.Lang.getType(new TypeError()), "error", "specific Error");
    try {
        undef.method();
    } catch (e) {
        equal(go.Lang.getType(e), "error", "catch exception");
    }

    equal(go.Lang.getType(new Date()), "date", "date");

    div = document.createElement("div");
    span = document.createElement("span");
    equal(go.Lang.getType(div), "element", "HTMLDivElement");
    equal(go.Lang.getType(div), "element", "HTMLSpanElement");

    div.innerHTML = "<span>1</span> <span>2</span>";
    collection = div.getElementsByTagName("span");
    equal(go.Lang.getType(collection), "collection", "HTMLCollection");

    equal(go.Lang.getType(collection[0].firstChild), "textnode", "Text node");

    equal(go.Lang.getType(arguments), "arguments", "arguments object");

    equal(go.Lang.getType({'x': 5}), "object", "simple dict (literal)");
    equal(go.Lang.getType(new Object()), "object", "simple dict (new Object)");

    ConstructorEObject = function (x) {
        this.x = x;
    };
    ConstructorEObject.prototype.method = function () {};
    instance = new ConstructorEObject(7);
    equal(go.Lang.getType(instance), "object", "extended Object");

    ConstructorEObject.prototype.go$type = "user";
    equal(go.Lang.getType(instance), "user", "user defined type");
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

tests.test("isDict", function () {

    ok(go.Lang.isDict({'a': 1, 'b': 2}));
    ok(!go.Lang.isDict([1, 2]));
    ok(!go.Lang.isDict(document.createElement("div")));
    ok(!go.Lang.isDict(function () {}));
    ok(!go.Lang.isDict(1));
    ok(!go.Lang.isDict(null));
    ok(!go.Lang.isDict());
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

tests.test("copy", function () {

    var srcArray  = [1, 2, 3, 4, 5],
        srcObject = {'x': 5, 'y': 6},
        copyArray,
        copyObject;

    copyArray = go.Lang.copy(srcArray);
    deepEqual(copyArray, srcArray);
    ok(copyArray !== srcArray);
    copyArray.push(6);
    equal(copyArray.length - srcArray.length, 1);

    copyObject = go.Lang.copy(srcObject);
    deepEqual(copyObject, srcObject);
    ok(copyObject !== srcObject);
    copyObject.y = 7;
    equal(srcObject.y, 6);

});

tests.test("extend", function () {
    var objDest, objSrc, objPSrc, ConstrSrc, expected;

    objDest = {
        'a': "dest a",
        'b': "dest b",
        'c': "dest c"
    };
    objPSrc = {
        'b': "proto b",
        'c': "proto c"
    };
    ConstrSrc = function () {};
    ConstrSrc.prototype = objPSrc;
    objSrc = new ConstrSrc();
    objSrc.c = "src c";
    objSrc.d = "src d";

    expected = {
        'a': "dest a",
        'b': "dest b",
        'c': "src c",
        'd': "src d"
    };
    deepEqual(go.Lang.extend(objDest, objSrc), expected, "extend() not deep");
    deepEqual(objDest, expected);

    objDest = {
        'a': "dest a",
        'b': "dest b",
        'c': "dest c"
    };
    expected = {
        'a': "dest a",
        'b': "proto b",
        'c': "src c",
        'd': "src d"
    };
    deepEqual(go.Lang.extend(objDest, objSrc, true), expected, "extend() deep");
    deepEqual(objDest, expected);
});

tests.test("merge", function () {
    var
        destination = {
            'a': "only in dest",
            'c': "c-dest",
            'd': {'x': 5},
            'e': 1,
            'f': {
                'g': 7,
                'j': {
                    'x': 1,
                    'y': 2
                }
            }
        },
        source = {
            'b': "only in source",
            'c': "c-source",
            'd': [1, 2],
            'e': {'x': 6},
            'f': {
                'h': 8,
                'j': {
                    'x': 3,
                    'z': 4
                }
            }
        },
        expected = {
            'a': "only in dest",
            'b': "only in source",
            'c': "c-source",
            'd': [1, 2],
            'e': {'x': 6},
            'f': {
                'g': 7,
                'h': 8,
                'j': {
                    'x': 3,
                    'y': 2,
                    'z': 4
                }
            }
        };

    equal(go.Lang.merge(destination, source), destination);
    deepEqual(destination, expected);
});

tests.test("curry", function () {

    var cur, cur2;

    function f(a, b, c, d) {
        return [a, b, c, d].join(", ");
    }

    cur = go.Lang.curry(f, 1, 2);
    equal(cur(3, 4), "1, 2, 3, 4");

    cur2 = go.Lang.curry(cur, 5);
    equal(cur2(6), "1, 2, 5, 6");
});

tests.test("inArray", function () {

    var
        obj1 = {'x': 5},
        obj2 = {'x': 5},
        haystack = [1, 3, "5", obj1];

    ok(go.Lang.inArray(1, haystack));
    ok(go.Lang.inArray(3, haystack));
    ok(go.Lang.inArray("5", haystack));
    ok(go.Lang.inArray(obj1, haystack));

    ok(!go.Lang.inArray(true, haystack));
    ok(!go.Lang.inArray("3", haystack));
    ok(!go.Lang.inArray(5, haystack));
    ok(!go.Lang.inArray(obj2, haystack));
});

tests.test("tryDo", function () {

    var one, two, undef, funcs;

    function err() {
        var x = 5;
        return x(6);
    }

    function fone() {
        if (!one) {
            throw new Error();
        }
        return "one";
    }

    function ftwo() {
        if (!two) {
            throw new Error();
        }
        return "two";
    }

    funcs = [err, fone, ftwo];

    one = true;
    two = true;
    equal(go.Lang.tryDo(funcs), "one");

    one = false;
    equal(go.Lang.tryDo(funcs), "two");

    two = false;
    equal(go.Lang.tryDo(funcs), undef);
});

tests.test("parseQuery", function () {
    deepEqual(go.Lang.parseQuery(""), {});
    deepEqual(go.Lang.parseQuery("x=1&y=2"), {'x': "1", 'y': "2"});
    deepEqual(go.Lang.parseQuery("x=one%3Atwo&y=2"), {'x': "one:two", 'y': "2"});
    deepEqual(go.Lang.parseQuery("12345&x=5"), {'': "12345", 'x': "5"});
    deepEqual(go.Lang.parseQuery({'x': "5"}), {'x': "5"});
});

tests.test("buildQuery", function () {
    var
        vars = {
            'one': 1,
            'two': "two:three",
            'A': {
                'x': 5,
                'y': [1, 2, 3]
            }
        },
        expected = "one=1&two=two%3Athree&A[x]=5&A[y][0]=1&A[y][1]=2&A[y][2]=3";
    equal(go.Lang.buildQuery(vars), expected);
    equal(go.Lang.buildQuery(expected), expected);
});

tests.test("go.Lang.f", function () {

    equal(go.Lang.f.empty());
    equal(go.Lang.f.ffalse(), false);

});

tests.test("go.Lang.Exception", function () {

    var
        OneError = go.Lang.Exception.create("One", go.Lang.Exception),
        TwoError = go.Lang.Exception.create("Two", OneError),
        ThreeError = go.Lang.Exception.create("Three", OneError),
        MessageError = go.Lang.Exception.create("Message", null, "default");

    try {
        throw new TwoError("warning");
    } catch (e) {
        ok(e instanceof Error);
        ok(e instanceof go.Lang.Exception);
        ok(e instanceof go.Lang.Exception.Base);
        ok(e instanceof OneError);
        ok(e instanceof TwoError);
        ok(!(e instanceof ThreeError));

        equal(e.name, "Two");
        equal(e.message, "warning");
    }

    try {
        throw new MessageError("msg");
    } catch (e2) {
        equal(e2.message, "msg");
    }

    try {
        throw new MessageError();
    } catch (e3) {
        equal(e3.message, "default");
    }
});

tests.test("go.Lang.Listeners.create", function () {

    var listener, f1, f2, f3, result, idf2;

    f1 = function () {
        result.push(1);
    };
    f2 = function () {
        result.push(2);
    };
    f3 = function () {
        result.push(3);
    };

    listener = go.Lang.Listeners.create(f1);

    result = [];
    listener();
    deepEqual(result, [1]);
    listener.ping();
    deepEqual(result, [1, 1]);

    result = [];
    idf2 = listener.append(f2);
    equal(idf2, listener.append(f2, true));
    listener();
    listener.append(f3);
    listener();
    deepEqual(result, [1, 2, 1, 2, 3]);

    result = [];
    ok(listener.remove(idf2));
    listener();
    ok(!listener.remove(idf2));
    ok(listener.remove(f3));
    listener();
    ok(!listener.remove(f3));
    deepEqual(result, [1, 3, 1]);
});
