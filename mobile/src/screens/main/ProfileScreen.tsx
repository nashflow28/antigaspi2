import React from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { logoutUser } from '../../store/slices/authSlice'
import { AppDispatch, RootState } from '../../store'
import { Ionicons } from '@expo/vector-icons'
import { Button, Card, Badge, Typography } from '../../components/2025'
import { useTheme } from '../../theme'

const ProfileScreen: React.FC = () => {
  const theme = useTheme()
  const dispatch = useDispatch<AppDispatch>()
  const { user } = useSelector((state: RootState) => state.auth)

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: () => dispatch(logoutUser()),
        },
      ]
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card variant="elevated" style={{ alignItems: 'center', paddingVertical: theme.spacing['2xl'], paddingTop: theme.spacing['3xl'], marginBottom: theme.spacing.lg }}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.neutral[100], marginBottom: theme.spacing.md }]}>
          <Ionicons name="person" size={40} color={theme.colors.primary[500]} />
        </View>
        <Typography variant="h2" weight="bold" style={{ marginBottom: theme.spacing.xs }}>
          {user?.first_name} {user?.last_name}
        </Typography>
        <Typography variant="body" color="secondary" style={{ marginBottom: theme.spacing.sm }}>
          {user?.email}
        </Typography>
        <Badge variant={user?.role === 'consumer' ? 'primary' : 'promo'} size="md">
          {user?.role === 'consumer' ? 'Consommateur' : 'Commerçant'}
        </Badge>
      </Card>

      <Card variant="elevated" style={{ marginHorizontal: theme.spacing.lg, overflow: 'hidden' }}>
        <TouchableOpacity style={[styles.menuItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
          <Ionicons name="person-outline" size={24} color={theme.colors.text} />
          <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
            Modifier le profil
          </Typography>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
          <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
          <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
            Notifications
          </Typography>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}>
          <Ionicons name="help-circle-outline" size={24} color={theme.colors.text} />
          <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md }}>
            Aide & Support
          </Typography>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.neutral[400]} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={theme.colors.error[500]} />
          <Typography variant="body" style={{ flex: 1, marginLeft: theme.spacing.md, color: theme.colors.error[500] }}>
            Déconnexion
          </Typography>
        </TouchableOpacity>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})

export default ProfileScreen