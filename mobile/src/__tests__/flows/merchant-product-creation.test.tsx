import React from 'react';
import { render, fireEvent, waitFor, mockStore } from '../test-utils';
import ProductFormScreen from '../../screens/merchant/ProductFormScreen';
import { TEST_IDS } from '../../utils/testIds';

describe('Merchant Product Creation Flow', () => {
  let store: any;
  let mockNavigate: jest.Mock;
  let mockGoBack: jest.Mock;

  beforeEach(() => {
    mockNavigate = jest.fn();
    mockGoBack = jest.fn();

    store = mockStore({
      auth: {
        user: {
          id: 2,
          first_name: 'Marie',
          last_name: 'Martin',
          email: 'boulangerie.martin@email.com',
          role: 'merchant'
        },
        token: 'test-token',
        isAuthenticated: true
      }
    });
  });

  it('should render product form with testID', () => {
    const navigation = {
      navigate: mockNavigate,
      goBack: mockGoBack,
      addListener: jest.fn(),
      removeListener: jest.fn()
    } as any;

    const route = {
      params: { mode: 'create' }
    } as any;

    const { getByTestId } = render(
      <ProductFormScreen navigation={navigation} route={route} />,
      { store }
    );

    expect(getByTestId(TEST_IDS.productFormScreen)).toBeTruthy();
  });

  it('should have all required form inputs', () => {
    const navigation = {
      navigate: mockNavigate,
      goBack: mockGoBack,
      addListener: jest.fn(),
      removeListener: jest.fn()
    } as any;

    const route = {
      params: { mode: 'create' }
    } as any;

    const { getByTestId } = render(
      <ProductFormScreen navigation={navigation} route={route} />,
      { store }
    );

    // Verify all form inputs exist
    expect(getByTestId(TEST_IDS.productNameInput)).toBeTruthy();
    expect(getByTestId(TEST_IDS.productDescriptionInput)).toBeTruthy();
    expect(getByTestId(TEST_IDS.originalPriceInput)).toBeTruthy();
    expect(getByTestId(TEST_IDS.discountedPriceInput)).toBeTruthy();
    expect(getByTestId(TEST_IDS.quantityInput)).toBeTruthy();
    expect(getByTestId(TEST_IDS.expirationDateInput)).toBeTruthy();
  });

  it('should allow filling product information', async () => {
    const navigation = {
      navigate: mockNavigate,
      goBack: mockGoBack,
      addListener: jest.fn(),
      removeListener: jest.fn()
    } as any;

    const route = {
      params: { mode: 'create' }
    } as any;

    const { getByTestId } = render(
      <ProductFormScreen navigation={navigation} route={route} />,
      { store }
    );

    // Fill the product name
    const nameInput = getByTestId(TEST_IDS.productNameInput);
    fireEvent.changeText(nameInput, 'Pain complet bio');

    // Fill the description
    const descriptionInput = getByTestId(TEST_IDS.productDescriptionInput);
    fireEvent.changeText(descriptionInput, 'Pain artisanal bio du jour');

    // Fill the original price
    const originalPriceInput = getByTestId(TEST_IDS.originalPriceInput);
    fireEvent.changeText(originalPriceInput, '1000');

    // Fill the discounted price
    const discountedPriceInput = getByTestId(TEST_IDS.discountedPriceInput);
    fireEvent.changeText(discountedPriceInput, '500');

    // Fill the quantity
    const quantityInput = getByTestId(TEST_IDS.quantityInput);
    fireEvent.changeText(quantityInput, '10');

    // Verify submit button exists
    expect(getByTestId(TEST_IDS.submitProductButton)).toBeTruthy();
  });

  it('should have submit button', () => {
    const navigation = {
      navigate: mockNavigate,
      goBack: mockGoBack,
      addListener: jest.fn(),
      removeListener: jest.fn()
    } as any;

    const route = {
      params: { mode: 'create' }
    } as any;

    const { getByTestId } = render(
      <ProductFormScreen navigation={navigation} route={route} />,
      { store }
    );

    const submitButton = getByTestId(TEST_IDS.submitProductButton);
    expect(submitButton).toBeTruthy();
  });

  it('should trigger submit when form is filled and submitted', async () => {
    const navigation = {
      navigate: mockNavigate,
      goBack: mockGoBack,
      addListener: jest.fn(),
      removeListener: jest.fn()
    } as any;

    const route = {
      params: { mode: 'create' }
    } as any;

    const { getByTestId } = render(
      <ProductFormScreen navigation={navigation} route={route} />,
      { store }
    );

    // Fill all required fields
    fireEvent.changeText(getByTestId(TEST_IDS.productNameInput), 'Pain complet');
    fireEvent.changeText(getByTestId(TEST_IDS.originalPriceInput), '1000');
    fireEvent.changeText(getByTestId(TEST_IDS.discountedPriceInput), '500');
    fireEvent.changeText(getByTestId(TEST_IDS.quantityInput), '10');

    // Submit the form
    const submitButton = getByTestId(TEST_IDS.submitProductButton);
    fireEvent.press(submitButton);

    // Note: Actual navigation or API calls would need to be mocked
    // This test just verifies the button can be pressed
  });
});
