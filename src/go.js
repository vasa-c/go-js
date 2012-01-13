/**
 * go.js: библиотека для упрощения некоторых вещей в JavaScript
 *
 * В данном файле определяется только ядро библиотеки и модуль go.Lang.
 * Остальные модули располагаются в других файлах.
 *
 * @package go.js
 * @author  Григорьев Олег aka vasa_c (http://blgo.ru/)
 * @version 1.0-beta
 * @license MIT (http://www.opensource.org/licenses/mit-license.php)
 * @link    https://github.com/vasa-c/go-js
 */
/*jslint node: true, nomen: true */
/*global window */
"use strict";

var go = (function (global) {

	var VERSION = "1.0-beta",

		/**
		 * http-адрес каталога в котором находится go.js и модули
		 *
		 * @var string
		 */
		GO_DIR,

		/**
		 * Список модулей, для которых уже инициирована загрузка
		 *
		 * @var hash (имя => true)
		 */
		loading = {},

		doc = global.document;

	function go(name, module) {
		if (name) {
			go.appendModule(name, module);
		}
		return go;
	}
	go.VERSION = VERSION;

	/**
	 * go.include(): инициирование загрузки нужных модулей
	 * (только на этапе загрузки страницы)
	 *
	 * @param string[] names
	 *        имя нужного модуля или список из нескольких имён
	 */
	go.include = function (names) {
		var i, len, name, src;
		if (typeof names !== "object") {
			names = [names];
		}
		for (i = 0, len = names.length; i < len; i += 1) {
			name = names[i];
			if (!loading[name]) {
				src = GO_DIR + names[i] + ".js";
				doc.write('<script type="text/javascript" src="' + src + '"></script>');
				loading[name] = true;
			}
		}
	};

	/**
	 * go.appendModule(): добавление модуля в пространство имён
	 * (вызывается при определении модуля в соответствующем файле)
	 *
	 * @param string name
	 *        имя модуля
	 * @param object module
	 *        объект модуля
	 */
	go.appendModule = function (name, module) {
		go[name] = module;
		loading[name] = module;
	};

	/**
	 * Инициализация библиотеки
	 * - вычисление каталога с go.js
	 * - подключение модулей заданных в параметрах URL
	 *
	 * @todo оптимизировать и протестировать для различных вариантов URL
	 */
	(function () {

		var SRC_PATTERN = new RegExp("^(.*\\/)?go\\.js(\\?.*?l=(.*?))?$"),
			matches;

		if (doc.currentScript) {
			matches = SRC_PATTERN.exec(doc.currentScript.getAttribute("src"));
		}
		if (!matches) {
			matches = (function () {
				var scripts = doc.getElementsByTagName("script"),
					i,
					src,
					matches;
				for (i = scripts.length; i > 0; i -= 1) {
					src = scripts[i - 1].getAttribute("src");
					matches = SRC_PATTERN.exec(src);
					if (matches) {
						return matches;
					}
				}
			}());
		}

		if (!matches) {
			throw new Error("go.js is not found in DOM");
		}

		GO_DIR = matches[1];

		if (matches[3]) {
			go.include(matches[3].split(","));
		}

	}());

	return go;
}(window));

/**
 * @subpackage Lang
 * @namespace go.Lang
 */
