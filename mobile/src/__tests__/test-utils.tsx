import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '../theme/ThemeContext';
import configureStore from 'redux-mock-store';

const mockStore = configureStore([]);

interface AllTheProvidersProps {
  children: React.ReactNode;
  store?: any;
}

function AllTheProviders({ children, store }: AllTheProvidersProps) {
  const testStore = store || mockStore({
    auth: {
      user: null,
      token: null,
      isAuthenticated: false
    },
    products: {
      products: [],
      selectedProduct: null,
      loading: false,
      error: null
    },
    reservations: {
      reservations: [],
      loading: false,
      error: null
    },
    reviews: {
      reviews: [],
      stats: {
        averageRating: 0,
        totalReviews: 0
      },
      loading: false,
      error: null
    },
    favorites: {
      favorites: [],
      loading: false,
      error: null
    },
    merchants: {
      merchants: [],
      selectedMerchant: null,
      loading: false,
      error: null
    },
    connectivity: {
      isOnline: true
    }
  });

  return (
    <Provider store={testStore}>
      <ThemeProvider>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </ThemeProvider>
    </Provider>
  );
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  store?: any;
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { store, ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => <AllTheProviders store={store}>{children}</AllTheProviders>,
    ...renderOptions
  });
};

export * from '@testing-library/react-native';
export { customRender as render };
export { mockStore };
