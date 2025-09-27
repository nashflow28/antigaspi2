const { test, expect } = require('@playwright/test');
const { AuthHelper } = require('./helpers/auth-helper.js');

test.describe('Stage 1 - JWT Authentication', () => {
  test.describe.configure({ mode: 'serial' }); // Run auth tests in sequence to avoid rate limiting

  let authHelper;

  test.beforeEach(async ({ request }) => {
    authHelper = new AuthHelper(request);
    // Small delay to avoid rate limiting
    await authHelper.waitForRateLimit(0.5);
  });

  test('User can login with valid credentials', async () => {
    const authData = await authHelper.login();
    
    expect(authData.token).toBeTruthy();
    expect(authData.tokenType).toBe('Bearer');
    expect(authData.expiresIn).toBe(3600);
    expect(authData.user.email).toBe('jean.dupont@email.com');
    expect(authData.user.role).toBe('consumer');
  });

  test('User cannot login with invalid credentials', async ({ request }) => {
    const response = await request.post('http://localhost:8000/api/auth/login', {
      data: {
        email: 'jean.dupont@email.com',
        password: 'wrongpassword'
      },
      headers: authHelper.defaultHeaders
    });

    expect(response.status()).toBe(401);

    const data = await response.json();
    expect(data).toHaveProperty('success', false);
    expect(data).toHaveProperty('message', 'Email ou mot de passe incorrect');
  });

  test('Protected routes require authentication', async () => {
    const result = await authHelper.testProtectedRoute('/auth/me');
    
    expect(result.status).toBe(401);
    expect(result.data).toHaveProperty('message', 'Token not provided');
  });

  test('Authenticated user can access protected routes', async () => {
    const authData = await authHelper.login();
    const response = await authHelper.getProfile(authData.token);

    expect(response.status()).toBe(200);

    const userData = await response.json();
    expect(userData).toHaveProperty('success', true);
    // Fix: API returns user data under 'data', not 'user'
    expect(userData.data).toHaveProperty('email', 'jean.dupont@email.com');
    expect(userData.data).toHaveProperty('role', 'consumer');
  });

  test('User can logout successfully', async () => {
    const authData = await authHelper.login();
    const response = await authHelper.logout(authData.token);

    expect(response.status()).toBe(200);

    const logoutData = await response.json();
    expect(logoutData).toHaveProperty('success', true);
    expect(logoutData).toHaveProperty('message', 'Déconnexion réussie');
  });
});
