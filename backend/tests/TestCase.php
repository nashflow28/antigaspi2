<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;
    // Note: RefreshDatabase disabled due to SQLite/migration compatibility issues
    // Tests requiring database should use MySQL testing environment
}
