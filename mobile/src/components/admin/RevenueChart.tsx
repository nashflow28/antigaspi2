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

  // Dark mode adaptive colors
  const surfaceColor = theme.isDark ? theme.colors.neutral[800] : theme.colors.surface.light
  const labelColorValue = theme.isDark ? 'rgba(156, 163, 175, 1)' : 'rgba(107, 114, 128, 1)'

  // Filter labels to show only every Nth to prevent overlap
  const labelInterval = Math.ceil(labels.length / 6) // Show max ~6 labels
  const filteredLabels = labels.map((label, index) =>
    index % labelInterval === 0 ? label.slice(0, 5) : '' // Show short date format
  )

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
          labels: filteredLabels,
          datasets: [
            {
              data,
              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Primary green
              strokeWidth: 2,
            },
          ],
        }}
        width={screenWidth}
        height={220}
        chartConfig={{
          backgroundColor: surfaceColor,
          backgroundGradientFrom: surfaceColor,
          backgroundGradientTo: surfaceColor,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          labelColor: () => labelColorValue,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: theme.colors.primary[500],
          },
          propsForBackgroundLines: {
            strokeDasharray: '5 5', // dashed lines for better readability
            stroke: theme.isDark ? theme.colors.neutral[600] : theme.colors.border,
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
