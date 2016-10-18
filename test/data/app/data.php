<?php
class data {

    public static $filename = '/db';

    public static function get($key) {
        $data = self::load();
        return $data[$key];
    }

    public static function set($key, $value)
    {
        $data = self::load();
        $data[$key] = $value;
        self::save($data);
    }

    public static function remove($key)
    {
        $data = self::load();
        unset($data[$key]);
        self::save($data);
    }

    public static function clean()
    {
        self::save(array());
    }

    protected static function load()
    {
	$data = array();
	if (file_exists(__DIR__.self::$filename)) {
	    $data = json_decode(file_get_contents(__DIR__.self::$filename), true);
	}
        return $data;
    }

    protected static function save($data)
    {
        file_put_contents(__DIR__.self::$filename, json_encode($data));
    }
}
