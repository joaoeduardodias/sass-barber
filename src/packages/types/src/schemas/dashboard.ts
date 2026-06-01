export interface DashboardStats {
  revenue: number
  revenueDelta: number
  avgTicket: number
  avgTicketDelta: number
  completedCount: number
  completedCountDelta: number
  topServices: Array<{
    serviceId: string
    name: string
    count: number
    revenue: number
  }>
}
