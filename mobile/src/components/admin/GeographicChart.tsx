import React from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { BarChart } from 'react-native-chart-kit'
import { useTheme } from '../../theme'
import { Typography } from '../2025'

interface GeographicData {
  city: string
  revenue: number
  percentage: number
}

interface GeographicChartProps {
  data: GeographicData[]
  title?: string
}

const GeographicChart: React.FC<GeographicChartProps> = ({ data, title = 'Répartition géographique' }) => {
  const theme = useTheme()
  const screenWidth = Dimensions.get('window').width - 32

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Typography variant="body" color="secondary">
          Aucune donnée géographique disponible
        </Typography>
      </View>
    )
  }

  // Take top 5 cities
  const topCities = data.slice(0, 5)

  return (
    <View style={styles.container}>
      {title && (
        <Typography variant="h4" weight="semibold" style={styles.title}>
          {title}
        </Typography>
      )}
      <BarChart
        data={{
          labels: topCities.map((d) => d.city.slice(0, 10)), // Limit label length
          datasets: [
            {
              data: topCities.map((d) => d.revenue),
            },
          ],
        }}
        width={screenWidth}
        height={220}
        yAxisLabel=""
        yAxisSuffix=" XOF"
        chartConfig={{
          backgroundColor: theme.colors.background,
          backgroundGradientFrom: theme.colors.surface.light,
          backgroundGradientTo: theme.colors.surface.light,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, // Orange accent
          labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: theme.colors.border,
            strokeWidth: 1,
          },
          barPercentage: 0.7,
        }}
        style={styles.chart}
        showValuesOnTopOfBars
        fromZero
      />
      <View style={styles.legend}>
        {topCities.map((city, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: theme.colors.accent.orange }]} />
            <Typography variant="caption" color="secondary">
              {city.city}: {city.percentage.toFixed(1)}%
            </Typography>
          </View>
        ))}
      </View>
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
  legend: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
})

export default GeographicChart
