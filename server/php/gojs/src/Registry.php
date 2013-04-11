<?php
/**
 * Реестр каркаса
 *
 * @package go\gojs
 * @author  Григорьев Олег aka vasa_c <go.vasac@gmail.com>
 */

namespace go\gojs;

class Registry implements \ArrayAccess, \Countable
{
    /**
     * Конструктор
     *
     * @param array $registry
     *         исходные значения реестра
     */
    public function __construct(array $registry = null)
    {
        $this->vars = \is_array($registry) ? $registry : array();
    }

    /**
     * Установить реестр целиком
     *
     * @param array $vars
     */
    public function setRegistry(array $vars)
    {
        $this->vars = $vars;
    }

    /**
     * Получить реестр целиком
     *
     * @return array
     */
    public function getRegistry()
    {
        return $this->vars;
    }

    /**
     * Установить переменную
     *
     * @param string $name
     * @param mixed $value
     */
    public function setVar($name, $value)
    {
        $this->vars[$name] = $value;
    }

    /**
     * Получить значение переменной
     *
     * @param string $name
     * @param mixed $default [optional]
     * @return mixed
     */
    public function getVar($name, $default = null)
    {
        if (!\array_key_exists($name, $this->vars)) {
            return $default;
        }
        return $this->vars[$name];
    }

    /**
     * Проверить, существует ли переменная
     *
     * @param string $name
     * @return bool
     */
    public function existsVar($name)
    {
        return isset($this->vars[$name]);
    }

    /**
     * Удалить переменную
     *
     * @param string $name
     */
    public function removeVar($name)
    {
        unset($this->vars[$name]);
    }

    /**
     * Magic setter
     *
     * @param string $key
     * @param mixed $value
     */
    public function __set($key, $value)
    {
        return $this->setVar($key, $value);
    }

    /**
     * Magic getter
     *
     * @param string $key
     * @return mixed
     */
    public function __get($key)
    {
        return $this->getVar($key);
    }

    /**
     * Magic isset
     *
     * @param string $key
     * @return bool
     */
    public function __isset($key)
    {
        return $this->existsVar($key);
    }

    /**
     * Magic unset
     *
     * @param string $key
     */
    public function __unset($key)
    {
        $this->removeVar($key);
    }

    /**
     * @override \ArrayAccess
     *
     * @param string $offset
     * @param mixed $value
     */
    public function offsetSet($offset, $value)
    {
        $this->setVar($offset, $value);
    }

    /**
     * @override \ArrayAccess
     *
     * @param string $offset
     * @return mixed
     */
    public function offsetGet($offset)
    {
        return $this->getVar($offset);
    }

    /**
     * @override \ArrayAccess
     *
     * @param string $offset
     * @return bool
     */
    public function offsetExists($offset)
    {
        return $this->existsVar($offset);
    }

    /**
     * @override \ArrayAccess
     *
     * @param string $offset
     */
    public function offsetUnset($offset)
    {
        return $this->removeVar($offset);
    }

    /**
     * @override \ArrayAccess
     *
     * @return int
     */
    public function count()
    {
        return \count($this->vars);
    }

    /**
     * Переменные реестра
     *
     * @var array
     */
    private $vars;
}
