const { test, expect } = require('@playwright/test');

test.describe('Stage 1 - Products API', () => {
  let authToken;
  let merchantToken;

  test.beforeAll(async ({ request }) => {
    // Get consumer token
    const consumerLogin = await request.post('http://localhost:8000/api/auth/login', {
      data: {
        email: 'jean.dupont@email.com',
        password: 'password'
      }
    });
    const consumerData = await consumerLogin.json();
    authToken = consumerData.data.token;

    // Get merchant token
    const merchantLogin = await request.post('http://localhost:8000/api/auth/login', {
      data: {
        email: 'boulangerie.martin@email.com',
        password: 'password'
      }
    });
    const merchantData = await merchantLogin.json();
    merchantToken = merchantData.data.token;
  });

  test('Products list should be accessible without authentication', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/products');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');
    expect(Array.isArray(data.data)).toBe(true);
    expect(data).toHaveProperty('pagination');
    expect(data.pagination).toHaveProperty('current_page');
    expect(data.pagination).toHaveProperty('per_page');
  });

  test('Product details should include required fields', async ({ request }) => {
    // First get products list
    const listResponse = await request.get('http://localhost:8000/api/products');
    const listData = await listResponse.json();

    if (listData.data.length > 0) {
      const productId = listData.data[0].id;

      const response = await request.get(`http://localhost:8000/api/products/${productId}`);
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('name');
      expect(data.data).toHaveProperty('description');
      expect(data.data).toHaveProperty('original_price');
      expect(data.data).toHaveProperty('discounted_price');
      expect(data.data).toHaveProperty('quantity_available');
      expect(data.data).toHaveProperty('expiration_date');
      expect(data.data).toHaveProperty('merchant');
    }
  });

  test('Products can be filtered by category', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/products?category=boulangerie');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('Products can be searched by name', async ({ request }) => {
    const response = await request.get('http://localhost:8000/api/products?search=pain');
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('Merchant can create a new product', async ({ request }) => {
    const newProduct = {
      name: `Test Product ${Date.now()}`,
      description: 'Test product description',
      category: 'test',
      original_price: 1000,
      reduced_price: 500,
      quantity_available: 10,
      expiration_date: '2025-12-31'
    };

    const response = await request.post('http://localhost:8000/api/products', {
      data: newProduct,
      headers: {
        'Authorization': `Bearer ${merchantToken}`
      }
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data.data).toHaveProperty('name', newProduct.name);
    expect(data.data).toHaveProperty('original_price', newProduct.original_price.toString());
  });

  test('Consumer cannot create products', async ({ request }) => {
    const newProduct = {
      name: 'Unauthorized Product',
      description: 'This should fail',
      category: 'test',
      original_price: 1000,
      reduced_price: 500,
      quantity_available: 10,
      expiration_date: '2025-12-31'
    };

    const response = await request.post('http://localhost:8000/api/products', {
      data: newProduct,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(403);
  });
});