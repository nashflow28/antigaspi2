import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import ConsumerNavigator from './ConsumerNavigator'
import MerchantNavigator from './MerchantNavigator'
import AdminNavigator from './AdminNavigator'

const MainNavigator: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  // 🔍 DEBUG: Afficher le rôle de l'utilisateur connecté
  console.log('🔍 [MainNavigator] User role:', user?.role)
  console.log('🔍 [MainNavigator] User email:', user?.email)
  console.log('🔍 [MainNavigator] Full user:', JSON.stringify(user, null, 2))

  // Choisir le navigateur selon le rôle utilisateur
  if (user?.role === 'merchant') {
    console.log('✅ [MainNavigator] Routing to MERCHANT Navigator')
    return <MerchantNavigator />
  }

  if (user?.role === 'admin') {
    console.log('✅ [MainNavigator] Routing to ADMIN Navigator')
    return <AdminNavigator />
  }

  // Par défaut : navigateur consommateur
  console.log('✅ [MainNavigator] Routing to CONSUMER Navigator (default)')
  return <ConsumerNavigator />
}

export default MainNavigator
