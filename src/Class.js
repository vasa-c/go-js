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
            'constructor' : "__construct",
            'destructor'  : "__destruct",
            'destroy'     : "destroy",
            'instance_of' : "instance_of"
        }
    };

    /**
     * Прототип корневого класса
     * Свойства и методы, доступные во всех объектах
     */
    RootPrototype = {
        'go$type'   : "go.object",
        '$settings' : RootSettings,
        'toString': function () {
            return "[go.object]";
        }
    };
    RootPrototype[RootSettings.names.constructor] = function () {};
    RootPrototype[RootSettings.names.destructor] = function () {};
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
            var i, len, parent, k, proto;
            proto = this.proto;
            for (i = 0, len = this.otherParents.length; i < len; i += 1) {
                parent = this.otherParents[i];
                if (typeof parent === "function") {
                    parent = parent.prototype;
                }
                if (parent) {
                    /*jslint forin: true */
                    for (k in parent) {
                        if (!(k in proto)) {
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
            if (this.parent) {
                this.settings = this.parent.$settings;
            } else {
                this.settings = {};
            }
            if (this.props.$settings) {
                go.Lang.extend(this.settings, this.props.$settings);
                delete this.proto.$settings;
            }
        },

        /**
         * Создание функции-конструктора
         */
        'createClass': function () {
            this.Class = function C() {
                if (!(this instanceof C)) { // @todo проверить все случаи
                    var instance = new C.Fake();
                    C.apply(instance, arguments);
                    return instance;
                }
                this.$self = C; // @todo в нужное место перенести
                this[C.$settings.names.constructor].apply(this, arguments);
            };
            this.Class.prototype = this.proto;
            this.proto.constructor = this.Class;
        },

        /**
         * Заполнение объекта класса нужными свойствами
         */
        'fillClassProperties': function () {
            this.Class.Fake = function () {};
            this.Class.Fake.prototype = this.proto;
            this.Class.$settings = this.settings;
            this.Class.$parent = this.parent;
            this.Class.$otherParents = this.otherParents;
            this.Class.isSubclassOf = this.class__isSubclassOf;
        },

        'class__isSubclassOf': function (wparent) {
            var i, len, other, oparent;
            if (wparent === this) {
                return true;
            }
            if (!this.$parent) {
                return false;
            }
            if (this.$parent.isSubclassOf(wparent)) {
                return true;
            }
            other = this.$otherParents;
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
    Class.Root = Class(null, RootPrototype);

    return Class;
}(go)));