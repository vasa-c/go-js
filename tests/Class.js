/**
 * Testing the module go.Class
 *
 * @package    go.js
 * @subpackage Class
 * @author     Grigoriev Oleg aka vasa_c <go.vasac@gmail.com>
 */
/* jshint camelcase: false */
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
        }
    });

    equal(typeof TestClass, "function", "Class is function-constructor");

    obj1 = new TestClass();
    obj2 = new TestClass();

    ok(obj1 instanceof TestClass, "obj instance of Class");
    notEqual(obj1, obj2, "two instances is not equals");

    obj1.setX(1);
    obj2.setX(2);

    equal(obj1.getX(), 1, "Different instances share the different data");
    equal(obj2.getX(), 2, "Different instances share the different data");
});

tests.test("constructor can be called without new", function () {
    var testClass, obj;

    testClass = go.Class({
        'f': function () {
            return "f";
        }
    });

    obj = testClass();
    ok(obj instanceof testClass, "function result is instance of class");
    equal(obj.f(), "f", "instance has method");
});

tests.test("go.Class.Root is root class", function () {
    var TestClass, obj;

    TestClass = go.Class({});
    obj = new TestClass();
    ok(obj instanceof TestClass, "object instance of self class");
    ok(obj instanceof go.Class.Root, "object instance of Root class");
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
        }
    });

    obj1 = new TestClass(1);
    obj2 = new TestClass(2);

    equal(obj1.getValue(), 1, "constructor for obj1");
    equal(obj2.getValue(), 2, "constructor for obj2");

    equal(destrCount, 0);
    obj1.destroy();
    equal(destrCount, 1, "destructor for obj1");
    obj2.destroy();
    equal(destrCount, 2, "destructor for obj2");
    obj1.destroy();
    equal(destrCount, 2, "destructor is not called again");
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
    var OneParentClass,
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

    equal(ResultClass.__parent, OneClass);
    deepEqual(ResultClass.__otherParents, [TwoClass, ThreeObject, FourHash]);

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

    equal(instance.constructor, TestClass, "instance.constructor is a reference to the class");
});

tests.test("parent access", function () {
    var OneClass,
        TwoClass,
        SideClass,
        TargetClass,
        instance,
        destrs = [],
        onClick;

    OneClass = go.Class({
        '__construct': function (a) {
            this.a = a;
        },

        '__destruct': function () {
            destrs.push("One");
        },

        'getValue': function (plus) {
            return this.a + plus;
        },

        'onClick': function () {
            return "onclick " + this.a;
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
        },

        'onClick': function () {
            return this.__parentMethod(TwoClass, 'onClick') + " x";
        },

        'undefinedMethod': function () {
            return this.__parentMethod(TwoClass, "undef");
        }
    });

    instance = new TargetClass(1, 2, 3, 4);
    equal(instance.a, 1);
    equal(instance.b, 2);
    equal(instance.c, 3);
    equal(instance.d, 4);
    equal(instance.getValue(2), 6);
    onClick = instance.onClick;
    equal(onClick(), "onclick 1 x");

    function undefinedMethod() {
        instance.undefinedMethod();
    }
    throws(undefinedMethod, go.Class.Exceptions.Method);

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

    ok(BaseClass.__abstract, "Base class is abstract");
    ok(!CClass.__abstract, "Concrete class is not abstract");

    function instBase() {
        instance = new BaseClass();
    }
    throws(instBase, go.Class.Exceptions.Abstract, "Can not create an instance of an abstract class");

    instance = new CClass();
    equal(instance.func2(), "f2");
    equal(typeof instance.__abstract, "undefined", "instance has no abstract flag");

    ok(go.Class.Root.__abstract, "Root is abstract class");
    function instRoot() {
        instance = new go.Class.Root();
    }
    throws(instRoot, go.Class.Exceptions.Abstract, "Can not create an instance of Root-class");
});

