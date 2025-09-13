const { test, expect } = require('@playwright/test');

test.describe('Stage 1 - API Health Check', () => {
  test('API health check should be accessible', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/health');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('message', 'API is working');
    expect(data).toHaveProperty('timestamp');
  });

  test('Database connection should be working', async ({ request }) => {
    // Test a simple endpoint that requires database
    const response = await request.get('http://localhost:8000/api/products');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('JWT Authentication endpoints should be accessible', async ({ request }) => {
    // Test registration endpoint structure
    const registerResponse = await request.post('http://localhost:8000/api/auth/register', {
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        password: 'password',
        password_confirmation: 'password',
        role: 'consumer'
      }
    });

    expect([200, 201, 422]).toContain(registerResponse.status());

    // Test login endpoint structure
    const loginResponse = await request.post('http://localhost:8000/api/auth/login', {
      data: {
        email: 'jean.dupont@email.com',
        password: 'password'
      }
    });

    expect([200, 401, 422]).toContain(loginResponse.status());
  });
});