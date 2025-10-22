import React from 'react'
import { render } from '@testing-library/react-native'
import { Dimensions } from 'react-native'
import GeographicChart from './GeographicChart'

// Mock dependencies
jest.mock('react-native-chart-kit', () => ({
  BarChart: 'BarChart',
}))
jest.mock('../../theme', () => {
  const { mockUseTheme } = require('../../__mocks__/themeMock')
  return {
    useTheme: mockUseTheme,
  }
})

// Mock Dimensions
jest.spyOn(Dimensions, 'get').mockReturnValue({
  width: 400,
  height: 800,
  scale: 2,
  fontScale: 1,
})

const mockData = [
  { city: 'Lomé', revenue: 80000, percentage: 53.3 },
  { city: 'Kara', revenue: 40000, percentage: 26.7 },
  { city: 'Sokodé', revenue: 30000, percentage: 20.0 },
  { city: 'Atakpamé', revenue: 15000, percentage: 10.0 },
  { city: 'Dapaong', revenue: 10000, percentage: 6.7 },
]

describe('GeographicChart', () => {
  // ============ RENDERING TESTS ============

  test('should render chart with data', () => {
    const { getByText } = render(<GeographicChart data={mockData} />)
    expect(getByText('Répartition géographique')).toBeTruthy()
  })

  test('should render with custom title', () => {
    const { getByText } = render(<GeographicChart data={mockData} title="Distribution des ventes" />)
    expect(getByText('Distribution des ventes')).toBeTruthy()
  })

  test('should render default title when not provided', () => {
    const { getByText } = render(<GeographicChart data={mockData} />)
    expect(getByText('Répartition géographique')).toBeTruthy()
  })

  // ============ EMPTY STATE TESTS ============

  test('should display empty state when no data', () => {
    const { getByText } = render(<GeographicChart data={[]} />)
    expect(getByText('Aucune donnée géographique disponible')).toBeTruthy()
  })

  test('should not render chart when data is empty', () => {
    const { queryByTestId } = render(<GeographicChart data={[]} />)
    // Chart component should not be present
    expect(queryByTestId('bar-chart')).toBeNull()
  })

  // ============ DATA DISPLAY TESTS ============

  test('should display top 5 cities only', () => {
    const manyData = [
      { city: 'City1', revenue: 100, percentage: 10 },
      { city: 'City2', revenue: 90, percentage: 9 },
      { city: 'City3', revenue: 80, percentage: 8 },
      { city: 'City4', revenue: 70, percentage: 7 },
      { city: 'City5', revenue: 60, percentage: 6 },
      { city: 'City6', revenue: 50, percentage: 5 },
      { city: 'City7', revenue: 40, percentage: 4 },
    ]

    const { getByText, queryByText } = render(<GeographicChart data={manyData} />)

    // Top 5 should be present
    expect(getByText(/City1/)).toBeTruthy()
    expect(getByText(/City5/)).toBeTruthy()

    // 6th and 7th should not be present
    expect(queryByText(/City6/)).toBeNull()
    expect(queryByText(/City7/)).toBeNull()
  })

  test('should display city names in legend', () => {
    const { getByText } = render(<GeographicChart data={mockData} />)
    expect(getByText(/Lomé/)).toBeTruthy()
    expect(getByText(/Kara/)).toBeTruthy()
    expect(getByText(/Sokodé/)).toBeTruthy()
  })

  test('should display percentages in legend', () => {
    const { getByText } = render(<GeographicChart data={mockData} />)
    expect(getByText(/53.3%/)).toBeTruthy()
    expect(getByText(/26.7%/)).toBeTruthy()
    expect(getByText(/20.0%/)).toBeTruthy()
  })

  test('should format percentages to 1 decimal place', () => {
    const dataWithDecimals = [
      { city: 'Test City', revenue: 1000, percentage: 12.3456789 },
    ]
    const { getByText } = render(<GeographicChart data={dataWithDecimals} />)
    expect(getByText(/12.3%/)).toBeTruthy()
    expect(getByText(/12.3456789%/)).toBeFalsy()
  })

  // ============ CHART CONFIGURATION TESTS ============

  test('should calculate chart width based on screen dimensions', () => {
    // Screen width is 400, minus 32px padding = 368px
    const { UNSAFE_getByType } = render(<GeographicChart data={mockData} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    expect(chart.props.width).toBe(368)
  })

  test('should set chart height to 220', () => {
    const { UNSAFE_getByType } = render(<GeographicChart data={mockData} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    expect(chart.props.height).toBe(220)
  })

  test('should use XOF currency suffix', () => {
    const { UNSAFE_getByType } = render(<GeographicChart data={mockData} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    expect(chart.props.yAxisSuffix).toBe(' XOF')
  })

  test('should have empty yAxisLabel', () => {
    const { UNSAFE_getByType } = render(<GeographicChart data={mockData} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    expect(chart.props.yAxisLabel).toBe('')
  })

  test('should show values on top of bars', () => {
    const { UNSAFE_getByType } = render(<GeographicChart data={mockData} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    expect(chart.props.showValuesOnTopOfBars).toBe(true)
  })

  test('should start chart from zero', () => {
    const { UNSAFE_getByType } = render(<GeographicChart data={mockData} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    expect(chart.props.fromZero).toBe(true)
  })

  // ============ LABEL TRUNCATION TESTS ============

  test('should truncate long city names to 10 characters', () => {
    const dataWithLongName = [
      { city: 'VeryLongCityNameThatExceedsTenCharacters', revenue: 1000, percentage: 100 },
    ]
    const { UNSAFE_getByType } = render(<GeographicChart data={dataWithLongName} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    // Label should be truncated to first 10 characters
    expect(chart.props.data.labels[0]).toBe('VeryLongCi')
  })

  test('should not truncate short city names', () => {
    const dataWithShortName = [
      { city: 'Lomé', revenue: 1000, percentage: 100 },
    ]
    const { UNSAFE_getByType } = render(<GeographicChart data={dataWithShortName} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    expect(chart.props.data.labels[0]).toBe('Lomé')
  })

  // ============ DATA STRUCTURE TESTS ============

  test('should pass correct data structure to BarChart', () => {
    const { UNSAFE_getByType } = render(<GeographicChart data={mockData} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    expect(chart.props.data).toEqual({
      labels: ['Lomé', 'Kara', 'Sokodé', 'Atakpamé', 'Dapaong'],
      datasets: [
        {
          data: [80000, 40000, 30000, 15000, 10000],
        },
      ],
    })
  })

  test('should handle single city data', () => {
    const singleCityData = [
      { city: 'Lomé', revenue: 50000, percentage: 100 },
    ]
    const { UNSAFE_getByType } = render(<GeographicChart data={singleCityData} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    expect(chart.props.data.labels).toEqual(['Lomé'])
    expect(chart.props.data.datasets[0].data).toEqual([50000])
  })

  // ============ LEGEND TESTS ============

  test('should render legend with colored dots', () => {
    const { UNSAFE_getAllByType } = render(<GeographicChart data={mockData} />)

    // Check for View components with background color (legend dots)
    const views = UNSAFE_getAllByType('View' as any)
    const legendDots = views.filter((view: any) =>
      view.props.style &&
      Array.isArray(view.props.style) &&
      view.props.style.some((s: any) => s && s.width === 12 && s.height === 12)
    )

    // Should have 5 legend dots (one for each city)
    expect(legendDots.length).toBeGreaterThanOrEqual(5)
  })

  test('should display all cities in legend even if chart shows top 5', () => {
    const { getByText } = render(<GeographicChart data={mockData} />)

    mockData.slice(0, 5).forEach(city => {
      expect(getByText(new RegExp(city.city))).toBeTruthy()
    })
  })

  // ============ STYLE TESTS ============

  test('should apply rounded corners to chart', () => {
    const { UNSAFE_getByType } = render(<GeographicChart data={mockData} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    expect(chart.props.chartConfig.style.borderRadius).toBe(16)
  })

  test('should use orange color for bars', () => {
    const { UNSAFE_getByType } = render(<GeographicChart data={mockData} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    // Color function should return orange with opacity
    const colorFunc = chart.props.chartConfig.color
    expect(colorFunc(1)).toContain('245, 158, 11') // RGB for orange
  })

  test('should set bar width to 70% of available space', () => {
    const { UNSAFE_getByType } = render(<GeographicChart data={mockData} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    expect(chart.props.chartConfig.barPercentage).toBe(0.7)
  })

  // ============ EDGE CASE TESTS ============

  test('should handle zero revenue values', () => {
    const dataWithZero = [
      { city: 'City1', revenue: 0, percentage: 0 },
      { city: 'City2', revenue: 1000, percentage: 100 },
    ]
    const { UNSAFE_getByType } = render(<GeographicChart data={dataWithZero} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    expect(chart.props.data.datasets[0].data).toContain(0)
  })

  test('should handle very large revenue values', () => {
    const dataWithLargeValues = [
      { city: 'City1', revenue: 10000000, percentage: 100 },
    ]
    const { UNSAFE_getByType } = render(<GeographicChart data={dataWithLargeValues} />)
    const chart = UNSAFE_getByType('BarChart' as any)

    expect(chart.props.data.datasets[0].data).toContain(10000000)
  })

  test('should handle decimal percentage values', () => {
    const dataWithDecimals = [
      { city: 'City1', revenue: 1000, percentage: 33.333333 },
    ]
    const { getByText } = render(<GeographicChart data={dataWithDecimals} />)

    // Should round to 1 decimal place
    expect(getByText(/33.3%/)).toBeTruthy()
  })
})
