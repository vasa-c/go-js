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
        RootPrototype,
        ClassCreatorPrototype,
        ClassCreatorConstructor,
        MutatorsListPrototype,
        MutatorsListConstructor;

    /**
     * Прототип корневого класса
     * Свойства и методы, доступные во всех объектах
     */
    RootPrototype = {
        'go$type'     : "go.object",
        '__classname' : "go.Class.Root",
        '__abstract'  : true,
        '__final'     : false,
        '__construct' : function () {},
        '__destruct'  : function () {},
        '__parentConstruct': function (C) {
            var args = Array.prototype.slice.call(arguments);
            args[0] = this;
            C.__construct.apply(C, args);
        },
        '__parentDestruct': function (C) {
            C.__destruct(this);
        },
        '__parentMethod': function (C, name) {
            /*jslint unparam: true */
            var args = Array.prototype.slice.call(arguments);
            args[0] = this;
            /*jslint unparam: false */
            return C.__method.apply(C, args);
        },
        'destroy': function () {
            this.__destruct();
        },
        'instance_of': function (C) {
            if ((typeof C === "function") && (this instanceof C)) {
                return true;
            }
            return this.__self.isSubclassOf(C);
        },
        'toString': function () {
            var classname = this.__self ? this.__self.__classname : "undefined";
            return "instance of [" + classname + "]";
        }
    };

    /**
     * Прототип объектов, создающих конструкторы новых классов
     *
     * @var function Class
     *      итоговая функция-конструктор
     * @var hash props
     *      переданные в качестве аргумента поля класса
     * @var mixed cparents
     *      переданные в качестве аргумента предки класса
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
         * Получение класса
         */
        'getClass': function () {
            return this.Class;
        },

        /**
         * Создание функции-конструктора
         */
        'createClass': function () {
            this.Class = function C() {
                if (C.__abstract) {
                    throw new Class.Exceptions.Abstract("Cannot instantiate abstract class");
                }
                if (!(this instanceof C)) { // @todo проверить все случаи
                    var instance = new C.__Fake();
                    C.apply(instance, arguments);
                    return instance;
                }
                C.__fillInstance(this);
                this.__construct.apply(this, arguments);
            };
            this.Class.__props = this.props;
        },

        /**
         * Разделение предков на основные и второстепенные
         *
         * @param mixed parents
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
         */
        'createMutators': function () {
            var C = this.Class,
                mutators = new MutatorsListConstructor(C);
            C.__mutators = mutators;
            mutators.create();
        },

        /**
         * Перенести поля второстепенных предков в прототип
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
         */
        'fillClass': function () {
            var C = this.Class,
                props = go.Lang.copy(this.props);
            C.go$type = "go.class";
            C.__Fake  = function () {};
            C.__Fake.prototype = C.prototype;
            go.Lang.extend(C, this.classMethods);
            C.__mutators.processClass(props);
            go.Lang.extend(C.prototype, props);
            this.loadProperties();
        },

        /**
         * Загрузка некоторых переменных
         * @todo в мутаторы
         */
        'loadProperties': function () {
            var props = this.props,
                C = this.Class,
                proto = C.prototype;

            C.__abstract = props.__abstract ? true : false;
            if (props.hasOwnProperty("__abstract") !== "undefined") {
                delete proto.__abstract;
            }

            C.__final = props.__final ? true : false;
            if (props.hasOwnProperty("__final") !== "undefined") {
                delete proto.__final;
            }

            C.__classname = props.__classname || "go.class";
            if (props.hasOwnProperty("__classname") !== "undefined") {
                delete proto.__classname;
            }

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
             * @param go.object instance
             * @params mixed аргументы конструктора
             */
            '__construct': function (instance) {
                var cr = this.prototype.__construct;
                cr.call.apply(cr, arguments);
            },

            /**
             * Вызов деструктора данного класса для объекта
             *
             * @param go.object instance
             */
            '__destruct': function (instance) {
                this.prototype.__destruct.apply(instance);
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
            },

            /**
             * Заполнение экземпляра объекта нужными свойствами
             * На этапе конструирования до вызова __construct()
             *
             * @param go.object instance
             */
            '__fillInstance': function (instance) {
                this.__mutators.processInstance(instance);
            },

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
     * @var go.class Class
     *      объект целевого класса
     * @var Mutator{} mutators
     *      набор мутаторов (имя => объект мутатора)
     */
    MutatorsListPrototype = {

        /**
         * Конструктор
         *
         * @param go.class C
         */
        '__construct': function (C) {
            this.Class = C;
        },

        /**
         * Создание списка мутаторов для данного класса
         */
        'create': function () {
            this.mutators = {};
            this.createDirectLine();
            this.mergeColBranch();
        },

        /**
         * Формирование данных на этапе формирования класса
         *
         * @param hash props
         */
        'processClass': function (props) {
            var mutators = this.mutators,
                k;
            delete props.__mutators;
            for (k in mutators) {
                if (mutators.hasOwnProperty(k)) {
                    mutators[k].processClass(props);
                }
            }
            return props;
        },

        /**
         * Обработка создаваемого экземпляра класса
         *
         * @param go.object instance
         */
        'processInstance': function (instance) {
            var mutators = this.mutators,
                k;
            for (k in mutators) {
                if (mutators.hasOwnProperty(k)) {
                    mutators[k].processInstance(instance);
                }
            }
        },

        /**
         * Создание мутаторов из прямой ветки (без множественного наследования)
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
                            mutators[k] = this.extendMutator(k, mutator, mprops[k]);
                        } else {
                            mutators[k] = null;
                        }
                    } else {
                        mutators[k] = this.copyMutator(k, mutator);
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
         */
        'mergeColBranch': function () {
            var oparents = this.Class.__otherParents,
                oparent,
                mutators = this.mutators,
                pmutators,
                i,
                len,
                k;
            for (i = 0, len = oparents.length; i < len; i += 1) {
                oparent = oparents[i];
                if (typeof oparent === "function") {
                    pmutators = oparent.__mutators && oparent.__mutators.mutators;
                    if (pmutators) {
                        for (k in pmutators) {
                            if (pmutators.hasOwnProperty(k)) {
                                if (!mutators.hasOwnProperty(k)) {
                                    mutators[k] = this.copyMutator(k, pmutators[k]);
                                }
                            }
                        }
                    }
                }
            }
            if (len) {
                console.log(this.mutators);
            }
        },

        /**
         * Создать новый мутатор
         *
         * @param string name
         * @param hash props
         * @param object bproto [optional]
         * @return Mutator
         */
        'createNewMutator': function (name, props, bproto) {
            var Fake, proto, Constr;
            Fake = function () {};
            Fake.prototype = bproto || this.Mutator.prototype;
            proto = new Fake();
            go.Lang.extend(proto, props);
            Constr = function (name, C) {
                this.__construct(name, C);
            };
            Constr.prototype = proto;
            proto.constructor = Constr;
            return new Constr(name, this.Class);
        },

        /**
         * Раширить предковый мутатор
         *
         * @param string name
         * @param Mutator mparent
         * @param hash props
         * @return Mutator
         */
        'extendMutator': function (name, mparent, props) {
            return this.createNewMutator(name, props, mparent.constructor.prototype);
        },

        /**
         * Скопировать предковый мутатор
         *
         * @param string name
         * @param Mutator mparent
         * @return Mutator
         */
        'copyMutator': function (name, mparent) {
            return new mparent.constructor(name, this.Class);
        },

        /**
         * Базовый "класс" мутаторов
         *
         * @var string name
         *      название мутатора
         * @var go.class Class
         *      класс, к которому привязан
         * @var hash fields
         *      сохраняемые поля
         */
        'Mutator': (function () {

            var Construct = function (name, C) {
                this.__construct(name, C);
            };
            Construct.prototype = {

                /**
                 * Конструктор мутатора
                 *
                 * @param string name
                 * @param go.class C
                 */
                '__construct': function (name, C) {
                    this.name   = name;
                    this.Class  = C;
                    this.fields = {};
                    this.loadFromParents();
                },

                /**
                 * Обработка полей на этапе создания класса
                 *
                 * @param hash props
                 */
                'processClass': function (props) {
                    var fields = this.fields, k, prop, mut;
                    for (k in props) {
                        if (props.hasOwnProperty(k)) {
                            prop = props[k];
                            if ((typeof prop === "function") || (!this.onlyMethods)) {
                                mut = this.eachForClass(k, prop);
                                if (mut) {
                                    fields[k] = mut;
                                    delete props[k];
                                }
                            }
                        }
                    }
                },

                /**
                 * Заполнение экземпляра класса
                 *
                 * @param go.object instance
                 */
                'processInstance': function (instance) {
                    var fields = this.fields, k;
                    for (k in fields) {
                        if (fields.hasOwnProperty(k)) {
                            this.eachForInstance(instance, k, fields[k]);
                        }
                    }
                },

                /**
                 * Подгрузка полей из предков
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
                 * @param go.class parent
                 */
                'loadFromSingleParent': function (parent) {
                    var mutators;
                    mutators = parent.__mutators;
                    if (!mutators) {
                        return;
                    }
                    mutators = mutators.mutators;
                    if (!mutators.hasOwnProperty(this.name)) {
                        return;
                    }
                    go.Lang.extend(this.fields, mutators[this.name].fields);
                },

                /**
                 * eachForClass должен перебирать только методы
                 */
                'onlyMethods': true,

                /**
                 * Перебор всех элементов на этапе создания класса
                 *
                 * @param string name
                 * @param mixed prop
                 */
                'eachForClass': function (name, prop) {
                    return;
                },

                /**
                 * Перебор сохранённых полей на этапе создания объекта
                 *
                 * @param go.object instance
                 * @param string name
                 * @param mixed prop
                 */
                'eachForInstance': function (instance, name, prop) {
                    instance[name] = prop;
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