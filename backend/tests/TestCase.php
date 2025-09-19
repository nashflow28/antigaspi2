<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Str;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'jwt.secret' => Str::random(64),
            'app.key' => 'base64:' . base64_encode(random_bytes(32)),
        ]);
    }
}
