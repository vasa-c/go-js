/**
 * Тестирование модуля go.Ext
 *
 * @package    go.js
 * @subpackage Ext
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global window, document, go, tests, ok, equal, notEqual, deepEqual, raises, $ */
"use strict";

tests.module("Ext");

tests.test("Options class", function () {

    var OneClass, NClass, TwoClass, options, instance, expected;

    OneClass = go.Class([null, go.Ext.Options], {

        'options': {
            'one' : {
                'x' : 5,
                'y' : 6,
                'z' : 7
            },
            'two'   : 2,
            'three' : 3
        },

        '__construct': function (x, options) {
            this.x = x;
            go.Ext.Options.__construct(this, options); // this.initOptions(options);
        }

    });

    NClass = go.Class(OneClass, {});

    TwoClass = go.Class(NClass, {

        'options' : {
            'one' : {
                'x' : 8
            },
            'two'  : 4,
            'four' : 5
        }

    });

    options = {
        'one' : {
            'y' : 9
        },
        'five' : 6
    };

    instance = new TwoClass(1, options);

    expected = {
        'one' : {
            'x' : 8,
            'y' : 9,
            'z' : 7
        },
        'two'   : 4,
        'three' : 3,
        'four'  : 5,
        'five'  : 6
    };

    deepEqual(instance.getOptions(), expected, "getOptions()");
    deepEqual(instance.getOption("one.x"), expected.one.x, "getOptions(opt)");
    raises(function () {instance.getOption("two.x"); }, go.Ext.Options.Exceptions.NotFound, "getOption() error");

    instance.setOption("one.y", 11);
    expected.one.y = 11;
    deepEqual(instance.getOptions(), expected, "setOption()");

    raises(function () {instance.setOption("three.x"); }, go.Ext.Options.Exceptions.NotFound, "setOption() error");
    deepEqual(instance.getOptions(), expected);
});

tests.test("Options class and lazy copy", function () {

    var TestClass, one, two, three;

    TestClass = go.Class([null, go.Ext.Options], {
        'options' : {
            'x' : 1,
            'y' : 2
        },

        '__construct': function (options) {
            go.Ext.Options.__construct(this, options);
        }
    });

    one = new TestClass({'y': 3});
    two = new TestClass();
    three = new TestClass();

    equal(one.getOption("x"), 1);
    equal(two.getOption("x"), 1);
    equal(three.getOption("x"), 1);

    one.setOption("x", 2);
    equal(one.getOption("x"), 2);
    equal(two.getOption("x"), 1);
    equal(three.getOption("x"), 1);

    two.setOption("x", 3);
    equal(one.getOption("x"), 2);
    equal(two.getOption("x"), 3);
    equal(three.getOption("x"), 1);
});

tests.test("Nodes class: bind/unbind", function () {

    var TestClass,
        instance,
        html,
        node,
        oneClick = 0,
        twoClick = 0,
        oneSpan,
        twoSpan;

    TestClass = go.Class([null, go.Ext.Nodes], {

        '__construct': function (node) {
            this.initNodes(node);
            this.oneSpan = this.node.find("#one");
            this.twoSpan = this.node.find("#two");
            this.bind(this.oneSpan, "click", this.onClickOne);
            this.bind(this.twoSpan, "click", "onClickTwo");
        },

        'onClickOne': function () {
            oneClick += 1;
        },

        'onClickTwo': function () {
            twoClick += 1;
        },

        'unbindOne': function () {
            this.unbind(this.oneSpan, "click", this.onClickOne);
        },

        'eoc': null
    });

    html = "<div><span id='one'>qwe</span><span id='two'></span></div>";
    node = $(html);
    instance = new TestClass(node);

    oneSpan = node.find("#one");
    twoSpan = node.find("#two");

    deepEqual([oneClick, twoClick], [0, 0]);

    oneSpan.trigger("click");
    deepEqual([oneClick, twoClick], [1, 0]);
    twoSpan.trigger("click");
    deepEqual([oneClick, twoClick], [1, 1]);
    oneSpan.trigger("click");
    deepEqual([oneClick, twoClick], [2, 1]);
    twoSpan.trigger("click");
    deepEqual([oneClick, twoClick], [2, 2]);

    instance.unbindOne();
    oneSpan.trigger("click");
    deepEqual([oneClick, twoClick], [2, 2]);
    twoSpan.trigger("click");
    deepEqual([oneClick, twoClick], [2, 3]);

    instance.unbindAll();
    oneSpan.trigger("click");
    deepEqual([oneClick, twoClick], [2, 3]);
    twoSpan.trigger("click");
    deepEqual([oneClick, twoClick], [2, 3]);
});

