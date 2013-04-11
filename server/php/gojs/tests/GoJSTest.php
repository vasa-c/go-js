<?php
/**
 * Тестирование класса GoJS
 *
 * @package    go\gojs
 * @subpackage Tests
 * @author     Григорьев Олег aka vasa_c <go.vasac@gmail.com>
 */

namespace go\gojs\Tests;

use go\gojs\GoJS;

/**
 * @covers \go\gojs\GoJS
 */
class GoJSTest extends \PHPUnit_Framework_TestCase
{
    /**
     * @covers \go\gojs\GoJS::inc
     * @covers \go\gojs\GoJS::getListSrc
     * @covers \go\gojs\GoJS::getVarsForTemplate
     */
    public function testInc()
    {
        $config = array(
            'root' => '/js/go',
        );
        $gojs = new GoJS($config);
        $this->assertTrue($gojs->inc('One'));
        $this->assertTrue($gojs->inc('Two'));
        $this->assertFalse($gojs->inc('One'));

        $expected = array(
            '/js/go/go.js',
            '/js/go/One.js',
            '/js/go/Two.js',
        );
        $this->assertEquals($expected, $gojs->getListSrc());

        $expected = array(
            'scripts' => array(
                array('src' => '/js/go/go.js'),
                array('src' => '/js/go/One.js'),
                array('src' => '/js/go/Two.js'),
            ),
        );
        $this->assertEquals($expected, $gojs->getVarsForTemplate());
    }

    public function testConfigInc()
    {
        $config = array(
            'root' => '/js/go',
            'incs' => array(
                'One',
                'Three',
            ),
        );
        $gojs = new GoJS($config);
        $this->assertFalse($gojs->inc('One'));
        $this->assertTrue($gojs->inc('Two'));

        $expected = array(
            '/js/go/go.js',
            '/js/go/One.js',
            '/js/go/Three.js',
            '/js/go/Two.js',
        );
        $this->assertEquals($expected, $gojs->getListSrc());
    }

    public function testGoForceInc()
    {
        $config = array(
            'root' => '/js/go',
        );

        $gojs = new GoJS($config);
        $expected = array(
            '/js/go/go.js',
        );
        $this->assertFalse($gojs->inc('core'));
        $this->assertEquals($expected, $gojs->getListSrc());

        $config = array(
            'root' => '/js/go',
            'go_force_inc' => false,
        );
        $gojs = new GoJS($config);
        $expected = array();
        $this->assertEquals($expected, $gojs->getListSrc());
        $this->assertTrue($gojs->inc('core'));
        $expected = array(
            '/js/go/go.js',
        );
        $this->assertEquals($expected, $gojs->getListSrc());
        $this->assertFalse($gojs->inc('Lang'));
        $this->assertEquals($expected, $gojs->getListSrc());

        $config = array(
            'root' => '/js/go',
            'go_force_inc' => false,
        );
        $gojs = new GoJS($config);
        $gojs->inc('One');
        $expected = array(
            '/js/go/go.js',
            '/js/go/One.js',
        );
        $this->assertEquals($expected, $gojs->getListSrc());
    }

    /**
     * @expectedException \go\gojs\Exceptions\Config
     */
    public function testErrorConfigRoot()
    {
        $config = array();
        $gojs = new GoJS($config);
        $gojs->inc('One');
        $gojs->getVarsForTemplate();
    }
}