tests.test("final", function () {
    var TestClass, instance;

    TestClass = go.Class({
        '__final': true,

        'func': function () {
            return "f";
        }
    });

    ok(TestClass.__final, "TestClass is final");

    instance = new TestClass();
    equal(instance.func(), "f", "");

    function extendTestClass() {
        var NClass = go.Class(TestClass, {});
        return new NClass();
    }
    throws(extendTestClass, go.Class.Exceptions.Final, "Can't extend final class");

    function extendMulti() {
        var NClass = go.Class([null, TestClass], {});
        return new NClass();
    }
    throws(extendMulti, go.Class.Exceptions.Final, "Can't extend final class (multi-inherit)");
});

tests.test("type and toString", function () {
    var OneClass, TwoClass, oneInstance, twoInstance;

    OneClass = go.Class({

    });

    TwoClass = go.Class({
        '__classname': "TwoClass"
    });

    oneInstance = new OneClass();
    twoInstance = new TwoClass();

    equal(go.Lang.getType(OneClass), "go.class");
    equal(go.Lang.getType(oneInstance), "go.object");

    equal(":" + OneClass, ":class [go.class]");
    equal(":" + TwoClass, ":class [TwoClass]");
    equal(":" + go.Class.Root, ":class [go.Class.Root]");
    equal(":" + oneInstance, ":instance of [go.class]");
    equal(":" + twoInstance, ":instance of [TwoClass]");
});

tests.test("Mutators (class)", function () {
    var OneClass, TwoClass, ThreeClass, twoInstance, threeInstance;

    OneClass = go.Class({
        '__mutators': {
            'mul': {
                'value': 2,
                'processClass': function (props) {
                    var name, prop, value = this.value;

                    for (name in props) {
                        if (props.hasOwnProperty(name)) {
                            prop = props[name];
                            if ((typeof prop === "function") && (name.split("_", 2)[0] === "mul")) {
                                props[name] = this.createFunc(prop, value);
                            }
                        }
                    }
                },
                'createFunc': function (f, value) {
                    return function (x) {
                        return f(x) * value;
                    };
                }
            }
        },

        'norm': function (x) {
            return x;
        },

        'mul_one': function (x) {
            return x + 1;
        },

        'mul_two': function (x) {
            return x + 2;
        }
    });

    TwoClass = go.Class(OneClass, {
        '__mutators': {
            'mul': {
                'value': 3
            },
            'x': null
        },

        'mul_two': function (x) {
            return x + 4;
        },

        'mul_three': function (x) {
            return x + 3;
        }
    });

    ThreeClass = go.Class(TwoClass, {
        '__mutators': {
            'mul': null,
            'x': null
        },

        'mul_four': function (x) {
            return x + 4;
        }
    });

    twoInstance = new TwoClass();

    equal(twoInstance.norm(1), 1, "norm() - no mutation");
    equal(twoInstance.mul_one(1), 4, "two.mul_one(1): (x+1)*2 [inherit value=2]");
    equal(twoInstance.mul_two(1), 15, "two.mul_two(1): (x+4)*3 [override value=3]");
    equal(twoInstance.mul_three(1), 12, "two.mul_three(1): (x+3)*3 [self value=3]"); // (x+3) * 3

    equal(twoInstance.__parentMethod(OneClass, "mul_two", 3), 10, "parent access"); // (x + 2) * 2

    threeInstance = new ThreeClass();
    equal(threeInstance.mul_four(1), 5, "mul_four: no mutation (mutator disabled)");
});

