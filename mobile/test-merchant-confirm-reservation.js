#!/usr/bin/env node

/**
 * Test automatique - Commerçant confirme une réservation
 * Teste le flux: Login commerçant → Récupérer réservations → Confirmer réservation
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

async function testMerchantConfirmReservation() {
  console.log('🧪 TEST AUTOMATIQUE - COMMERÇANT CONFIRME RÉSERVATION');
  console.log('========================================================\n');

  try {
    // ÉTAPE 1: Trouver le compte commerçant de la Boulangerie Soleil
    console.log('📝 ÉTAPE 1: Récupération des infos commerçant Boulangerie Soleil');

    // Boulangerie Soleil (merchant_id = 3)
    // Email récupéré depuis la base de données: boulangerie.soleil@antigaspi.tg
    const merchantEmail = 'boulangerie.soleil@antigaspi.tg';
    const merchantPassword = 'password';

    // ÉTAPE 2: Login avec le compte commerçant
    console.log('\n📝 ÉTAPE 2: Login avec compte commerçant');
    const loginResult = await makeRequest('POST', '/auth/login', null, {
      email: merchantEmail,
      password: merchantPassword,
    });

    if (!loginResult.data.success) {
      console.error('❌ Login commerçant échoué:', loginResult.data);
      return;
    }

    const token = loginResult.data.data.token;
    const merchant = loginResult.data.data.user;
    console.log(`✅ Login réussi - Merchant: ${merchant.first_name} ${merchant.last_name}, Role: ${merchant.role}`);

    if (merchant.role !== 'merchant') {
      console.error(`❌ Ce compte n'est pas un commerçant (role: ${merchant.role})`);
      return;
    }

    // ÉTAPE 3: Récupérer les réservations du commerçant
    console.log('\n📝 ÉTAPE 3: Récupération des réservations du commerçant');
    const reservationsResult = await makeRequest('GET', '/reservations/merchant/list', token);

    if (!reservationsResult.data.success) {
      console.error('❌ Récupération réservations échouée:', reservationsResult.data);
      return;
    }

    const reservations = reservationsResult.data.data;
    console.log(`✅ ${reservations.length} réservation(s) trouvée(s)`);

    if (reservations.length === 0) {
      console.log('⚠️  Aucune réservation à confirmer pour ce commerçant');
      console.log('💡 Note: Le commerçant Marie Martin (merchant_id=1) pourrait ne pas avoir de réservations.');
      console.log('💡 Les réservations de test ont été créées pour le merchant_id=3 (Boulangerie Soleil)');
      return;
    }

    // Trouver une réservation en statut 'pending' à confirmer
    const pendingReservation = reservations.find(r => r.status === 'pending');

    if (!pendingReservation) {
      console.log('⚠️  Aucune réservation "pending" trouvée à confirmer');
      console.log('📋 Statuts des réservations:');
      reservations.forEach(r => {
        console.log(`   - Réservation ${r.id}: ${r.status} (Produit: ${r.product.name})`);
      });
      return;
    }

    console.log(`\n📦 Réservation à confirmer:`);
    console.log(`   - ID: ${pendingReservation.id}`);
    console.log(`   - Produit: ${pendingReservation.product.name}`);
    console.log(`   - Quantité: ${pendingReservation.quantity}`);
    console.log(`   - Montant: ${pendingReservation.total_amount} F CFA`);
    console.log(`   - Status: ${pendingReservation.status}`);
    console.log(`   - Client: ${pendingReservation.consumer.name}`);

    // ÉTAPE 4: Confirmer la réservation
    console.log('\n📝 ÉTAPE 4: Confirmation de la réservation');
    const confirmResult = await makeRequest(
      'POST',
      `/reservations/${pendingReservation.id}/confirm`,
      token
    );

    if (confirmResult.response.status === 403) {
      console.error('❌ ERREUR 403: Ce commerçant ne peut pas confirmer cette réservation');
      console.log('💡 La réservation appartient probablement à un autre commerçant');
      return;
    }

    if (!confirmResult.data.success) {
      console.error('❌ Confirmation échouée:', confirmResult.data);
      return;
    }

    console.log(`✅ Réservation confirmée avec succès !`);
    console.log(`📋 Message: ${confirmResult.data.message}`);

    // ÉTAPE 5: Vérifier que le statut a changé
    console.log('\n📝 ÉTAPE 5: Vérification du changement de statut');
    const checkResult = await makeRequest('GET', `/reservations/${pendingReservation.id}`, token);

    if (checkResult.data.success) {
      const updatedReservation = checkResult.data.data;
      console.log(`✅ Status mis à jour: ${updatedReservation.status}`);
      console.log(`📅 Confirmé le: ${updatedReservation.confirmed_at}`);
    }

    console.log('\n✅ TEST RÉUSSI - Réservation confirmée par le commerçant !');

  } catch (error) {
    console.error('\n❌ TEST ÉCHOUÉ:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Exécuter le test
testMerchantConfirmReservation();
