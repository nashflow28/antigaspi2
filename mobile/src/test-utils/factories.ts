import {
  User,
  Product,
  Category,
  Merchant,
  Reservation,
  Conversation,
  ConversationMessage,
} from '../types'

export function createTestUser(overrides?: Partial<User>): User {
  return {
    id: 1,
    email: 'test@example.com',
    role: 'consumer',
    first_name: 'Test',
    last_name: 'User',
    city: 'Lomé',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

export function createTestCategory(overrides?: Partial<Category>): Category {
  return {
    id: 1,
    name: 'Boulangerie',
    description: 'Pains et viennoiseries',
    ...overrides,
  }
}

export function createTestMerchant(overrides?: Partial<Merchant>): Merchant {
  return {
    id: 1,
    business_name: 'Boulangerie Martin',
    business_type: 'Boulangerie',
    city: 'Lomé',
    phone: '+228 90 00 00 00',
    is_verified: false,
    address: '123 Rue du Commerce',
    latitude: null,
    longitude: null,
    ...overrides,
  }
}

export function createTestProduct(overrides?: Partial<Product>): Product {
  return {
    id: 1,
    name: 'Pain complet artisanal',
    description: 'Pain bio fait maison',
    original_price: 500,
    discounted_price: 250,
    quantity_available: 10,
    expiration_date: '2025-10-21',
    image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
    discount_percentage: 50,
    savings: 250,
    days_until_expiration: 3,
    created_at: '2025-01-01T00:00:00Z',
    is_active: true,
    category: createTestCategory(),
    merchant: createTestMerchant(),
    ...overrides,
  }
}

export function createTestReservation(overrides?: Partial<Reservation>): Reservation {
  return {
    id: 1,
    reservation_code: 'RES-001',
    quantity: 1,
    original_price: 500,
    discounted_price: 250,
    total_amount: 250,
    status: 'pending',
    notes: null,
    created_at: '2025-01-01T00:00:00Z',
    confirmed_at: undefined,
    completed_at: undefined,
    cancelled_at: undefined,
    product: {
      id: 1,
      name: 'Pain complet artisanal',
      description: 'Pain bio fait maison',
      image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
      original_price: 500,
      discounted_price: 250,
      discount_percentage: 50,
      expiration_date: '2025-10-21',
      merchant: {
        name: 'Boulangerie Martin',
        business_type: 'Boulangerie',
        address: '123 Rue du Commerce',
        city: 'Lomé',
        phone: '+228 90 00 00 00',
      },
      category: createTestCategory(),
    },
    consumer: createTestUser(),
    latest_payment: undefined,
    ...overrides,
  }
}

export function createTestConversationMessage(
  overrides?: Partial<ConversationMessage>
): ConversationMessage {
  const senderId = overrides?.sender_id ?? 1
  const sender = overrides?.sender ?? {
    id: senderId,
    first_name: senderId === 1 ? 'Test' : 'Jean',
    last_name: senderId === 1 ? 'User' : 'Dupont',
    photo_url: null,
    role: senderId === 1 ? 'consumer' : 'merchant',
  }

  return {
    id: 1,
    conversation_id: overrides?.conversation_id ?? 1,
    sender_id: senderId,
    content: 'Bonjour !',
    read_at: null,
    created_at: '2025-01-01T08:00:00Z',
    updated_at: '2025-01-01T08:00:00Z',
    sender,
    ...overrides,
  }
}

export function createTestConversation(overrides?: Partial<Conversation>): Conversation {
  const consumerUser = createTestUser({ id: 1, role: 'consumer', phone: '+22890000000' })
  const merchantUser = createTestUser({
    id: 2,
    role: 'merchant',
    first_name: 'Jean',
    last_name: 'Dupont',
    phone: '+22891000000',
  })

  const baseMessage = createTestConversationMessage({
    sender_id: overrides?.consumer_id ?? consumerUser.id,
    conversation_id: overrides?.id ?? 1,
  })

  return {
    id: 1,
    consumer_id: overrides?.consumer_id ?? consumerUser.id,
    merchant_id: overrides?.merchant_id ?? merchantUser.id,
    archived_by_consumer: overrides?.archived_by_consumer ?? false,
    archived_by_merchant: overrides?.archived_by_merchant ?? false,
    last_message_at: overrides?.last_message_at ?? '2025-01-01T08:00:00Z',
    last_message_preview: overrides?.last_message_preview ?? baseMessage.content,
    created_at: overrides?.created_at ?? '2025-01-01T07:50:00Z',
    updated_at: overrides?.updated_at ?? '2025-01-01T08:00:00Z',
    consumer: overrides?.consumer ?? {
      id: consumerUser.id,
      first_name: consumerUser.first_name,
      last_name: consumerUser.last_name,
      photo_url: consumerUser.photo_url ?? null,
      phone: consumerUser.phone ?? '+22890000000',
      role: 'consumer',
    },
    merchant: overrides?.merchant ?? {
      id: merchantUser.id,
      first_name: merchantUser.first_name,
      last_name: merchantUser.last_name,
      photo_url: merchantUser.photo_url ?? null,
      phone: merchantUser.phone ?? '+22891000000',
      role: 'merchant',
    },
    latestMessage: overrides?.latestMessage ?? baseMessage,
    messages_count: overrides?.messages_count ?? 1,
  }
}