tests.test("static", function () {
    var OneClass, TwoClass, NoStaticClass, oneInstance, twoInstance;

    OneClass = go.Class({

        '__static': {

            'value': 1,

            'getInstance': function () {
                /* jshint newcap: false */
                if (!this.instance) {
                    this.instance = new this();
                }
                return this.instance;
            },

            'getValue': function () {
                return this.value;
            },

            'getPhrase': function () {
                return "one";
            }
        },

        'method': function () {
            return "instance";
        }
    });

    TwoClass = go.Class(OneClass, {
        '__static': {

            'value': 2,

            'getPhrase': function () {
                return "two";
            },

            'twoStatic': function () {
                return 'Two';
            }

        }
    });

    oneInstance = OneClass.getInstance();
    twoInstance = TwoClass.getInstance();

    ok(oneInstance.instance_of(OneClass));
    ok(!oneInstance.instance_of(TwoClass));
    ok(twoInstance.instance_of(OneClass));
    ok(twoInstance.instance_of(TwoClass));

    notEqual(oneInstance, twoInstance);
    equal(oneInstance, OneClass.getInstance());
    equal(twoInstance, TwoClass.getInstance());

    equal(twoInstance.method(), "instance");
    ok(!oneInstance.__static);
    ok(!twoInstance.__static);

    equal(OneClass.getValue(), 1);
    equal(TwoClass.getValue(), 2);
    equal(OneClass.getPhrase(), "one");
    equal(TwoClass.getPhrase(), "two");

    ok(!oneInstance.getInstance);
    ok(!twoInstance.getInstance);

    ok(TwoClass.twoStatic);
    ok(!OneClass.twoStatic);

    NoStaticClass = go.Class(go.Class(TwoClass, {}), {
        'method': function () {}
    });
    ok(NoStaticClass.getInstance, "Inheritance of static through classes without defining new static-members");
});

tests.test("bind", function () {
    var OneClass, TwoClass, ThreeClass, OtherClass, NoBindClass, instance, fake, f;

    OneClass = go.Class({

        '__construct': function (name) {
            this.name = name;
        },

        'getName': function () {
            return this.name;
        },

        'onClick': function () {
            return "onclick " + this.name;
        },

        'onPress': function () {
            return "onpress " + this.name;
        }
    });

    TwoClass = go.Class(OneClass, {
        '__bind': ["two"],

        'two': function () {
            return "two " + this.name;
        },

        'onTwo': function () {
            return "ontwo " + this.name;
        }
    });

    OtherClass = go.Class({
        'onOther': function () {
            return "onother " + this.name;
        }
    });

    ThreeClass = go.Class([TwoClass, OtherClass], {
        'onPress': function () {
            return "onpress-3 " + this.name;
        },

        'onLoad': function () {
            return "onload " + this.name;
        }
    });

    instance = new ThreeClass("instance");
    fake = {
        'name'    : "fake",
        'getName' : instance.getName,
        'onClick' : instance.onClick,
        'onPress' : instance.onPress,
        'two'     : instance.two,
        'onTwo'   : instance.onTwo,
        'onOther' : instance.onOther,
        'onLoad'  : instance.onLoad
    };

    equal(fake.getName(), "fake");
    equal(fake.onClick(), "onclick instance");
    equal(fake.onPress(), "onpress-3 instance");
    equal(fake.two(),     "two instance");
    equal(fake.onTwo(),   "ontwo fake");
    equal(fake.onOther(), "onother instance");
    equal(fake.onLoad(),  "onload instance");

    notEqual(instance.onLoad, ThreeClass.__props.onLoad);
    equal(instance.onLoad.__original, ThreeClass.__props.onLoad);

    NoBindClass = go.Class({
        '__bind': null,

        'onGetThis': function () {
            return this;
        }
    });

    instance = new NoBindClass();
    f = instance.onGetThis;
    notEqual(f(), instance, "cancel all bind");
});

tests.test("destroy", function () {
    var TestClass, instance, destr = 0;

    TestClass = go.Class({
        '__construct': function (x) {
            this.x = x;
            this.y = x * 2;
            this.z = x * 3;
        },

        '__destruct': function () {
            destr += 1;
        },

        'eoc': null
    });

    instance = new TestClass(1);

    equal(instance.z, 3);
    ok(!instance.__destroyed);

    instance.destroy();
    ok(!instance.x);
    ok(!instance.y);
    ok(!instance.z);
    equal(destr, 1);
    ok(instance.__destroyed);

    instance.destroy();
    equal(destr, 1);
});

tests.test("this-var for python style instantiation", function () {
    var TestClass, instance1, instance2;

    TestClass = go.Class({

        '__construct': function (value) {
            this.value = value;
        },

        'createInstance': function (value) {
            return this.__self(value);
        }

    });

    instance1 = new TestClass(1);
    instance2 = instance1.createInstance(2);

    equal(go.Lang.getType(instance2), "go.object");
    equal(instance2.value, 2);
});
