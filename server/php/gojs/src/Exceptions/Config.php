<?php
/**
 * Исключение: нет нужного параметра конфигурации
 *
 * @package go\gojs
 * @author  Григорьев Олег aka vasa_c <go.vasac@gmail.com>
 */

namespace go\gojs\Exceptions;

final class Config extends Logic
{
    /**
     * Конструктор
     *
     * @param string $param
     *        имя требуемого параметра
     */
    public function __construct($param)
    {
        $this->param = $param;
        $message = 'No config param "'.$param.'"';
        parent::__construct($message);
    }

    /**
     * Получить имя требуемого параметра
     *
     * @return string
     */
    public function getParam()
    {
        return $this->param;
    }

    /**
     * Требуемые параметр
     *
     * @var string
     */
    private $param;
}
