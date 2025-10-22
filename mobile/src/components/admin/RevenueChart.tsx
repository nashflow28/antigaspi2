import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { useTheme } from '../../theme'
import { Typography } from '../2025'

interface RevenueChartProps {
  labels: string[]
  data: number[]
  title?: string
}

const RevenueChart: React.FC<RevenueChartProps> = ({ labels, data, title = 'Revenus' }) => {
  const theme = useTheme()
  const screenWidth = Dimensions.get('window').width - 32

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="body" color="secondary">
          Aucune donnée disponible
        </Typography>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {title && (
        <Typography variant="h4" weight="semibold" style={styles.title}>
          {title}
        </Typography>
      )}
      <LineChart
        data={{
          labels,
          datasets: [
            {
              data,
              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Primary green
              strokeWidth: 3,
            },
          ],
        }}
        width={screenWidth}
        height={220}
        chartConfig={{
          backgroundColor: theme.colors.background,
          backgroundGradientFrom: theme.colors.surface.light,
          backgroundGradientTo: theme.colors.surface.light,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: theme.colors.primary[500],
          },
          propsForBackgroundLines: {
            strokeDasharray: '', // solid lines
            stroke: theme.colors.border,
            strokeWidth: 1,
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
})

export default RevenueChart
