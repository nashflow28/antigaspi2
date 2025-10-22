// Temporary stub - re-export 2025 components until dashboard components are implemented
import Card from '../2025/Card.vue'
import Button from '../2025/Button.vue'
import Badge from '../2025/Badge.vue'

// Re-export with dashboard-specific names
export { Card as DashboardCard }
export { Card as StatCard }
export { Card as DataTableCard }
export { Button as DashboardButton }
export { Badge as DashboardBadge }

// Simple stub components
export const DashboardHeader = Card
export const StatCardGrid = Card
export const DashboardFilterBar = Card
