import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import ConsumerNavigator from './ConsumerNavigator'
import MerchantNavigator from './MerchantNavigator'
import AdminNavigator from './AdminNavigator'

const MainNavigator: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  // Choisir le navigateur selon le rôle utilisateur
  if (user?.role === 'merchant') {
    return <MerchantNavigator />
  }

  if (user?.role === 'admin') {
    return <AdminNavigator />
  }

  // Par défaut : navigateur consommateur
  return <ConsumerNavigator />
}

export default MainNavigator
