<?php
/**
 * Автозагрузчик классов библиотеки
 *
 * @package go\gojs
 * @author  Григорьев Олег aka vasa_c <go.vasac@gmail.com>
 */

namespace go\gojs;

class Autoloader
{
    /**
     * Получить экземпляр автозагрузчика для gojs
     *
     * @return \go\gojs\Autoloader
     */
    public static function getInstanceForGoJS()
    {
        if (!self::$instance) {
            self::$instance = new self(__NAMESPACE__, __DIR__);
        }
        return self::$instance;
    }

    /**
     * Зарегистрировать автозагрузчик для gojs
     */
    public static function register()
    {
        self::getInstanceForGoJS()->registerAsAutoloader();
    }

    /**
     * Удалить автозагрузчик gojs из системы
     */
    public static function unregister()
    {
        self::getInstanceForGoJS()->unregisterAsAutoloader();
    }

    /**
     * Конструктор
     *
     * @param string $namespace
     *         пространство имён библиотеки
     * @param string $dir
     *         корневой каталог библиотеки
     */
    public function __construct($namespace, $dir)
    {
        $this->prefix = $namespace ? $namespace.'\\' : '';
        $this->prefixlen = \strlen($this->prefix);
        $this->dir = $dir.\DIRECTORY_SEPARATOR;
    }

    /**
     * Зарегистрировать автозагрузчик
     */
    public function registerAsAutoloader()
    {
        if (!$this->registered) {
            \spl_autoload_register($this->getCallbackForAutoload());
            $this->registered = true;
        }
    }

    /**
     * Удалить автозагрузчик из системы
     */
    public function unregisterAsAutoloader()
    {
        if ($this->registered) {
            \spl_autoload_unregister($this->getCallbackForAutoload());
            $this->registered = false;
        }
    }


    /**
     * Загрузить класс по полному имени
     *
     * @param string $classname
     *         полное имя класса
     * @return bool
     *          был ли класс найден
     */
    public function loadClassByFullName($classname)
    {
        $shortname = $this->getShortNameByFull($classname);
        if (!$shortname) {
            return false;
        }
        return $this->loadClassByShortName($shortname);
    }

    /**
     * Загрузить класс по краткому имени (без базового пространства имён)
     *
     * @param string $shortname
     *         краткое имя
     * @return bool
     *          был ли класс найден
     */
    public function loadClassByShortName($shortname)
    {
        $filename = $this->getFilenameByShortName($shortname, true);
        if (!$filename) {
            return false;
        }
        require_once($filename);
        return true;
    }

    /**
     * Получить краткое имя по полному
     *
     * @param string $classname
     *         полное имя
     * @return string
     *          краткое имя или null в случае, если класс не из нужного NS
     */
    public function getShortNameByFull($classname)
    {
        if (\strpos($classname, $this->prefix) !== 0) {
            return null;
        }
        return \substr($classname, $this->prefixlen);
    }

    /**
     * Получить имя файла с описанием класса по его краткому имени
     *
     * @param string $shortname
     *         краткое имя класса
     * @param bool $check [optional]
     *         проверять ли файл на существование
     * @return string
     *          имя файла или null, если он не найден
     */
    public function getFilenameByShortName($shortname, $check = true)
    {
        $filename = \str_replace('\\', \DIRECTORY_SEPARATOR, $shortname).'.php';
        $filename = $this->dir.$filename;
        if ($check && (!\is_file($filename))) {
            return null;
        }
        return $filename;
    }

    /**
     * Получить функцию автолоада
     *
     * @return callback
     */
    public function getCallbackForAutoload()
    {
        return array($this, 'loadClassByFullName');
    }

    /**
     * Экземпляр автозагрузчика для gojs
     *
     * @var \go\gojs\Autoloader
     */
    private static $instance;

    /**
     * Префикс имён классов в данном NS
     *
     * @var string
     */
    private $prefix;

    /**
     * Длина префикса
     *
     * @var int
     */
    private $prefixlen;

    /**
     * Корневой каталог библиотеки
     *
     * @var string
     */
    private $dir;

    /**
     * Был ли зарегистрирован автозагрузчик
     *
     * @var bool
     */
    private $registered = false;
}
