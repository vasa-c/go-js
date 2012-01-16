/**
 * Тестирование модуля go.Class
 *
 * @package    go.js
 * @subpackage Class
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global window, document, go, tests, ok, equal, notEqual, deepEqual, raises */
"use strict";

tests.module("Class");

tests.test("Create class and instance", function () {

    var TestClass, obj1, obj2;

    TestClass = go.Class({

        'setX': function (x) {
            this.x = x;
        },

        'getX': function () {
            return this.x;
        },

        'eoc': null
    });

    equal(typeof TestClass, "function");

    obj1 = new TestClass();
    obj2 = new TestClass();

    ok(obj1 instanceof TestClass);
    notEqual(obj1, obj2);

    obj1.setX(1);
    obj2.setX(2);

    equal(obj1.getX(), 1);
    equal(obj2.getX(), 2);
});

tests.test("constructor can be called without new", function () {

    var testClass, obj;

    testClass = go.Class({
        'f': function () {
            return "f";
        }
    });

    obj = testClass();
    ok(obj instanceof testClass);
    equal(obj.f(), "f");
});

tests.test("go.Class.Root is root class", function () {

    var TestClass, obj;

    TestClass = go.Class({});
    obj = new TestClass();
    ok(obj instanceof TestClass);
    ok(obj instanceof go.Class.Root);
});

tests.test("constructor/destructor", function () {

    var TestClass, obj1, obj2, destrCount = 0;

    TestClass = go.Class({

        '__construct': function (value) {
            this.value = value;
        },

        '__destruct': function () {
            destrCount += 1;
        },

        'getValue': function () {
            return this.value;
        },

        'eoc': null
    });

    obj1 = new TestClass(1);
    obj2 = new TestClass(2);

    equal(obj1.getValue(), 1);
    equal(obj2.getValue(), 2);

    equal(destrCount, 0);
    obj1.destroy();
    equal(destrCount, 1);
    obj2.destroy();
    equal(destrCount, 2);
});

tests.test("inheritance (single)", function () {

    var OneClass, TwoClass, ThreeClass, objTwo, objThree;

    OneClass = go.Class({
        'func_a': function () {return "one a"; },
        'func_b': function () {return "one b"; },
        'func_c': function () {return "one c"; },
        'eoc': null
    });
    TwoClass = go.Class(OneClass, {
        'func_b': function () {return "two b"; },
        'func_c': function () {return "two c"; },
        'eoc': null
    });
    ThreeClass = go.Class(TwoClass, {
        'func_c': function () {return "three c"; },
        'func_d': function () {return "three d"; },
        'eoc': null
    });

    objTwo = new TwoClass();
    objThree = new ThreeClass();

    ok(objTwo instanceof go.Class.Root);
    ok(objTwo instanceof OneClass);
    ok(objTwo instanceof TwoClass);
    ok(!(objTwo instanceof ThreeClass));

    ok(objThree instanceof go.Class.Root);
    ok(objThree instanceof OneClass);
    ok(objThree instanceof TwoClass);
    ok(objThree instanceof ThreeClass);

    equal(objTwo.func_a(), "one a");
    equal(objTwo.func_b(), "two b");
    equal(objTwo.func_c(), "two c");
    ok(!objTwo.func_d);

    equal(objThree.func_a(), "one a");
    equal(objThree.func_b(), "two b");
    equal(objThree.func_c(), "three c");
    equal(objThree.func_d(), "three d");
});

