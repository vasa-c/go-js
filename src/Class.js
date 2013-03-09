/**
 * go.Class: надстройка над ООП с "классовым" синтаксисом
 *
 * @package    go.js
 * @subpackage Class
 * @author     Григорьев Олег aka vasa_c (http://blgo.ru/)
 */
/*jslint nomen: true */
/*global go, window */

if (!window.go) {
    throw new Error("go.core is not found");
}

go("Class", function (go) {
    "use strict";

    var
        Class,
        RootPrototype,
        ClassCreatorPrototype,
        ClassCreatorConstructor,
        MutatorsListPrototype,
        MutatorsListConstructor,
        undef;

    /**
     * Прототип корневого класса
     * Свойства и методы, доступные во всех объектах (или классах)
     *
     * @type {Object}
     */
    RootPrototype = {

        /**
         * @lends go.Class.Root.prototype
         */

        /**
         * "Расширенный тип" экземпляров классов
         * @see go.Lang.getType
         * @name go.Class.Root#go$type
         * @protected
         * @type {String}
         */
        'go$type': "go.object",

        /**
         * Имя класса для строкового представления
         *
         * @name go.Class.Root#__classname
         * @protected
         * @type {String}
         */
        '__classname': "go.Class.Root",

        /**
         * Признак абстрактного класса
         *
         * @name go.Class.Root#__abstract
         * @protected
         * @type {Boolean}
         */
        '__abstract': true,

        /**
         * Признак финального класса
         *
         * @name go.Class.Root#__final
         * @protected
         * @type {Boolean}
         */
        '__final': false,

        /**
         * Базовый конструктор
         * @constructs
         * @public
         */
        '__construct': function () {},

        /**
         * Базовый деструктор
         *
         * @protected
         */
        '__destruct': function () {},

        /**
         * Вызов родительского конструктора
         *
         * @name go.Class.Root#__parentConstructor
         * @protected
         * @param {Function} C
         *        родительский класс
         */
        '__parentConstruct': function (C) {
            var args = Array.prototype.slice.call(arguments);
            args[0] = this;
            C.__construct.apply(C, args);
        },

        /**
         * Вызов родительского деструктора
         *
         * @name go.Class.Root#__parentDestructor
         * @protected
         * @param {Function} C
         */
        '__parentDestruct': function (C) {
            C.__destruct(this);
        },

        /**
         * Вызов метода из родительского класса
         *
         * @name go.Class.Root#__parentMethod
         * @protected
         * @param {Function} C
         *        родительский класс
         * @param {String} name
         *        имя метода
         * @param {... *} [args]
         *        аргументы метода
         * @return {*}
         *         результат выполнения запрошенного метода
         */
        '__parentMethod': function (C) {
            var args = Array.prototype.slice.call(arguments);
            args[0] = this;
            return C.__method.apply(C, args);
        },

        /**
         * Принудительное разрушение экземпляра
         *
         * @name go.Class.Root#destroy
         * @public
         * @return void
         */
        'destroy': function () {
            var k, undef;
            if (this.__destroyed) {
                return;
            }
            this.__destruct();
            for (k in this) {
                if (this.hasOwnProperty(k)) {
                    this[k] = undef;
                }
            }
            this.__destroyed = true;
        },

        /**
         * Является ли объект экземпляром указанного класса
         *
         * @name go.Class.Root#instance_of
         * @public
         * @param {Function} C
         *        проверяемый класс
         * @return {Boolean}
         */
        'instance_of': function (C) {
            if ((typeof C === "function") && (this instanceof C)) {
                return true;
            }
            return this.__self.isSubclassOf(C);
        },

        /**
         * Строковое представление объекта
         *
         * @return {String}
         */
        'toString': function () {
            var classname = this.__self ? this.__self.__classname : "undefined";
            return "instance of [" + classname + "]";
        },

        /**
         * Предопределённые мутаторы
         *
         * @type {Object}
         */
        '__mutators': {

            /**
             * Мутатор "sysvars" - перенос системных переменных в класс
             */
            'sysvars': {
                'vars' : {
                    '__abstract'  : false,
                    '__final'     : false,
                    '__classname' : "go.class"
                },
                'processClass': function (props) {
                    var C = this.Class,
                        vars = this.vars,
                        name;
                    for (name in vars) {
                        if (vars.hasOwnProperty(name)) {
                            if (props.hasOwnProperty(name)) {
                                C[name] = props[name];
                                delete props[name];
                            } else {
                                C[name] = vars[name];
                            }
                        }
                    }
                    delete props.eoc;
                }
            },

            /**
             * Мутатор "static" - перенос статических полей в класс из объекта
             */
            'static': {
                'processClass': function (props) {
                    var C  = this.Class,
                        st = props.__static,
                        fields,
                        k;
                    if (st) {
                        fields = this.fields;
                        go.Lang.extend(fields, st);
                        for (k in fields) {
                            if (fields.hasOwnProperty(k)) {
                                C[k] = fields[k];
                            }
                        }
                        delete props.__static;
                    }
                }
            },

            /**
             * Мутатор "bind" - связь методов с объектом
             */
            'bind': {
                'regexp': /^on[A-Z_]/,
                'bindvar': "__bind",
                'processClass': function (props) {
                    var names = this.getMethodsNames(props),
                        fields = this.fields,
                        i,
                        len,
                        name,
                        fn;
                    for (i = 0, len = names.length; i < len; i += 1) {
                        name = names[i];
                        fn = props[name];
                        if (typeof fn === "function") {
                            delete props[name];
                            fields[name] = fn;
                        }
                    }
                },
                'processInstance': function (instance) {
                    var bind = go.Lang.bind,
                        fields = this.fields,
                        k;
                    for (k in fields) {
                        if (fields.hasOwnProperty(k)) {
                            instance[k] = bind(fields[k], instance);
                            instance[k].__original = fields[k];
                        }
                    }
                },
                'getMethod': function (name, instance) {
                    if (this.fields.hasOwnProperty(name)) {
                        return go.Lang.bind(this.fields[name], instance);
                    }
                    return undef;
                },
                'getMethodsNames': function (props) {
                    var names,
                        k,
                        reg = this.regexp;
                    if (props.hasOwnProperty(this.bindvar)) {
                        names = props[this.bindvar];
                        if (!names) {
                            names = [];
                        }
                        delete props[this.bindvars];
                    } else {
                        names = [];
                        for (k in props) {
                            if (props.hasOwnProperty(k)) {
                                if (reg.test(k)) {
                                    names.push(k);
                                }
                            }
                        }
                    }
                    return names;
                }
            }
        }
    };

    /**
     * Прототип объектов, создающих конструкторы новых классов
     *
     * @type {Object}
     * @property {Function} Class
     *           итоговая функция-конструктор
     * @property {Object} props
     *           переданные в качестве аргумента поля класса
     * @property {mixed} cparents
     *           переданные в качестве аргумента предки класса
     */
    ClassCreatorPrototype = {

        /**
         * Конструктор
         *
         * @param {(Function|Array.<Function>)} [parents]
         *        класс-предок или список предков
         * @param {Object} props
         *        набор свойств и методов класса
         */
        '__construct': function (parents, props) {
            if (!props) {
                props = parents;
                parents = null;
            }
            this.props    = props;
            this.cparents = parents;
        },

        /**
         * Деструктор
         */
        '__destruct': function () {
        },

        /**
         * Создание класса
         *
         * @public
         * @return void
         * @throws go.Class.Exceptions.Final
         */
        'create': function () {
            this.createClass();
            this.separateParents();
            if (!this.checkParentsNoFinal()) {
                throw new Class.Exceptions.Final("Cannot extend final class");
            }
            this.createPrototype();
            this.createMutators();
            this.applyOtherParents();
            this.fillClass();
        },

        /**
         * Получение класса созданного класса
         *
         * @public
         * @return {Function}
         */
        'getClass': function () {
            return this.Class;
        },

        /**
         * Создание функции-конструктора
         *
         * @private
         * @return void
         * @throws go.Class.Exceptions.Abstract
         */
        'createClass': function () {
            var C = function () {
                if (C.__abstract) {
                    throw new Class.Exceptions.Abstract("Cannot instantiate abstract class");
                }
                if ((!(this instanceof C)) || (this.hasOwnProperty("__destroyed"))) {
                    var instance = new C.__Fake();
                    C.apply(instance, arguments);
                    return instance;
                }
                C.__fillInstance(this);
                this.__destroyed = false;
                this.__construct.apply(this, arguments);
            };
            C.__props = this.props;
            this.Class = C;
        },

        /**
         * Разделение предков на основные и второстепенные
         *
         * @private
         * @return void
         */
        'separateParents': function () {
            var cparents = this.cparents,
                C = this.Class;
            if (!cparents) {
                C.__parent       = null;
                C.__otherParents = [];
            } else if (typeof cparents === "function") {
                C.__parent       = cparents;
                C.__otherParents = [];
            } else {
                C.__parent       = cparents[0];
                C.__otherParents = cparents.slice(1);
            }
            if ((!C.__parent) && Class.Root) {
                C.__parent = Class.Root;
            }
        },

        /**
         * Проверить, что среди предков нет финальных
         *
         * @private
         * @return {Boolean}
         */
        'checkParentsNoFinal': function () {
            var i, len, parents, parent, C = this.Class;
            if (C.__parent && C.__parent.__final) {
                return false;
            }
            parents = C.__otherParents;
            for (i = 0, len = parents.length; i < len; i += 1) {
                parent = parents[i];
                if (typeof parent === "function") {
                    if (parent.__final) {
                        return false;
                    }
                }
            }
            return true;
        },

        /**
         * Создание объекта прототипа
         *
         * @private
         * @return void
         */
        'createPrototype': function () {
            var C = this.Class;
            if (C.__parent) {
                C.prototype = new C.__parent.__Fake();
            } else {
                C.prototype = {};
            }
            C.prototype.constructor = C;
            C.prototype.__self      = C;
        },

        /**
         * Создание списка мутаторов
         *
         * @private
         * @return void
         */
        'createMutators': function () {
            var C = this.Class,
                mutators = new MutatorsListConstructor(C);
            C.__mutators = mutators;
            mutators.create();
        },

        /**
         * Перенести поля второстепенных предков в прототип
         *
         * @todo ref
         * @private
         * @return void
         */
        'applyOtherParents': function () {
            var oparents = this.Class.__otherParents,
                proto    = this.Class.prototype,
                parent,
                i,
                len,
                k,
                undef;
            for (i = 0, len = oparents.length; i < len; i += 1) {
                parent = oparents[i];
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
         * Заполнение класса и прототипа нужными свойствами
         *
         * @return void
         */
        'fillClass': function () {
            var C = this.Class,
                props = go.Lang.copy(this.props);
            C.go$type = "go.class";
            C.__Fake  = function () {};
            C.__Fake.prototype = C.prototype;
            go.Lang.extend(C, this.classMethods);
            C.toString = this.classMethods.toString; // IE не копирует toString
            C.__mutators.processClass(props);
            go.Lang.extend(C.prototype, props);
        },

        /**
         * Базовые статические методы класса
         */
        'classMethods': {

            /**
             * @lends go.Class.Root
             */

            /**
             * Является ли класс, подклассом указанного
             *
             * @name go.Class.Root.isSubclassOf
             * @public
             * @param {Function} wparent
             * @return {Boolean}
             */
            'isSubclassOf': function (wparent) {
                var i, len, other, oparent;
                if (wparent === this) {
                    return true;
                }
                if (!this.__parent) {
                    return false;
                }
                if (this.__parent.isSubclassOf(wparent)) {
                    return true;
                }
                other = this.__otherParents;
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
             * @name go.Class.Root.__construct
             * @public
             * @param {Object} instance
             * @param {... *} args
             */
            '__construct': function (instance) {
                var args = [instance, "__construct"];
                args = args.concat(Array.prototype.slice.call(arguments, 1));
                this.__method.apply(this, args);
            },

            /**
             * Вызов деструктора данного класса для объекта
             *
             * @name go.Class.Root.__destruct
             * @public
             * @param {Object} instance
             */
            '__destruct': function (instance) {
                this.__method.call(this, instance, "__destruct");
            },

            /**
             * Вызов метода данного класса для объекта
             *
             * @name go.Class.Root.__method
             * @public
             *
             * @param {Object} instance
             *        объект
             * @param {String} name
             *        имя метода
             * @param {... *} args
             *         аргументы метода
             * @return {*}
             *         результат, возвращённый методом
             * @throws go.Class.Exceptions.Method
             */
            '__method': function (instance, name) {
                var args = Array.prototype.slice.call(arguments, 2),
                    fn = this.prototype[name],
                    message;
                if (!fn) {
                    fn = this.__mutators.getMethod(name, instance);
                    if (!fn) {
                        message = "Method " + name + " is not found";
                        throw new Class.Exceptions.Method(message);
                    }
                }
                return fn.apply(instance, args);
            },

            /**
             * Заполнение экземпляра объекта нужными свойствами
             * На этапе конструирования до вызова __construct()
             *
             * @param {Object} instance
             */
            '__fillInstance': function (instance) {
                this.__mutators.processInstance(instance);
            },

            /**
             * @return {String}
             */
            'toString': function () {
                return "class [" + this.__classname + "]";
            }
        },

        'eoc': null
    };
    ClassCreatorConstructor = function (parents, props) {
        this.__construct(parents, props);
    };
    ClassCreatorConstructor.prototype = ClassCreatorPrototype;

    /**
     * Прототип объектов, представляющих списки мутаторов конкретных классов
     *
     * @property {Function} Class
     *           целевой класс
     * @property {Object} mutators
     *           набор мутаторов (имя => объект мутатора)
     */
    MutatorsListPrototype = {

        /**
         * @constructs
         * @param {Function} C
         *        целевой класс
         */
        '__construct': function (C) {
            this.Class = C;
        },

        /**
         * Создание списка мутаторов для данного класса
         *
         * @public
         * @return void
         */
        'create': function () {
            this.mutators = {};
            this.createDirectLine();
            this.mergeColBranch();
        },

        /**
         * Формирование данных на этапе формирования класса
         *
         * @public
         * @param {Object} props
         */
        'processClass': function (props) {
            var mutators = this.mutators,
                k;
            delete props.__mutators;
            for (k in mutators) {
                if (mutators.hasOwnProperty(k)) {
                    if (mutators[k]) {
                        mutators[k].processClass(props);
                    }
                }
            }
            return props;
        },

        /**
         * Обработка создаваемого экземпляра класса
         *
         * @public
         * @param {Object} instance
         */
        'processInstance': function (instance) {
            var mutators = this.mutators,
                k;
            for (k in mutators) {
                if (mutators.hasOwnProperty(k)) {
                    if (mutators[k]) {
                        mutators[k].processInstance(instance);
                    }
                }
            }
        },

        /**
         * Получить метод, сохранённый в мутаторах
         *
         * @public
         * @param {String} name
         * @param {Object} instance
         * @return {Function}
         */
        'getMethod': function (name, instance) {
            var mutators = this.mutators,
                k,
                method;
            for (k in mutators) {
                if (mutators.hasOwnProperty(k)) {
                    method = mutators[k].getMethod(name, instance);
                    if (method) {
                        return method;
                    }
                }
            }
        },

        /**
         * Создание мутаторов из прямой ветки (без множественного наследования)
         *
         * @private
         * @return void
         */
        'createDirectLine': function () {
            var C = this.Class,
                mutators = this.mutators,
                mprops   = C.__props.__mutators || {},
                mparents = C.__parent ? C.__parent.__mutators.mutators : {},
                k,
                mutator;
            for (k in mparents) {
                if (mparents.hasOwnProperty(k)) {
                    mutator = mparents[k];
                    if (mprops.hasOwnProperty(k)) {
                        if (mprops[k]) {
                            mutators[k] = this.extendMutator(k, mutator, mprops[k], C.__parent);
                        } else {
                            mutators[k] = null;
                        }
                    } else {
                        mutators[k] = this.copyMutator(k, mutator, C.__parent);
                    }
                }
            }
            for (k in mprops) {
                if (mprops.hasOwnProperty(k)) {
                    if (!mutators.hasOwnProperty(k)) {
                        if (mprops[k]) {
                            mutators[k] = this.createNewMutator(k, mprops[k]);
                        } else {
                            mutators[k] = null;
                        }
                    }
                }
            }
        },

        /**
         * Слияние с мутаторами из второстепенных предков
         *
         * @private
         * @return void
         */
        'mergeColBranch': function () {
            var oparents = this.Class.__otherParents,
                oparent,
                mutators = this.mutators,
                pmutators,
                len = oparents.length,
                i,
                k;
            for (i = 0; i < len; i += 1) {
                oparent = oparents[i];
                if (typeof oparent === "function") {
                    pmutators = oparent.__mutators && oparent.__mutators.mutators;
                    if (pmutators) {
                        for (k in pmutators) {
                            if (pmutators.hasOwnProperty(k)) {
                                if (!mutators.hasOwnProperty(k)) {
                                    mutators[k] = this.copyMutator(k, pmutators[k], oparent);
                                }
                            }
                        }
                    }
                }
            }
        },

        /**
         * Создать новый мутатор
         *
         * @param {String} name
         * @param {Object} props
         * @param {Object} [bproto]
         * @param {Function} [parent]
         * @return {Mutator}
         */
        'createNewMutator': function (name, props, bproto, parent) {
            var Fake, proto, Constr;
            Fake = function () {};
            Fake.prototype = bproto || this.Mutator.prototype;
            proto = new Fake();
            go.Lang.extend(proto, props);
            Constr = function (name, C, parent) {
                this.__construct(name, C, parent);
            };
            Constr.prototype = proto;
            proto.constructor = Constr;
            return new Constr(name, this.Class, parent);
        },

        /**
         * Расширить предковый мутатор
         *
         * @param {String} name
         * @param {Mutator} mparent
         * @param {Object} props
         * @param {Function} [parent]
         * @return {Mutator}
         */
        'extendMutator': function (name, mparent, props, parent) {
            return this.createNewMutator(name, props, mparent.constructor.prototype, parent);
        },

        /**
         * Скопировать предковый мутатор
         *
         * @param {String} name
         * @param {Mutator} mparent
         * @param {go.class} parent
         * @return {Mutator}
         */
        'copyMutator': function (name, mparent, parent) {
            return new mparent.constructor(name, this.Class, parent);
        },

        /**
         * Базовый "класс" мутаторов
         *
         * @constructor
         * @property {String} name
         *           название мутатора
         * @property {Function} Class
         *           класс, к которому привязан
         * @property {Function} parent
         *           класс-пердок от которого наследован мутатор
         * @property {Object} fields
         *           сохраняемые поля
         */
        'Mutator': (function () {

            var Construct = function (name, C, parent) {
                this.__construct(name, C, parent);
            };
            Construct.prototype = {

                /**
                 * @constructs
                 * @param {String} name
                 *        имя мутатора
                 * @param {Function} C
                 *        класс к которому привязан
                 * @param {Function} [parent]
                 *        класс от которого мутатор наследован
                 */
                '__construct': function (name, C, parent) {
                    this.name   = name;
                    this.Class  = C;
                    this.fields = {};
                    this.parent = parent;
                    this.loadFromParents();
                },

                /**
                 * Обработка полей на этапе создания класса
                 *
                 * @public
                 * @param {Object} props
                 */
                'processClass': function (props) {

                },

                /**
                 * Заполнение экземпляра класса
                 *
                 * @public
                 * @param {Object} instance
                 */
                'processInstance': function (instance) {

                },

                /**
                 * Получить метод, если он сохранён в данном мутаторе
                 *
                 * @public
                 * @params {String} name
                 * @params {go.object} instance
                 */
                'getMethod': function () {
                    // переопределяется в потомках
                },

                /**
                 * Подгрузка полей из предков
                 *
                 * @private
                 * @return void
                 */
                'loadFromParents': function () {
                    var C = this.Class,
                        parent = C.__parent,
                        oparents = C.__otherParents,
                        oparent,
                        i;
                    for (i = oparents.length; i > 0; i -= 1) {
                        oparent = oparents[i - 1];
                        if ((typeof oparent === "function") && oparent.go$type) {
                            this.loadFromSingleParent(oparent);
                        }
                    }
                    if (parent) {
                        this.loadFromSingleParent(parent);
                    }
                },

                /**
                 * Подгрузка полей из одного предка
                 *
                 * @private
                 * @param {Function} parent
                 */
                'loadFromSingleParent': function (parent) {
                    var mutators = parent.__mutators;
                    if (!mutators) {
                        return;
                    }
                    mutators = mutators.mutators;
                    if (!mutators.hasOwnProperty(this.name)) {
                        return;
                    }
                    go.Lang.extend(this.fields, mutators[this.name].fields);
                },

                'eoc': null
            };
            Construct.prototype.constructor = Construct;

            return Construct;
        }()),

        'eoc': null
    };
    MutatorsListConstructor = function (C) {
        MutatorsListPrototype.__construct(C);
    };
    MutatorsListConstructor.prototype = MutatorsListPrototype;

    /**
     * Функция создания нового класса
     *
     * @name go.Class
     * @public
     * @param {(Function|Array.<Function>)} [parents]
     *        класс-предок или список предков
     * @param {Object} props
     *        список методов и свойств класса
     * @return {Function}
     *         функция-конструктор экземпляров требуемого класса
     */
    Class = function (parents, props) {
        var creator, C;
        creator = new ClassCreatorConstructor(parents, props);
        creator.create();
        C = creator.getClass();
        creator.__destruct();
        return C;
    };

    /**
     * @class go.Class.Root
     *        базовый класс
     */
    Class.Root = Class.apply(window, [null, RootPrototype]);
    Class.Root.prototype.toString = RootPrototype.toString; // IE !!!

    /**
     * @namespace go.Class.Exceptions
     *            исключения при работе с библиотекой
     */
    Class.Exceptions = (function () {
        var create = go.Lang.Exception.create,
            Base = create("go.Class.Exceptions.Base", go.Lang.Exception);
        return {

            /**
             * @class go.Class.Exceptions.Base
             *        базовое исключение при работе с go.Class
             * @augments go.Lang.Exception.Base
             * @abstract
             */
            'Base': Base,

            /**
             * @class go.Class.Exceptions.Abstract
             *        попытка инстанцировать абстрактный класс
             * @augments go.Class.Exceptions.Base
             */
            'Abstract': create("go.Class.Exceptions.Abstract", Base),

            /**
             * @class go.Class.Exceptions.Final
             *        попытка расширить финальный класс
             * @augments go.Class.Exceptions.Base
             */
            'Final': create("go.Class.Exceptions.Final", Base),

            /**
             * @class go.Class.Exceptions.Method
             *        попытка вызова не существующего метода
             * @augments go.Class.Exceptions.Method
             */
            'Method': create("go.Class.Exceptions.Method", Base)
        };
    }());

    return Class;
});