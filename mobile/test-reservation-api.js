#!/usr/bin/env node

/**
 * Test automatique de l'API de réservation
 * Reproduit le problème de l'utilisateur
 */

const API_BASE_URL = 'http://localhost:8000/api';

async function makeRequest(method, endpoint, token = null, body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`\n🌐 ${method} ${endpoint}`);
  if (token) {
    console.log(`🔑 Token: ${token.substring(0, 20)}...${token.substring(token.length - 10)}`);
  }
  if (body) {
    console.log(`📦 Body:`, JSON.stringify(body, null, 2));
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Response:`, JSON.stringify(data, null, 2));

    return { response, data };
  } catch (error) {
    console.error(`❌ Error:`, error.message);
    throw error;
  }
}

async function testReservationFlow() {
  console.log('🧪 TEST AUTOMATIQUE - FLUX DE RÉSERVATION');
  console.log('==========================================\n');

  try {
    // ÉTAPE 1: Login avec Jean Dupont
    console.log('📝 ÉTAPE 1: Login avec consommateur Jean Dupont');
    const loginResult = await makeRequest('POST', '/auth/login', null, {
      email: 'jean.dupont@email.com',
      password: 'password',
    });

    if (!loginResult.data.success) {
      console.error('❌ Login échoué:', loginResult.data);
      return;
    }

    const token = loginResult.data.data.token;
    const user = loginResult.data.data.user;
    console.log(`✅ Login réussi - User ID: ${user.id}, Nom: ${user.name}`);

    // ÉTAPE 2: Vérifier le token avec /auth/me
    console.log('\n📝 ÉTAPE 2: Vérification du token avec /auth/me');
    const meResult = await makeRequest('GET', '/auth/me', token);

    if (meResult.response.status === 401) {
      console.error('❌ Token invalide immédiatement après login !');
      return;
    }

    console.log(`✅ Token valide - User: ${meResult.data.data.name}`);

    // ÉTAPE 3: Créer une réservation pour le produit Pain complet (ID 17)
    console.log('\n📝 ÉTAPE 3: Création de réservation pour Pain complet (ID 17)');
    const reservationResult = await makeRequest('POST', '/reservations', token, {
      product_id: 17,
      quantity: 1,
      payment_method: 'on_site',
      notes: null,
    });

    if (reservationResult.response.status === 401) {
      console.error('❌ PROBLÈME IDENTIFIÉ: Token rejeté lors de la création de réservation !');
      console.log('\n🔍 Analyse du problème:');
      console.log('- Le token est valide pour /auth/me');
      console.log('- Le token est rejeté pour /reservations');
      console.log('- Cela indique probablement un problème de middleware ou de configuration JWT');
      return;
    }

    if (reservationResult.response.status === 422) {
      console.error('❌ ERREUR DE VALIDATION:', reservationResult.data);
      console.log('\n🔍 Les données envoyées ne passent pas la validation Laravel');
      return;
    }

    if (!reservationResult.data.success) {
      console.error('❌ Réservation échouée:', reservationResult.data);
      return;
    }

    console.log(`✅ Réservation créée avec succès !`);
    console.log(`📋 Réservation ID: ${reservationResult.data.data.id}`);
    console.log(`💰 Montant total: ${reservationResult.data.data.total_amount} F CFA`);

    console.log('\n✅ TEST RÉUSSI - Tout fonctionne correctement !');

  } catch (error) {
    console.error('\n❌ TEST ÉCHOUÉ:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Exécuter le test
testReservationFlow();