tests.test("inheritance (multi)", function () {

    var
        OneParentClass,
        OneClass,
        TwoParentClass,
        TwoClass,
        ThreePrototype,
        ThreeConstructor,
        ThreeObject,
        FourHash,
        ResultClass,
        ResultObject,
        NoHierClass;

    OneParentClass = go.Class({
        'f_a': function () {return "a: one parent"; }
    });
    OneClass = go.Class(OneParentClass, {
        'f_b': function () {return "b: one"; }
    });

    TwoParentClass = go.Class({
        'f_c': function () {return "c: two parent"; }
    });
    TwoClass = go.Class(TwoParentClass, {
        'f_a': function () {return "a: two"; },
        'f_d': function () {return "d: two"; },
        'f_e': function () {return "e: two"; }
    });

    ThreePrototype = {
        'f_d': function () {return "d: three"; },
        'f_f': function () {return "f: three"; }
    };
    ThreeConstructor = function () {};
    ThreeConstructor.prototype = ThreePrototype;
    ThreeObject = new ThreeConstructor();

    FourHash = {
        'f_g': function () {return "g: four"; }
    };

    ResultClass = go.Class([OneClass, TwoClass, ThreeObject, FourHash], {
        'f_e': function () {return "e: result"; },
        'f_h': function () {return "h: result"; }
    });
    ResultObject = new ResultClass();

    equal(ResultClass.parent, OneClass);
    deepEqual(ResultClass.otherParents, [TwoClass, ThreeObject, FourHash]);

    equal(ResultObject.f_a(), "a: one parent");
    equal(ResultObject.f_b(), "b: one");
    equal(ResultObject.f_c(), "c: two parent");
    equal(ResultObject.f_d(), "d: two");
    equal(ResultObject.f_e(), "e: result");
    equal(ResultObject.f_f(), "f: three");
    equal(ResultObject.f_g(), "g: four");
    equal(ResultObject.f_h(), "h: result");

    ok(ResultObject instanceof OneParentClass);
    ok(ResultObject instanceof OneClass);
    ok(!(ResultObject instanceof TwoParentClass));
    ok(!(ResultObject instanceof TwoClass));
    ok(!(ResultObject instanceof ThreeConstructor));

    ok(ResultObject.instance_of(OneParentClass));
    ok(ResultObject.instance_of(OneClass));
    ok(ResultObject.instance_of(TwoParentClass));
    ok(ResultObject.instance_of(TwoClass));
    ok(ResultObject.instance_of(ThreeConstructor));
    ok(ResultObject.instance_of(FourHash));

    NoHierClass = go.Class({});
    ok(!ResultObject.instance_of(NoHierClass));
});

tests.test("save constructor.prototype", function () {

    var TestClass, instance;

    TestClass = go.Class({
        'eoc': null
    });

    instance = new TestClass();

    equal(instance.constructor, TestClass);
});

tests.test("parent access", function () {

    var OneClass, TwoClass, SideClass, TargetClass, instance, destrs = [];

    OneClass = go.Class({
        '__construct': function (a) {
            this.a = a;
        },

        '__destruct': function () {
            destrs.push("One");
        },

        'getValue': function (plus) {
            return this.a + plus;
        }
    });

    TwoClass = go.Class(OneClass, {
        '__construct': function (a, b) {
            this.__parentConstruct(OneClass, a);
            this.b = b;
        },

        '__destruct': function () {
            this.__parentDestruct(OneClass);
            destrs.push("Two");
        }
    });

    SideClass = go.Class({
        '__construct': function (c) {
            this.c = c;
        },

        '__destruct': function () {
            destrs.push("Side");
        }
    });

    TargetClass = go.Class([OneClass, TwoClass, SideClass], {
        '__construct': function (a, b, c, d) {
            this.__parentConstruct(TwoClass, a, b);
            this.__parentConstruct(SideClass, c);
            this.d = d;
        },

        '__destruct': function () {
            this.__parentDestruct(TwoClass);
            this.__parentDestruct(SideClass);
            destrs.push("Target");
        },

        'getValue': function (plus) {
            return this.__parentMethod(TwoClass, 'getValue', plus) * 2;
        }
    });

    instance = new TargetClass(1, 2, 3, 4);
    equal(instance.a, 1);
    equal(instance.b, 2);
    equal(instance.c, 3);
    equal(instance.d, 4);
    equal(instance.getValue(2), 6);

    instance.destroy();
    deepEqual(destrs, ["One", "Two", "Side", "Target"]);
});

tests.test("abstract", function () {

    var BaseClass, CClass, instance;

    BaseClass = go.Class({
        '__abstract': true,

        'func': function () {
            return "f";
        }
    });
    CClass = go.Class(BaseClass, {
        'func2': function () {
            return this.func() + "2";
        }
    });

    ok(BaseClass.abstract);
    ok(!CClass.abstract);

    raises(function () {instance = new BaseClass(); }, go.Class.Exceptions.Abstract);
    instance = new CClass();

    equal(instance.func2(), "f2");
    equal(typeof instance.__abstract, "undefined");

    ok(go.Class.Root.abstract);
    raises(function () {instance = new go.Class.Root(); }, go.Class.Exceptions.Abstract);
});