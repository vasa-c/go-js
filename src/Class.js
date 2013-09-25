/**
 * go.Class: class syntax for JavaScript OOP
 *
 * @package    go.js
 * @subpackage Class
 * @author     Grigoriev Oleg aka vasa_c <go.vasac@gmail.com>
 */

if (!window.go) {
    throw new Error("go.core is not found");
}

go.module("Class", null, function (go, global) {
    "use strict";

    var Class,
        RootPrototype,
        ClassCreator,
        MutatorsList;

    /**
     * Prototype of root class
     * Methods and properties available in all classes and instances
     *
     * @type {Object}
     */
    RootPrototype = {

        /**
         * @lends go.Class.Root.prototype
         */

        /**
         * "Extended" type of class instances
         * @see go.Lang.getType
         * @name go.Class.Root#go$type
         * @protected
         * @type {String}
         */
        'go$type': "go.object",

        /**
         * Class name for string representation
         *
         * @name go.Class.Root#__classname
         * @protected
         * @type {String}
         */
        '__classname': "go.Class.Root",

        /**
         * Flag of abstract class
         *
         * @name go.Class.Root#__abstract
         * @protected
         * @type {Boolean}
         */
        '__abstract': true,

        /**
         * Flag of final class
         *
         * @name go.Class.Root#__final
         * @protected
         * @type {Boolean}
         */
        '__final': false,

        /**
         * Basic constructor
         *
         * @constructs
         * @public
         */
        '__construct': function () {},

        /**
         * Basic destructor
         *
         * @destructs
         * @public
         */
        '__destruct': function () {},

        /**
         * Call parent constructor
         *
         * @name go.Class.Root#__parentConstruct
         * @protected
         * @param {Function} Parent
         *        parent class
         * @param {... *} [args]
         *        arguments of call
         */
        '__parentConstruct': function (Parent) {
            var args = Array.prototype.slice.call(arguments);
            args[0] = this;
            Parent.__construct.apply(Parent, args);
        },

        /**
         * Call parent destructor
         *
         * @name go.Class.Root#__parentDestructor
         * @protected
         * @param {Function} Parent
         *        parent class
         */
        '__parentDestruct': function (Parent) {
            Parent.__destruct(this);
        },

        /**
         * Call method from parent class
         *
         * @name go.Class.Root#__parentMethod
         * @protected
         * @param {Function} Parent
         *        parent class
         * @param {String} name
         *        method name
         * @param {... *} [args]
         *        method arguments
         * @return {*}
         *         results of calling
         */
        '__parentMethod': function (Parent) {
            var args = Array.prototype.slice.call(arguments);
            args[0] = this;
            return Parent.__method.apply(Parent, args);
        },

        /**
         * Forced destruction of instance
         *
         * @name go.Class.Root#destroy
         * @public
         * @return void
         */
        'destroy': function () {
            var k;
            if (this.__destroyed) {
                return;
            }
            this.__destruct();
            for (k in this) {
                if (this.hasOwnProperty(k)) {
                    this[k] = undefined;
                }
            }
            this.__destroyed = true;
        },

        /**
         * Check whether a current object is an instance of specified class
         *
         * @name go.Class.Root#instance_of
         * @public
         * @param {Function} C
         *
         * @return {Boolean}
         */
        'instance_of': function (C) {
            if ((typeof C === "function") && (this instanceof C)) {
                return true;
            }
            return this.__self.isSubclassOf(C);
        },

        /**
         * String representation
         *
         * @name go.Class.Root#toString
         * @public
         * @return {String}
         */
        'toString': function () {
            var classname = this.__self ? this.__self.__classname : "undefined";
            return "instance of [" + classname + "]";
        },

        /**
         * Predefined mutators
         *
         * @ignore
         * @type {Object}
         */
        '__mutators': {

            /**
             * Mutator "sysvars" - move system variables in class
             */
            'sysvars': {
                /**
                 * Variables for moving
                 * name => default value
                 *
                 * @type {Object}
                 */
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
             * Mutator "static" - move static properties from object to class
             */
            'static': {
                'processClass': function (props) {
                    var C  = this.Class,
                        st = props.__static,
                        fields,
                        k;
                    fields = this.fields;
                    if (st) {
                        go.Lang.extend(fields, st);
                        delete props.__static;
                    }
                    for (k in fields) {
                        if (fields.hasOwnProperty(k)) {
                            C[k] = fields[k];
                        }
                    }
                }
            },

            /**
             * Mutator "bind" - association methods with the object
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
                        original,
                        binded,
                        k;
                    for (k in fields) {
                        if (fields.hasOwnProperty(k)) {
                            original = fields[k];
                            binded   = bind(original, instance);
                            binded.__original = original;
                            instance[k] = binded;
                        }
                    }
                },
                'getMethod': function (name, instance) {
                    if (this.fields.hasOwnProperty(name)) {
                        return go.Lang.bind(this.fields[name], instance);
                    }
                    return undefined;
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
                                if (typeof props[k] === "function") {
                                    if (reg.test(k)) {
                                        names.push(k);
                                    }
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
     * @class "class" of objects, which create go-classes
     */
    ClassCreator = function (parents, props) {
        this.__construct(parents, props);
    };
    ClassCreator.prototype = {

        'constructor': ClassCreator,

        /**
         * @constructs
         * @public
         * @param {(Function|Array.<Function>)} [parents]
         *        parent class or list of parents
         * @param {Object} props
         *        list of properties and methods of class
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
         * @destructs
         * @public
         */
        '__destruct': function () {
        },

        /**
         * Class create
         *
         * @public
         * @return void
         * @throws go.Class.Exceptions.Final
         *         попытка расширить финальный класс
         */
        'create': function () {
            this.createClass();
            this.separateParents();
            if (!this.checkParentsNoFinal()) {
                throw new Class.Exceptions.Final();
            }
            this.createPrototype();
            this.createMutators();
            this.applyOtherParents();
            this.fillClass();
        },

        /**
         * Get created class
         *
         * @public
         * @return {Function}
         */
        'getClass': function () {
            return this.Class;
        },

        /**
         * Create function-constructor
         *
         * @private
         * @return void
         * @throws go.Class.Exceptions.Abstract
         */
        'createClass': function () {
            var C = function () {
                if (C.__abstract) {
                    throw new Class.Exceptions.Abstract();
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
         * Separation of parents of major and minor
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
         * Check that there is no parent among the final class
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
         * Create prototype for constructor
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
         * Create list of mutators
         *
         * @private
         * @return void
         */
        'createMutators': function () {
            var C = this.Class,
                mutators = new MutatorsList(C);
            C.__mutators = mutators;
            mutators.create();
        },

        /**
         * Move properties of minor parents to prototype
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
                k;
            for (i = 0, len = oparents.length; i < len; i += 1) {
                parent = oparents[i];
                if (typeof parent === "function") {
                    parent = parent.prototype;
                }
                if (parent) {
                    /* jshint forin: false */
                    for (k in parent) {
                        if (proto[k] === undefined) {
                            proto[k] = parent[k];
                        }
                    }
                }
            }
        },

        /**
         * Filling class and prototype required properties
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
            C.toString = this.classMethods.toString; // IE does not copy the toString
            C.__mutators.processClass(props);
            go.Lang.extend(C.prototype, props);
        },

        /**
         * Function-constructor of class
         *
         * @private
         * @type {Function}
         */
        'Class': null,

        /**
         * Class field passed as arguments to go.Class()
         *
         * @private
         * @type {Object}
         */
        'props': null,

        /**
         * Parent of class passed as arguments to go.Class()
         *
         * @private
         * @type {Array|*}
         */
        'cparents': null,

        /**
         * Basic static methods of class
         *
         * @private
         * @type {Object}
         */
        'classMethods': {

            /**
             * @lends go.Class.Root
             */

            /**
             * Check whether a current class is a subclass of the specified class
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
             * Call constructor of current class for specified object
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
             * Call destructor of current class for specified object
             *
             * @name go.Class.Root.__destruct
             * @public
             * @param {Object} instance
             */
            '__destruct': function (instance) {
                this.__method.call(this, instance, "__destruct");
            },

            /**
             * Call method of current class for specified object
             *
             * @name go.Class.Root.__method
             * @public
             * @param {Object} instance
             * @param {String} name
             * @param {... *} args
             * @return {*}
             * @throws go.Class.Exceptions.Method
             *         specified method is not found
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
             * Filling instance of necessary properties
             * Occurs during the design stage, before to call __construct()
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

    /**
     * @class mutators list for specific class
     */
    MutatorsList = function (C) {
        MutatorsList.prototype.__construct(C);
    };
    MutatorsList.prototype = {

        'constructor': MutatorsList,

        /**
         * Target class
         *
         * @private
         * @type {Function}
         */
        'Class': null,

        /**
         * Mutators list (name => mutator object)
         *
         * @private
         * @type {Object.<String, Mutator>}
         */
        'mutators': null,

        /**
         * @constructs
         * @public
         * @param {Function} C
         *        target class
         */
        '__construct': function (C) {
            this.Class = C;
        },

        /**
         * Create list mutators for this class
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
         * Follow the steps for creating a class
         *
         * @public
         * @param {Object} props
         *        original class fields
         * @return {Object}
         *         final class fields
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
         * Follow the steps for creating an instance
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
         * Get method that has been stored in mutator
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
         * Create mutators from direct line (without multiple inheritance)
         *
         * @private
         * @return void
         */
        'createDirectLine': function () {
            /* jshint maxcomplexity: 15 */
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
         * Merging with mutators from minor parents
         *
         * @private
         * @return void
         */
        'mergeColBranch': function () {
            /* jshint maxdepth: 10 */
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
         * Create new mutator class
         *
         * @private
         * @param {String} name
         *        mutator name
         * @param {Object} props
         *        mutator fields
         * @param {Object} [bproto]
         *        parent prototype (basic Mutator by default)
         * @param {Function} [parent]
         *        parent class
         * @return {Mutator}
         *         constructor of new mutator
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
         * Extend parent mutator
         *
         * @param {String} name
         *        mutator name
         * @param {Mutator} mparent
         *        parent mutator (extended)
         * @param {Object} props
         *        new mutator fields
         * @param {Function} [parent]
         *        parent class
         * @return {Mutator}
         *         constructor of new mutator
         */
        'extendMutator': function (name, mparent, props, parent) {
            return this.createNewMutator(name, props, mparent.constructor.prototype, parent);
        },

        /**
         * Copy parent mutator
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
         * @class basic "class" of mutators
         */
        'Mutator': (function () {

            var Mutator = function (name, C, parent) {
                this.__construct(name, C, parent);
            };
            Mutator.prototype = {

                /**
                 * Mutator name
                 *
                 * @protected
                 * @type {String}
                 */
                'name': null,

                /**
                 * Owner class
                 *
                 * @protected
                 * @type {Function}
                 */
                'Class': null,

                /**
                 * Parent class of mutator
                 *
                 * @protected
                 * @type {Function}
                 */
                'parent': null,

                /**
                 * Stored fields
                 *
                 * @protected
                 * @type {Object}
                 */
                'fields': null,

                /**
                 * @constructs
                 * @public
                 * @param {String} name
                 *        mutator name
                 * @param {Function} C
                 *        owner class
                 * @param {Function} [parent]
                 *        parent class of mutator
                 */
                '__construct': function (name, C, parent) {
                    this.name   = name;
                    this.Class  = C;
                    this.fields = {};
                    this.parent = parent;
                    this.loadFromParents();
                },

                /**
                 * Processing class
                 *
                 * @public
                 * @param {Object} props
                 */
                'processClass': function (props) {
                    return props;
                },

                /**
                 * Processing instance
                 *
                 * @public
                 * @param {Object} instance
                 */
                'processInstance': function (instance) {
                    return instance;
                },

                /**
                 * Get method, if it is stored in the mutator
                 *
                 * @public
                 * @params {String} name
                 * @params {go.object} instance
                 */
                'getMethod': function () {
                    // for override
                },

                /**
                 * Uploading fields of parents
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
                    for (i = oparents.length - 1; i >= 0; i -= 1) {
                        oparent = oparents[i];
                        if ((typeof oparent === "function") && oparent.go$type) {
                            this.loadFromSingleParent(oparent);
                        }
                    }
                    if (parent) {
                        this.loadFromSingleParent(parent);
                    }
                },

                /**
                 * Uploading fields of single parents
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
                    if (mutators.hasOwnProperty(this.name)) {
                        go.Lang.extend(this.fields, mutators[this.name].fields);
                    }
                },

                'eoc': null
            };
            Mutator.prototype.constructor = Mutator;

            return Mutator;
        }()),

        'eoc': null
    };

    /**
     * Function for create new class
     *
     * @name go.Class
     * @function
     * @public
     * @param {(Function|Array.<Function>)} [parents]
     *        parent class or list of parents
     * @param {Object} props
     *        method and properties list
     * @return {Function}
     *         constructor for instances
     * @throws go.Class.Exceptions.Final
     *         attempt to extend the final class
     */
    Class = function Class(parents, props) {
        var creator, C;
        creator = new ClassCreator(parents, props);
        creator.create();
        C = creator.getClass();
        creator.__destruct();
        return C;
    };

    /**
     * @class go.Class.Root
     *        basic class
     */
    Class.Root = Class.apply(global, [null, RootPrototype]);
    Class.Root.prototype.toString = RootPrototype.toString; // IE !!!

    /**
     * @namespace go.Class.Exceptions
     *            library exceptions
     */
    Class.Exceptions = new go.Lang.Exception.Block({

        /**
         * @class go.Class.Exceptions.Base
         *        basic exception of go.Class
         * @augments go.Lang.Exception.Base
         * @abstract
         */

        /**
         * @class go.Class.Exceptions.Abstract
         *        attempt to instantiate abstract class
         * @augments go.Class.Exceptions.Base
         */
        'Abstract': [true, "Cannot instantiate abstract class"],

        /**
         * @class go.Class.Exceptions.Final
         *        attempt to extend the final class
         * @augments go.Class.Exceptions.Base
         */
        'Final': [true, "Cannot extend final class"],

        /**
         * @class go.Class.Exceptions.Method
         *        attempt to call not existing method
         * @augments go.Class.Exceptions.Base
         */
        'Method': [true, "Method is not found"]

    }, "go.Class.Exceptions");

    return Class;
});