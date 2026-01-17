import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useDispatch, useSelector } from 'react-redux'
import { useTheme } from '../../theme'
import { useHaptics } from '../../hooks/useHaptics'
import { RootState, AppDispatch } from '../../store'
import { updateDriverProfile } from '../../store/slices/driverSlice'
import { VehicleType } from '../../types'

const DriverProfileEditScreen: React.FC = () => {
  const theme = useTheme()
  const haptics = useHaptics()
  const navigation = useNavigation<any>()
  const dispatch = useDispatch<AppDispatch>()

  const { profile, loading } = useSelector((state: RootState) => state.driver)

  const [vehicleType, setVehicleType] = useState<VehicleType>(profile?.vehicle_type || 'moto')
  const [vehiclePlate, setVehiclePlate] = useState(profile?.vehicle_plate || '')
  const [licenseNumber, setLicenseNumber] = useState(profile?.license_number || '')

  const handleSave = async () => {
    haptics.mediumTap()
    try {
      await dispatch(updateDriverProfile({
        vehicle_type: vehicleType,
        vehicle_plate: vehiclePlate || null,
        license_number: licenseNumber || null,
      })).unwrap()
      haptics.success()
      Alert.alert('Succès', 'Profil mis à jour', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (error: any) {
      haptics.error()
      Alert.alert('Erreur', error || 'Impossible de mettre à jour')
    }
  }

  const vehicleOptions: { value: VehicleType; label: string; icon: string }[] = [
    { value: 'moto', label: 'Moto', icon: 'bicycle' },
    { value: 'velo', label: 'Vélo', icon: 'bicycle' },
    { value: 'voiture', label: 'Voiture', icon: 'car' },
    { value: 'pied', label: 'À pied', icon: 'walk' },
  ]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.cardBackground }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Modifier le profil
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vehicle type */}
        <Text style={[styles.label, { color: theme.colors.text }]}>Type de véhicule</Text>
        <View style={styles.vehicleOptions}>
          {vehicleOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.vehicleOption,
                { backgroundColor: theme.colors.cardBackground },
                vehicleType === option.value && { borderColor: theme.colors.primary[500], borderWidth: 2 },
              ]}
              onPress={() => setVehicleType(option.value)}
            >
              <Ionicons
                name={option.icon as any}
                size={28}
                color={vehicleType === option.value ? theme.colors.primary[500] : theme.colors.textSecondary}
              />
              <Text style={[
                styles.vehicleLabel,
                { color: vehicleType === option.value ? theme.colors.primary[500] : theme.colors.textSecondary },
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Vehicle plate */}
        {(vehicleType === 'moto' || vehicleType === 'voiture') && (
          <>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Plaque d'immatriculation
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.colors.cardBackground, color: theme.colors.text },
              ]}
              value={vehiclePlate}
              onChangeText={setVehiclePlate}
              placeholder="Ex: TG 1234 AB"
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="characters"
            />
          </>
        )}

        {/* License number */}
        {vehicleType === 'moto' || vehicleType === 'voiture' ? (
          <>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Numéro de permis (optionnel)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.colors.cardBackground, color: theme.colors.text },
              ]}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="Numéro de permis de conduire"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </>
        ) : null}

        {/* Info notice */}
        <View style={[styles.notice, { backgroundColor: theme.colors.info + '20' }]}>
          <Ionicons name="information-circle" size={20} color={theme.colors.info} />
          <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
            Les modifications de documents (permis, carte d'identité) doivent être vérifiées par l'équipe. Contactez le support pour mettre à jour ces informations.
          </Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.colors.primary[500] }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  vehicleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  vehicleOption: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
    marginRight: '2%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vehicleLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  notice: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 12,
    lineHeight: 18,
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default DriverProfileEditScreen