go("Lang", (function (global) {

	var Lang = {

		/**
		 * Связывание функции с контекстом и аргументами
		 * Поведение аналогично Function.prototype.bind()
		 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
		 *
		 * Если для функции определён свой метод bind(), то используется он
		 *
		 * @namespace go.Lang
		 * @method bind
		 * @param function func
		 *        функция
		 * @param object thisArg [optional]
		 *        контекст в котором функция должна выполняться
		 *        по умолчанию - global
		 * @param list args [optional]
		 *        аргументы, вставляемые в начало вызова функции
		 * @return function
		 *         связанная с контекстом функция
		 * @todo протестировать в IE
		 */
		'bind': function (func, thisArg, args) {
			var result;
			thisArg = thisArg || global;
			if (func.bind) {
	            if (args) {
	                args = [thisArg].concat(args);
	            } else {
	                args = [thisArg];
	            }
	            return func.bind.apply(func, args);
			} else if (args) {
	            result = function () {
	                return func.apply(thisArg, args.concat(Array.prototype.slice.call(arguments, 0)));
	            };
	        } else {
	            result = function () {
	                return func.apply(thisArg, arguments);
	            };
	        }
			return result;
		},

		/**
		 * Получение типа значения
		 *
		 * @param mixed value
		 *        проверяемое значение
		 * @return string
		 *         название типа
		 * @todo протестировать лучше
		 */
		'getType': function (value) {
			var type = typeof value;
			if (type !== "object") {
				return type;
			} else if (value === null) {
				return "null";
			} else if (value.go$type) {
				return value.go$type;
			} else if (value instanceof Array) {
				return "array";
			} else if (value.nodeType === 1) {
				return "element";
			} else if (value.nodeType === 3) {
				return "textnode";
			} else if (typeof value.item === "function") {
				return "collection";
			} else if (typeof value.length !== "undefined") {
				return "arguments";
			}
			return "object";
		},

		/**
		 * Является ли значение массивом
		 *
		 * @param mixed value
		 *        проверяемое значение
		 * @param bool strict [optional]
		 *        точная проверка - именно массивом
		 *        по умолчанию - любая коллекция с порядковым доступом
		 * @return bool
		 *         является ли значение массивом
		 */
		'isArray': function (value, strict) {
			switch (Lang.getType(value)) {
			case "array":
				return true;
			case "collection":
			case "arguments":
				return (!strict);
			default:
				return false;
			}
		},

		/**
		 * Является ли объект простым хэшем
		 * Под хэшем здесь подразумевается любой объект, не имеющий более специфического типа
		 *
		 * @param object value
		 * @return bool
		 */
		'isHash': function (value) {
		    return (value.constructor === Object);
		},

		/**
		 * Итерация объекта
		 *
		 * @param object iter
		 *        итерируемый объект (или порядковый массив)
		 * @param function(value, key, iter) fn
		 *        тело цикла
		 * @param object thisArg [optional]
		 *        контект, в котором следует выполнять тело цикла
		 * @param bool deep [optional]
		 *        обходить ли прототипы
		 * @return mixed
		 *         результаты выполнения функции для всех элементов
		 */
		'each': function (iter, fn, thisArg, deep) {

			var result, i, len;
			thisArg = thisArg || global;

			if (Lang.isArray(iter)) {
				result = [];
				for (i = 0, len = iter.length; i < len; i += 1) {
					result.push(fn.call(thisArg, iter[i], i, iter));
				}
			} else {
				result = {};
				/*jslint forin: true */
				for (i in iter) {
					if (iter.hasOwnProperty(i) || deep) {
						result[i] = fn.call(thisArg, iter[i], i, iter);
					}
				}
				/*jslint forin: false */
			}

			return result;
		},

		/**
		 * Копирование объекта или массива
		 *
		 * @param mixed source
		 * @return mixed
		 */
		'copy': function (source) {
		    var result, i, len;
            if (Lang.isArray(source)) {
                result = [];
                for (i = 0, len = source.length; i < len; i += 1) {
                    result.push(source[i]);
                }
            } else {
                result = {};
                for (i in source) {
                    if (source.hasOwnProperty(i)) {
                        result[i] = source[i];
                    }
                }
            }
            return result;
		},

		/**
		 * Расширение объекта свойствами другого
		 *
		 * @param object destination
		 *        исходный объект (расширяется на месте)
		 * @param object source
		 *        источник новых свойств
		 * @param bool deep [optional]
		 *        обходить прототипы source
		 * @return object
		 *         расширенный destination
		 */
		'extend': function (destination, source, deep) {
			var k;
			/*jslint forin: true */
			for (k in source) {
				if (deep || source.hasOwnProperty(k)) {
					destination[k] = source[k];
				}
			}
			/*jslint forin: false */
			return destination;
		},

		/**
		 * Рекурсивное слияние двух объектов на месте
		 *
		 * @param hash destination
		 *        исходных объект (изменяется)
		 * @param hash source
		 *        источник новых свойств
		 * @return hash
		 *         расширенный destination
		 */
		'merge': function (destination, source) {
		    var k, value;
		    for (k in source) {
		        if (source.hasOwnProperty(k)) {
                    value = source[k];
                    if (Lang.isHash(value) && Lang.isHash(destination[k])) {
                        destination[k] = Lang.merge(destination[k], value);
                    } else {
                        destination[k] = value;
                    }
		        }
		    }
		    return destination;
		},

		/**
		 * Каррирование функции
		 *
		 * @param function fn
		 *        исходная функция
		 * @params mixed args ...
		 *         запоминаемые аргументы
		 * @return function
		 *         каррированная функция
		 */
		'curry': function (fn) {
			var slice = Array.prototype.slice,
				cargs = slice.call(arguments, 1);
			return function () {
				var args = cargs.concat(slice.call(arguments));
				return fn.apply(global, args);
			};
		},

		/**
		 * Присутствует ли значение в массиве
		 * (строгая проверка)
		 *
		 * @param mixed needle
		 *        значение
		 * @param list haystack
		 *        порядковый массив
		 * @return bool
		 *         находится ли значение в массиве
		 */
		'inArray': function (needle, haystack) {
			var i, len;
			for (i = 0, len = haystack.length; i < len; i += 1) {
				if (haystack[i] === needle) {
					return true;
				}
			}
			return false;
		},

		/**
		 * Выполнить первую корректную функцию
		 *
		 * @param list funcs
		 *        список функций
		 * @return mixed
		 *         результат первой корректно завершившейся
		 *         ни одна не сработала - undefined
		 */
		'tryDo': function (funcs) {
			var i, len, result;
			for (i = 0, len = funcs.length; i < len; i += 1) {
				try {
					return funcs[i]();
				} catch (e) {
				}
			}
			return result;
		},

		/**
		 * Вспомагательные функции-заготовки
		 */
		'f': {
			/**
			 * Функция, не делающая ничего
			 */
			'empty': function () {
			},

			/**
			 * Функция, просто возвращающая FALSE
			 */
			'ffalse': function () {
				return false;
			}
		},

		'eoc': null
	};

	return Lang;
}(window)));
