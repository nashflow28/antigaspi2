// Test direct de l'API
async function testAPI() {
  const apiUrl = 'http://localhost:8000/api'

  console.log('🔍 Test de connexion API...')

  try {
    // Test 1: Health check
    const healthResponse = await fetch(`${apiUrl}/health`)
    const healthData = await healthResponse.json()
    console.log('✅ Health check:', healthData)

    // Test 2: Login
    const loginResponse = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email: 'djamichou@gmail.com',
        password: 'password'
      })
    })

    const loginData = await loginResponse.json()
    console.log('✅ Login:', loginData.success ? 'Réussi' : 'Échec')

    if (loginData.success) {
      const token = loginData.data.token
      console.log('🎫 Token obtenu')

      // Test 3: Get products
      const productsResponse = await fetch(`${apiUrl}/products`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        console.log('✅ Produits récupérés:', productsData.data?.length || 0, 'produits')
      } else {
        console.log('❌ Erreur produits:', productsResponse.status)
      }

      // Test 4: Get wallet
      const walletResponse = await fetch(`${apiUrl}/wallet`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      if (walletResponse.ok) {
        const walletData = await walletResponse.json()
        console.log('✅ Portefeuille:', walletData.data?.wallet?.formatted_balance || 'N/A')
      } else {
        console.log('❌ Erreur portefeuille:', walletResponse.status)
      }
    }

  } catch (error) {
    console.error('❌ Erreur de test:', error.message)
  }
}

testAPI()
