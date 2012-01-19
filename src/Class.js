/**
 * go.Class: надстройка над ООП с "классовым" синтаксисом
 *
 * @package    go.js
 * @subpackage Class
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint node: true, nomen: true */
/*global go, window */
"use strict";

if (!window.go) {
    throw new Error("go.core is not found");
}

go("Class", (function (go) {

    var
        Class,
        RootSettings,
        RootPrototype,
        ClassCreatorPrototype,
        ClassCreatorConstructor;

    /**
     * Настройки корневого класса
     */
    RootSettings = {
        'names': {
            'constructor'       : "__construct",
            'destructor'        : "__destruct",
            'parentConstructor' : "__parentConstruct",
            'parentDestructor'  : "__parentDestruct",
            'parentMethod'      : "__parentMethod",
            'settings'          : "__settings",
            'abstract'          : "__abstract",
            'final'             : "__final",
            'classname'         : "__classname",
            'destroy'           : "destroy",
            'instance_of'       : "instance_of"
        }
    };

    /**
     * Прототип корневого класса
     * Свойства и методы, доступные во всех объектах
     */
    RootPrototype = {
        'go$type' : "go.object",
        'toString': function () {
            return "instance of [" + (this.$self && this.$self.classname) + "]";
        }
    };
    RootPrototype[RootSettings.names.classname] = "go.Class.Root";
    RootPrototype[RootSettings.names.settings] = RootSettings;
    RootPrototype[RootSettings.names.abstract] = true;
    RootPrototype[RootSettings.names.constructor] = function () {};
    RootPrototype[RootSettings.names.destructor] = function () {};
    RootPrototype[RootSettings.names.parentConstructor] = function (C) {
        var args = Array.prototype.slice.call(arguments);
        args[0] = this;
        C.__construct.apply(C, args);
    };
    RootPrototype[RootSettings.names.parentDestructor] = function (C) {
        C.__destruct(this);
    };
    RootPrototype[RootSettings.names.parentMethod] = function (C, name) {
        /*jslint unparam: true */
        var args = Array.prototype.slice.call(arguments);
        args[0] = this;
        /*jslint unparam: false */
        return C.__method.apply(C, args);
    };
    RootPrototype[RootSettings.names.destroy] = function () {
        this.__destruct(); // @todo settings (когда будет self)
    };
    RootPrototype[RootSettings.names.instance_of] = function (C) {
        if ((typeof C === "function") && (this instanceof C)) {
            return true;
        }
        return this.$self.isSubclassOf(C);
    };

    /**
     * Прототип объектов, создающих конструкторы новых классов
     *
     * @var function Class
     *      итоговая функция-конструктор
     * @var hash proto
     *      объект, служащий в качестве прототипа для класса
     * @var hash props
     *      переданные в класс поля
     * @var Class parent
     *      основной предок класса
     * @var Class[] otherParents
     *      список дополнительных предков
     * @var hash settings
     *      настройки класса
     * @var bool abstract
     *      абстрактный ли класс
     */
    ClassCreatorPrototype = {

        /**
         * Конструктор
         *
         * @param mixed parents
         *        класс-предок или список предков (или null)
         * @param hash props
         *        набор свойств и методов класса
         */
        '__construct': function (parents, props) {
            if (!props) {
                props = parents;
                parents = null;
            }
            this.props = props;
            this.separateParents(parents);
        },

        /**
         * Деструктор
         */
        '__destruct': function () {
        },

        /**
         * Создание класса
         */
        'create': function () {
            if (!this.checkParentsNoFinal()) {
                throw new Class.Exceptions.Final("Cannot extend final class");
            }
            this.createBlankPrototype();
            this.applyOtherParents();
            this.loadSettings();
            this.createClass();
            this.fillClassProperties();
        },

        /**
         * Получение класса
         */
        'getClass': function () {
            return this.Class;
        },

        /**
         * Разделение предков на основные и второстепенные
         *
         * @param mixed parents
         */
        'separateParents': function (parents) {
            if (!parents) {
                this.parent = null;
                this.otherParents = [];
            } else if (typeof parents === "function") {
                this.parent = parents;
                this.otherParents = [];
            } else {
                this.parent = parents[0];
                this.otherParents = parents.slice(1);
            }
            if ((!this.parent) && Class.Root) {
                this.parent = Class.Root;
            }
        },

        /**
         * Проверить, что среди предков нет финальных
         */
        'checkParentsNoFinal': function () {
            var i, len, parents, parent;
            if (this.parent && this.parent.final) {
                return false;
            }
            parents = this.otherParents;
            for (i = 0, len = parents.length; i < len; i += 1) {
                parent = parents[i];
                if (typeof parent === "function") {
                    if (parent.final) {
                        return false;
                    }
                }
            }
            return true;
        },

        /**
         * Создание заготовки прототипа
         */
        'createBlankPrototype': function () {
            if (this.parent) {
                this.proto = new this.parent.Fake();
            } else {
                this.proto = {};
            }
            go.Lang.extend(this.proto, this.props);
        },

        /**
         * Перенести поля второстепенных предков в прототип
         */
        'applyOtherParents': function () {
            var i, len, parent, k, proto, undef;
            proto = this.proto;
            for (i = 0, len = this.otherParents.length; i < len; i += 1) {
                parent = this.otherParents[i];
                if (typeof parent === "function") {
                    parent = parent.prototype;
                }
                if (parent) {
                    /*jslint forin: true */
                    for (k in parent) {
                        if (proto[k] === undef) {
                            proto[k] = parent[k];
                        }
                    }
                    /*jslint forin: false */
                }
            }
        },

        /**
         * Загрузка настроек класса
         */
        'loadSettings': function () {
            var propsS, propAbstract, propFinal, propClassname;
            if (this.parent) {
                this.settings = this.parent.settings;
            } else {
                this.settings = {};
            }
            propsS = this.props[RootSettings.names.settings]; // @todo обдумать
            if (propsS) {
                go.Lang.extend(this.settings, propsS);
                delete this.proto[RootSettings.names.settings];
            }

            /* @todo в другое место */
            propAbstract = this.props[this.settings.names.abstract];
            if (typeof propAbstract !== "undefined") {
                delete this.proto[this.settings.names.abstract];
            }
            this.abstract = propAbstract ? true : false;

            propFinal = this.props[this.settings.names.final];
            if (typeof propFinal !== "undefined") {
                delete this.proto[this.settings.names.final];
            }
            this.final = propFinal ? true : false;

            propClassname = this.props[this.settings.names.classname];
            if (typeof propClassname !== "undefined") {
                delete this.proto[this.settings.names.classname];
            }
            this.classname = propClassname || "go.class";
        },

        /**
         * Создание функции-конструктора
         */
        'createClass': function () {
            this.Class = function C() {
                if (C.abstract) {
                    throw new Class.Exceptions.Abstract("Cannot instantiate abstract class");
                }
                if (!(this instanceof C)) { // @todo проверить все случаи
                    var instance = new C.Fake();
                    C.apply(instance, arguments);
                    return instance;
                }
                this[C.settings.names.constructor].apply(this, arguments);
            };
            this.Class.prototype   = this.proto;
            this.proto.constructor = this.Class;
            this.proto.$self       = this.Class;
        },

        /**
         * Заполнение объекта класса нужными свойствами
         */
        'fillClassProperties': function () {
            var C  = this.Class;
            C.Fake           = function () {};
            C.Fake.prototype = this.proto;
            C.settings       = this.settings;
            C.parent         = this.parent;
            C.otherParents   = this.otherParents;
            C.abstract       = this.abstract;
            C.final          = this.final;
            C.go$type        = "go.class";
            C.classname      = this.classname;
            C.toString       = function () {
                return "class [" + C.classname + "]";
            };
            go.Lang.extend(C, this.classMethods);
        },

        /**
         * Базовые статические методы класса
         */
        'classMethods': {

            /**
             * Является ли класс, подклассом указанного
             *
             * @param go.class wparent
             * @return bool
             */
            'isSubclassOf': function (wparent) {
                var i, len, other, oparent;
                if (wparent === this) {
                    return true;
                }
                if (!this.parent) {
                    return false;
                }
                if (this.parent.isSubclassOf(wparent)) {
                    return true;
                }
                other = this.otherParents;
                for (i = 0, len = other.length; i < len; i += 1) {
                    oparent = other[i];
                    if (wparent === oparent) {
                        return true;
                    }
                    if (typeof oparent.isSubclassOf === "function") {
                        if (oparent.isSubclassOf(wparent)) {
                            return true;
                        }
                    }
                    if (typeof wparent === "function") {
                        if (oparent instanceof wparent) {
                            return true;
                        }
                    }
                }
                return false;
            },

            /**
             * Вызов конструктора данного класса для объекта
             *
             * @param go.object instance
             * @params mixed аргументы конструктора
             */
            '__construct': function (instance) {
                var cr = this.prototype[this.settings.names.constructor];
                cr.call.apply(cr, arguments);
            },

            /**
             * Вызов деструктора данного класса для объекта
             *
             * @param go.object instance
             */
            '__destruct': function (instance) {
                var dr = this.prototype[this.settings.names.destructor];
                dr.apply(instance);
            },

            /**
             * Вызов метода данного класса для объекта
             *
             * @param go.object instance
             * @param string name
             * @params mixed аргументы метода
             * @return mixed
             */
            '__method': function (instance, name) {
                var args = Array.prototype.slice.call(arguments, 2);
                return this.prototype[name].apply(instance, args);
            }
        },

        'eoc': null
    };
    ClassCreatorConstructor = function (parents, props) {
        this.__construct(parents, props);
    };
    ClassCreatorConstructor.prototype = ClassCreatorPrototype;

    /**
     * Функция создания нового класса
     * @alias go.Class
     */
    Class = function (parents, props) {
        var creator, C;
        creator = new ClassCreatorConstructor(parents, props);
        creator.create();
        C = creator.getClass();
        creator.__destruct();
        return C;
    };
    Class.Root = Class.apply(window, [null, RootPrototype]);
    Class.Exceptions = (function () {
        var create = go.Lang.Exception.create,
            Base = create("go.Class.Exceptions.Base", go.Lang.Exception);
        return {
            'Base'     : Base,
            'Abstract' : create("go.Class.Exceptions.Abstract", Base),
            'Final'    : create("go.Class.Exceptions.Final", Base)
        };
    }());

    return Class;
}(go)));