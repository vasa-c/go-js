/**
 * go.Ext: helper extensions
 *
 * @package    go.js
 * @subpackage Ext
 * @author     Grigoriev Oleg aka vasa_c <go.vasac@gmail.com>
 * @uses       go.Class
 */

if (!window.go) {
    throw new Error("go.core is not found");
}

/**
 * @namespace go.Ext
 */
go.module("Ext", ["Class"], function (go, global, undefined) {
    "use strict";

    var Ext = {};

    /**
     * @class go.Ext.Options
     *        class with options
     */
    Ext.Options = go.Class(null, {

        /**
         * Options of current class.
         * Override the parent options and overrides an instance options
         *
         * @name go.Ext.Options#options
         * @protected
         * @type {Object}
         */
        'options': {},

        /**
         * @ignore
         */
        '__classname': "go.Ext.Options",

        /**
         * @ignore
         */
        '__mutators': {

            /**
             * Mutator "options" - load parent options
             */
            'options' : {
                'processClass': function (props) {
                    var paropt;
                    if (this.parent) {
                        paropt = this.parent.__mutators.mutators.options.options;
                    }
                    if (props.options) {
                        if (paropt) {
                            this.options = go.Lang.copy(paropt);
                            go.Lang.merge(this.options, props.options);
                        } else {
                            this.options = props.options;
                        }
                    } else {
                        if (this.parent) {
                            this.options = paropt;
                        } else {
                            this.options = {};
                        }
                    }
                    props.options = this.options;
                },
                'loadFromParents': function () {
                    return;
                }
            }

        },

        /**
         * @constructs
         * @public
         * @param {Object} [options]
         *        unique options of instnace
         */
        '__construct': function (options) {
            this.initOptions(options);
        },

        /**
         * Saving instance options
         *
         * @name go.Ext.Options#initOptions
         * @protected
         * @param {Object} options
         *        options of instance
         */
        'initOptions': function (options) {
            if (options) {
                this.options = go.Lang.copy(this.__self.prototype.options);
                go.Lang.merge(this.options, options);
                this.__OptionsLazy = false;
            } else {
                this.__OptionsLazy = true;
            }
        },

        /**
         * Get options
         *
         * @name go.Ext.Options#getOptions
         * @public
         * @return {Object}
         */
        'getOptions': function () {
            return this.options;
        },

        /**
         * Get the specified option
         *
         * @name go.Ext.Options#getOption
         * @public
         * @param {String} opt
         *        option name as path ("one.two.three")
         * @return {*}
         *         option value
         * @throws go.Ext.Exception.NotFound
         *         invalid path
         */
        'getOption': function (opt) {
            var path = opt.split("."),
                value = this.options,
                i,
                len;
            for (i = 0, len = path.length; i < len; i += 1) {
                if ((!value) || (typeof value !== "object")) {
                    throw new Ext.Options.Exceptions.NotFound("getOption(" + opt + ")");
                }
                value = value[path[i]];
            }
            return value;
        },

        /**
         * Set new option value
         *
         * @name go.Ext.Options#setOption
         * @public
         * @param {String} opt
         *        option name as path ("one.two.three")
         * @param {mixed} value
         *        new value
         * @throws go.Ext.Exception.NotFound
         *         invalid path
         */
        'setOption': function (opt, value) {
            var path = opt.split("."),
                dict,
                i,
                len;
            if (this.__OptionsLazy) {
                this.options = go.Lang.copy(this.options);
                this.__OptionsLazy = false;
            }
            dict = this.options;
            for (i = 0, len = path.length; i < len; i += 1) {
                if ((!dict) || (typeof dict !== "object")) {
                    throw new Ext.Options.Exceptions.NotFound("setOption(" + opt + ")");
                }
                if (i === len - 1) {
                    dict[path[i]] = value;
                } else {
                    dict = dict[path[i]];
                }
            }
        },

        'eoc': null
    });

    /**
     * @namespace go.Ext.Options.Exceptions
     */
    Ext.Options.Exceptions = {
        /**
         * Error - invalid option path
         *
         * @name go.Ext.Options.Exceptions.NotFound
         * @type {Error}
         */
        'NotFound' : go.Lang.Exception.create("go.Ext.Options.Exceptions.NotFound", go.Lang.Exception)
    };

    /**
     * @class go.Ext.Nodes
     *        class, working with DOM-elements
     * @abstract
     * @uses jQuery
     */
    Ext.Nodes = go.Class(null, {

        /**
         * Basic node of instance (container)
         *
         * @name go.Ext.Nodes#node
         * @protected
         * @type {jQuery}
         */
        'node': null,

        /**
         * List of node pointers (in class declaration) or list of nodes (in instance)
         *
         * @name go.Ext.Nodes#nodes
         * @protected
         * @type {Object.<String, jQuery>}
         */
        'nodes': {},

        /**
         * List of event listeners
         *
         * @name go.Ext.Nodes#nodesListeners
         * @protected
         * @type {Array.<[jQuery node, String eventType, Function handler]>}
         */
        'nodesListeners': null,

        /**
         * @ignore
         */
        '__abstract': true,

        /**
         * Abstraction for DOM access
         *
         * @name go.Ext.Nodes#DOMLayer
         * @protected
         * @type {Object}
         */
        'DOMLayer': {
            /**
             * @name go.Ext.Nodes#DOMLayer.find
             * @param {*} selector
             * @param {*} [context]
             * @return {Object}
             */
            'find': function (selector, context) {
                return context ? jQuery(selector, context) : jQuery(selector);
            },

            /**
             * @name go.Ext.Nodes#DOMLayer.bind
             * @param {Object} node
             * @param {String} eventType
             * @param {Function} handler
             */
            'bind': function (node, eventType, handler) {
                node.bind(eventType, handler);
            },

            /**
             * @name go.Ext.Nodes#DOMLayer.unbind
             * @param {Object} node
             * @param {String} eventType
             * @param {Function} handler
             */
            'unbind': function (node, eventType, handler) {
                node.unbind(eventType, handler);
            }
        },

        /**
         * @ignore
         */
        '__mutators': {
            /**
             * Mutator "nodes" - load parent nodes
             */
            'nodes' : {
                'processClass': function (props) {
                    var parnodes;
                    if (this.parent) {
                        parnodes = this.parent.__mutators.mutators.nodes.nodes;
                    }
                    if (props.nodes) {
                        if (parnodes) {
                            this.nodes = go.Lang.copy(parnodes);
                            go.Lang.merge(this.nodes, props.nodes);
                        } else {
                            this.nodes = props.nodes;
                        }
                    } else {
                        if (this.parent) {
                            this.nodes = parnodes;
                        } else {
                            this.nodes = {};
                        }
                    }
                    props.nodes = this.nodes;
                },
                'loadFromParents': function () {
                    return;
                }
            }
        },

        /**
         * @constructs
         * @param {jQuery} [node]
         *        pointer to basic node
         */
        '__construct': function (node) {
            this.initNodes(node);
        },

        /**
         * @destructs
         * @ignore
         * @return void
         */
        '__destruct': function () {
            this.doneNodes();
        },

        /**
         * Initialization nodes
         *
         * @name go.Ext.Nodes#initNodes
         * @protected
         * @param {jQuery} node
         *        pointer to basic node
         * @todo test better
         */
        'initNodes': function (node) {
            /* jshint maxstatements: 25, maxcomplexity: 15 */
            var nodes = {},
                nnode,
                lnodes = this.nodes,
                lnode,
                k,
                _this = this,
                DOM = this.DOMLayer;
            function create(lnode) {
                var nnode,
                    parent,
                    events,
                    k,
                    handler;
                if (!lnode) {
                    return null;
                }
                if ((typeof lnode === "object") && (lnode.length !== undefined)) {
                    return lnode;
                }
                if (typeof lnode === "function") {
                    lnode = {
                        'creator': lnode
                    };
                } else if (typeof lnode === "string") {
                    lnode = {
                        'selector': lnode
                    };
                }
                if (lnode.selector) {
                    parent = lnode.global ? DOM.find(global) : node;
                    nnode = DOM.find(lnode.selector, parent);
                } else if (lnode.creator) {
                    nnode = lnode.creator.call(_this, node, lnode);
                    nnode = create(nnode);
                }
                events = lnode.events;
                if (events) {
                    for (k in events) {
                        if (events.hasOwnProperty(k)) {
                            if (typeof events[k] === "function") {
                                handler = events[k];
                            } else {
                                handler = _this[events[k]];
                            }
                            _this.bind(nnode, k, handler);
                        }
                    }
                }
                return nnode;
            } // create()
            node = node ? DOM.find(node) : DOM.find(global.document);
            this.node = node;
            this.nodesListeners = [];
            for (k in lnodes) {
                if (lnodes.hasOwnProperty(k)) {
                    lnode = lnodes[k];
                    nnode = create(lnode);
                    if (nnode) {
                        nodes[k] = nnode;
                    }
                }
            }
            this.nodes = nodes;
        },

        /**
         * Cleaning data structures
         *
         * @name go.Ext.Nodes#doneNodes
         * @protected
         * @return void
         */
        'doneNodes': function () {
            this.unbindAll();
        },

        /**
         * Set the event handler
         *
         * @name go.Ext.Nodes#bind
         * @protected
         * @param {jQuery} node
         *        pointer to node
         * @param {String} eventType
         *        event type
         * @param {(String|Function)} handler
         *        handler - a function or a method name of the current object
         */
        'bind': function (node, eventType, handler) {
            if (typeof handler !== "function") {
                handler = this[handler];
            }
            this.DOMLayer.bind(this.DOMLayer.find(node), eventType, handler);
            this.nodesListeners.push([node, eventType, handler]);
        },

        /**
         * Remove the event handler
         *
         * @name go.Ext.Nodes#unbind
         * @protected
         * @param {jQuery} node
         *        pointer to node
         * @param {String} eventType
         *        event type
         * @param {(String|Function)} handler
         *        handler - a function or a method name of the current object
         */
        'unbind': function (node, eventType, handler) {
            if (typeof handler !== "function") {
                handler = this[handler];
            }
            this.DOMLayer.unbind(this.DOMLayer.find(node), eventType, handler);
        },

        /**
         * Remove all handlers (previously installed bind())
         *
         * @name go.Ext.Nodes#unbindAll
         * @protected
         * @return void
         */
        'unbindAll': function () {
            var listeners = this.nodesListeners,
                listener;
            while (listeners.length > 0) {
                listener = listeners.pop();
                this.unbind.apply(this, listener);
            }
        },

        'eoc': null
    });

    /**
     * @class go.Ext.Events
     *        class that generates events (can subscribe to them)
     */
    Ext.Events = go.Class({
        /**
         * List of listeners
         *
         * @name go.Ext.Events#eventListeners
         * @protected
         * @type {Object.<string, go.Lang.Listeners.Listener>}
         *       event name => handlers list
         */
        'eventListeners': null,

        /**
         * Add event listener
         *
         * @name go.Ext.Events#addEventListener
         * @public
         * @param {String} [eventType]
         *        event type (basic event by default)
         * @param {Function} listener
         *        event handler
         * @return {Number}
         *         listener ID
         */
        'addEventListener': function (eventType, listener) {
            var elisteners;
            if (!listener) {
                listener  = eventType;
                eventType = "";
            }
            if (!this.eventListeners) {
                this.eventListeners = {};
            }
            elisteners = this.eventListeners;
            if (!elisteners[eventType]) {
                elisteners[eventType] = go.Lang.Listeners.create();
            }
            return elisteners[eventType].append(listener);
        },

        /**
         * Remove event listener
         *
         * @name go.Ext.Events#removeEventsListener
         * @public
         * @param {String} [eventType]
         *        event type (basic event by default)
         * @param {(Function|Number)} listener
         *        listener or ID
         * @return {Boolean}
         *         TRUE - handler was found and removed
         */
        'removeEventListener': function (eventType, listener) {
            var elisteners = this.eventListeners;
            if (!elisteners) {
                return false;
            }
            elisteners = elisteners[eventType];
            if (!elisteners) {
                return false;
            }
            return elisteners.remove(listener);
        },

        /**
         * Remove all handlers of single event
         *
         * @name go.Ext.Events#removeEventsAllListeners
         * @public
         * @param {String} [eventType]
         *        event type
         */
        'removeEventAllListeners': function (eventType) {
            this.eventListeners[eventType] = null;
        },

        /**
         * Remove all handlers of all events
         *
         * @name go.Ext.Events#resetEventListeners
         * @public
         * @return void
         */
        'resetEventListeners': function () {
            this.eventListeners = {};
        },

        /**
         * Fire event
         *
         * @name go.Ext.Events#fireEvent
         * @public
         * @param {(String|Object)} event
         *        event object or type
         * @param {*} [eventData]
         *        event data (if event - string)
         */
        'fireEvent': function (event, eventData) {
            var listener;
            if ((!event) || (typeof event !== "object")) {
                event = new Ext.Events.Event(event, eventData);
            }
            listener = this.eventListeners && this.eventListeners[event.type];
            if (!listener) {
                return;
            }
            listener(event);
        },

        /**
         * @destructs
         * @ignore
         */
        '__destruct': function () {
            this.resetEventListeners();
        },

        'eoc': null
    });

    /**
     * @class go.Ext.Events.Event
     *        constructor of event objects (for go.Ect.Events)
     *
     * @property {String} type
     * @property {*} data
     */
    Ext.Events.Event = (function () {
        var EventPrototype = {
            /**
             * @lends go.Ext.Events.Event.prototype
             */

            /**
             * @constructs
             * @param {String} eventType
             * @param {*} eventData
             */
            '__construct': function (eventType, eventData) {
                this.type = eventType;
                this.data = eventData;
            },

            /**
             * String representation of event instance
             * @name go.Ext.Events.Event#toString
             * @override
             * @return {String}
             */
            'toString': function () {
                return "[Event " + this.type + "]";
            }
        };

        /**
         * @param eventType
         * @param eventData
         */
        function EventConstructor(eventType, eventData) {
            this.__construct(eventType, eventData);
        }
        EventConstructor.prototype = EventPrototype;

        return EventConstructor;
    }());

    return Ext;
});
