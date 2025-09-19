<?php

namespace Tests\Feature;

use Tests\TestCase;

class AdminAuthorizationTest extends TestCase
{
    public function test_admin_routes_require_authentication(): void
    {
        config([
            'jwt.secret' => 'test-secret',
            'jwt.keys.secret' => 'test-secret',
        ]);

        $response = $this->getJson('/api/admin/users');

        $response->assertStatus(401);
    }
}