tests.test("Nodes class: load nodes", function () {

    var ParentClass,
        TestClass,
        instance,
        html,
        div,
        events = [],
        expected,
        span,
        li;

    ParentClass = go.Class([null, go.Ext.Nodes], {
        'nodes': {
            'lis'  : "ul li",
            'span' : {
                'selector': ".sp",
                'events': {
                    'click': "onClickSpan"
                }
            },
            'par' : "ul li"
        }
    });

    TestClass = go.Class(ParentClass, {

        'nodes': {
            'secondLi' : function (node) {
                var li = node.find("li").eq(1);
                this.bind(li, "mouseover", this.onMouseOverLi);
                return li;
            },
            'par' : null
        },

        '__construct': function (node) {
            this.initNodes(node);
        },

        'onClickSpan': function () {
            events.push("click span");
        },

        'onMouseOverLi': function () {
            events.push("over li");
        },

        'eoc': null
    });

    html = "<div><ul><li>1</li><li>2</li><li>3</li></ul><span class='sp'>sp</span></div>";
    div  = $(html);

    instance = new TestClass(div);
    equal(instance.nodes.lis.length, 3);
    equal(instance.nodes.span.length, 1);
    equal(instance.nodes.secondLi.length, 1);
    equal(typeof instance.nodes.par, "undefined");

    span = div.find("span");
    li = div.find("li").eq(1);

    span.trigger("click");
    li.trigger("click");
    span.trigger("click");
    li.trigger("mouseover");

    expected = ["click span", "click span", "over li"];
    deepEqual(events, expected);

    instance.unbindAll();
    span.trigger("click");
    deepEqual(events, expected);
});

tests.test("Events class", function () {

    var TestClass, f1, f2, f3, instance1, instance2, result = [], expected;

    TestClass = go.Class([null, go.Ext.Events], {

        '__construct': function (value) {
            this.value = value;
        },

        'clk': function (m) {
            if (m % 2) {
                this.fireEvent("odd", this.value);
            } else {
                this.fireEvent("even", this.value);
            }
        },

        'eoc': null
    });

    f1 = function (e) {
        result.push("f1 " + e.type + " " + e.data);
    };
    f2 = function (e) {
        result.push("f2 " + e.type + " " + e.data);
    };
    f3 = function (e) {
        result.push("f3 " + e.type + " " + e.data);
    };

    instance1 = new TestClass(1);
    instance2 = new TestClass(2);

    instance1.addEventListener("odd", f1);
    instance1.addEventListener("even", f2);
    instance2.addEventListener("odd", f3);

    instance1.clk(1);
    instance2.clk(1);
    instance1.clk(2);
    instance2.clk(2);
    instance1.clk(3);
    instance2.clk(3);
    instance1.fireEvent("unknown", 5);

    expected = [
        "f1 odd 1",
        "f3 odd 2",
        "f2 even 1",
        "f1 odd 1",
        "f3 odd 2"
    ];
    deepEqual(result, expected);

    result = [];
    instance1.removeEventListener("even", f2);
    instance1.clk(1);
    instance2.clk(1);
    instance1.clk(2);
    instance2.clk(2);
    expected = [
        "f1 odd 1",
        "f3 odd 2"
    ];
    deepEqual(result, expected);
});
