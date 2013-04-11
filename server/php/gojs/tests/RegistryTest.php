<?php
/**
 * Тестирование реестра каркаса
 *
 * @package    go\gojs
 * @subpackage Tests
 * @author     Григорьев Олег aka vasa_c <go.vasac@gmail.com>
 */

namespace go\gojs\Tests;

use go\gojs\Registry;

/**
 * @covers \go\gojs\Registry
 */
class RegistryTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers \go\gojs\Registry::__construct
     * @covers \go\gojs\Registry::setRegistry
     * @covers \go\gojs\Registry::getRegistry
     */
    public function testSetGetRegistry()
    {
        $registry = new Registry();
        $this->assertEquals(array(), $registry->getRegistry());

        $vars = array(
            'a' => 1,
            'b' => 2,
        );
        $registry = new Registry($vars);
        $this->assertEquals($vars, $registry->getRegistry());

        $vars = array(
            'c' => 3,
            'd' => 4,
        );
        $registry->setRegistry($vars);
        $this->assertEquals($vars, $registry->getRegistry());
    }

    /**
     * @covers \go\gojs\Registry::setVar
     * @covers \go\gojs\Registry::getVar
     * @covers \go\gojs\Registry::existsVar
     * @covers \go\gojs\Registry::removeVar
     */
    public function testGetSet()
    {
        $vars = array(
            'a' => 1,
            'b' => 2,
        );
        $registry = new Registry($vars);
        $registry->setVar('b', 3);
        $registry->setVar('c', 4);

        $expected = array(
            'a' => 1,
            'b' => 3,
            'c' => 4,
        );
        $this->assertEquals($expected, $registry->getRegistry());

        $this->assertEquals(3, $registry->getVar('b'));
        $this->assertNull($registry->getVar('x'));
        $this->assertEquals(11, $registry->getVar('x', 11));

        $this->assertTrue($registry->existsVar('a'));
        $this->assertFalse($registry->existsVar('x'));

        $registry->removeVar('a');
        $registry->removeVar('x');
        $expected = array(
            'b' => 3,
            'c' => 4,
        );
        $this->assertEquals($expected, $registry->getRegistry());
    }

    /**
     * @covers \go\gojs\Registry::__get
     * @covers \go\gojs\Registry::__set
     * @covers \go\gojs\Registry::__isset
     * @covers \go\gojs\Registry::__unset
     */
    public function testMagic()
    {
        $vars = array(
            'a' => 1,
            'b' => 2,
        );
        $registry = new Registry($vars);
        $registry->b = 3;
        $registry->c = 4;

        $expected = array(
            'a' => 1,
            'b' => 3,
            'c' => 4,
        );
        $this->assertEquals($expected, $registry->getRegistry());

        $this->assertEquals(3, $registry->b);
        $this->assertNull($registry->x);

        $this->assertTrue(isset($registry->a));
        $this->assertFalse(isset($registry->x));

        unset($registry->a);
        unset($registry->x);
        $expected = array(
            'b' => 3,
            'c' => 4,
        );
        $this->assertEquals($expected, $registry->getRegistry());
    }

    /**
     * @covers \go\gojs\Registry::offsetSet
     * @covers \go\gojs\Registry::offsetGet
     * @covers \go\gojs\Registry::offsetExists
     * @covers \go\gojs\Registry::offsetUnset
     */
    public function testArrayAccess()
    {
        $vars = array(
            'a' => 1,
            'b' => 2,
        );
        $registry = new Registry($vars);
        $registry['b'] = 3;
        $registry['c'] = 4;

        $expected = array(
            'a' => 1,
            'b' => 3,
            'c' => 4,
        );
        $this->assertEquals($expected, $registry->getRegistry());

        $this->assertEquals(3, $registry['b']);
        $this->assertNull($registry['x']);

        $this->assertTrue(isset($registry['a']));
        $this->assertFalse(isset($registry['x']));

        unset($registry['a']);
        unset($registry['x']);
        $expected = array(
            'b' => 3,
            'c' => 4,
        );
        $this->assertEquals($expected, $registry->getRegistry());
    }

    public function testCountable()
    {
        $registry = new Registry();
        $this->assertCount(0, $registry);

        $registry->a = 1;
        $registry->b = 2;
        $this->assertCount(2, $registry);

        unset($registry->a);
        $this->assertCount(1, $registry);
    }
}
