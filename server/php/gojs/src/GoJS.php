<?php
/**
 * Класс, отвечающий за подключение go.js
 *
 * @package go\gojs
 * @author  Григорьев Олег aka vasa_c <go.vasac@gmail.com>
 */

namespace go\gojs;

class GoJS
{
    /**
     * Конструктор
     *
     * @param array $config
     *         конфигурация
     */
    public function __construct(array $config)
    {
        $this->config = $config;
        if ($this->getConfigProp('go_force_inc', true)) {
            $this->inc('core');
        }
        if (!empty($config['incs'])) {
            foreach ($config['incs'] as $name) {
                $this->inc($name);
            }
        }
    }

    /**
     * Подключение go-расширения
     *
     * @param string $name
     *         имя расширения
     * @return bool
     *          было ли оно подключено в данный момент
     */
    public function inc($name)
    {
        if (!isset($this->incs['core'])) {
            $this->incs['core'] = 'core';
            if ($name == 'core') {
                return true;
            }
        }
        if ($name == 'Lang') {
            $name = 'core';
        }
        if (isset($this->incs[$name])) {
            return false;
        }
        $this->incs[$name] = $name;
        return true;
    }

    /**
     * Получить список SRC для подключаемых скриптов
     */
    public function getListSrc()
    {
        $root = $this->getConfigProp('root', null, true).'/';
        $srcs = array();
        foreach ($this->incs as $name) {
            if ($name == 'core') {
                $name = 'go';
            }
            $srcs[] = $root.$name.'.js';
        }
        return $srcs;
    }

    /**
     * Получить переменные для отрисовки в шаблоне
     *
     * @return array
     */
    public function getVarsForTemplate()
    {
        $scripts = array();
        foreach ($this->getListSrc() as $src) {
            $scripts[] = array('src' => $src);
        }
        return array(
            'scripts' => $scripts,
        );
    }

    /**
     * Получить html-код для вставки
     *
     * @param bool $typejs [optional]
     *         использовать ли type="text/javascript"
     * @param string $suff
     *         перенос после каждого тега SCRIPT
     * @return string
     */
    public function getOut($typejs = false, $suff = '')
    {
        $result = array();
        $typejs = $typejs ? ' type="text/javascript"' : '';
        $vars = $this->getVarsForTemplate();
        foreach ($vars['scripts'] as $script) {
            $result[] = '<script'.$typejs.' src="'.$script['src'].'"></script>'.$suff;
        }
        return \implode('', $result);
    }

    /**
     * Вывести html-код
     *
     * @param bool $typejs [optional]
     *         использовать ли type="text/javascript"
     * @param string $suff
     *         перенос после каждого тега SCRIPT
     */
    public function out($typejs = false, $suff = '')
    {
        echo $this->getOut($typejs, $suff);
    }

    private function getConfigProp($name, $default = null, $throw = false)
    {
        if (!\array_key_exists($name, $this->config)) {
            if (!$throw) {
                return $default;
            }
            throw new Exceptions\Config($name);
        }
        return $this->config[$name];
    }

    /**
     * Конфигурация системы
     *
     * @var array
     */
    private $config;

    /**
     * Список подключённых расширений
     *
     * @var array
     */
    private $incs = array();
}
