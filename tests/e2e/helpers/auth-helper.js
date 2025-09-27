/**
 * Authentication Helper for E2E Tests
 * Provides reusable authentication functions with proper error handling
 */

class AuthHelper {
  constructor(request) {
    this.request = request;
    this.baseUrl = 'http://localhost:8000/api';
    this.defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Login with valid credentials and return token
   */
  async login(email = 'jean.dupont@email.com', password = 'password') {
    const response = await this.request.post(`${this.baseUrl}/auth/login`, {
      data: { email, password },
      headers: this.defaultHeaders
    });

    if (response.status() !== 200) {
      const errorData = await response.json();
      throw new Error(`Login failed: ${response.status()} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    if (!data.success || !data.data?.token) {
      throw new Error(`Login response invalid: ${JSON.stringify(data)}`);
    }

    return {
      token: data.data.token,
      user: data.data.user,
      tokenType: data.data.token_type || 'Bearer',
      expiresIn: data.data.expires_in
    };
  }

  /**
   * Make authenticated request with token
   */
  async authenticatedRequest(method, endpoint, token, options = {}) {
    const headers = {
      ...this.defaultHeaders,
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };

    const requestOptions = {
      ...options,
      headers
    };

    return await this.request[method.toLowerCase()](`${this.baseUrl}${endpoint}`, requestOptions);
  }

  /**
   * Logout with token
   */
  async logout(token) {
    return await this.authenticatedRequest('POST', '/auth/logout', token);
  }

  /**
   * Get user profile with token
   */
  async getProfile(token) {
    return await this.authenticatedRequest('GET', '/auth/me', token);
  }

  /**
   * Test if a route requires authentication
   */
  async testProtectedRoute(endpoint) {
    const response = await this.request.get(`${this.baseUrl}${endpoint}`, {
      headers: this.defaultHeaders
    });

    return {
      status: response.status(),
      data: await response.json().catch(() => null)
    };
  }

  /**
   * Register new user
   */
  async register(userData) {
    const response = await this.request.post(`${this.baseUrl}/auth/register`, {
      data: userData,
      headers: this.defaultHeaders
    });

    return {
      status: response.status(),
      data: await response.json()
    };
  }

  /**
   * Wait for rate limit reset
   */
  async waitForRateLimit(seconds = 2) {
    await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }
}

module.exports = { AuthHelper };
