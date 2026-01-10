// Admin sidebar composable - wrapper around useDashboardLayout
import { useDashboardLayout } from './useDashboardLayout'

export const useSidebarAdmin = () => {
  const { sidebar } = useDashboardLayout('admin')
  return { sidebar }
}

export default useSidebarAdmin
