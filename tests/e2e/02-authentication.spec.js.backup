const { test, expect } = require('@playwright/test');

test.describe('Stage 1 - JWT Authentication', () => {
  test('User can login with valid credentials', async ({ request }) => {
    const response = await request.post('http://localhost:8000/api/auth/login', {
      data: {
        email: 'jean.dupont@email.com',
        password: 'password'
      }
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data.data).toHaveProperty('token');
    expect(data.data).toHaveProperty('token_type', 'Bearer');
    expect(data.data).toHaveProperty('expires_in');
    expect(data.data).toHaveProperty('user');
    expect(data.data.user).toHaveProperty('email', 'jean.dupont@email.com');
    expect(data.data.user).toHaveProperty('role', 'consumer');
  });

  test('User cannot login with invalid credentials', async ({ request }) => {
    const response = await request.post('http://localhost:8000/api/auth/login', {
      data: {
        email: 'jean.dupont@email.com',
        password: 'wrongpassword'
      }
    });

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('message', 'Email ou mot de passe incorrect');
  });

  test('Protected routes require authentication', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/auth/me');
    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('message', 'Unauthenticated.');
  });

  test('Authenticated user can access protected routes', async ({ request }) => {
    // First login to get token
    const loginResponse = await request.post('http://localhost:8000/api/auth/login', {
      data: {
        email: 'jean.dupont@email.com',
        password: 'password'
      }
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.token;

    // Use token to access protected route
    const meResponse = await request.get('http://localhost:8000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(meResponse.status()).toBe(200);

    const userData = await meResponse.json();
    expect(userData).toHaveProperty('success', true);
    expect(userData.user).toHaveProperty('email', 'jean.dupont@email.com');
  });

  test('User can logout successfully', async ({ request }) => {
    // First login
    const loginResponse = await request.post('http://localhost:8000/api/auth/login', {
      data: {
        email: 'jean.dupont@email.com',
        password: 'password'
      }
    });

    const loginData = await loginResponse.json();
    const token = loginData.data.token;

    // Logout
    const logoutResponse = await request.post('http://localhost:8000/api/auth/logout', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(logoutResponse.status()).toBe(200);

    const logoutData = await logoutResponse.json();
    expect(logoutData).toHaveProperty('success', true);
    expect(logoutData).toHaveProperty('message', 'Successfully logged out');
  });
});