import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import type { ListMetersQuery } from '../api/contract'

export const qk = {
  facilities: ['facilities'] as const,
  meters: (q: ListMetersQuery) => ['meters', q] as const,
  meter: (id: string) => ['meter', id] as const,
  audit: (id: string) => ['audit', id] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
  dailyRecords: ['daily-records'] as const,
}

export function useFacilities() {
  return useQuery({ queryKey: qk.facilities, queryFn: () => api.listFacilities() })
}

export function useMeters(query: ListMetersQuery) {
  return useQuery({
    queryKey: qk.meters(query),
    queryFn: () => api.listMeters(query),
    placeholderData: (prev) => prev,
  })
}

export function useMeter(id: string) {
  return useQuery({
    queryKey: qk.meter(id),
    queryFn: () => api.getMeter(id),
    enabled: !!id,
  })
}

export function useAudit(id: string) {
  return useQuery({
    queryKey: qk.audit(id),
    queryFn: () => api.listAudit(id),
    enabled: !!id,
  })
}

export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: qk.notifications(userId ?? 'none'),
    queryFn: () => api.listNotifications(userId ?? 'none'),
    enabled: !!userId,
    refetchInterval: 30_000,
  })
}

export function useDailyRecords() {
  return useQuery({
    queryKey: qk.dailyRecords,
    queryFn: () => api.listDailyRecords(),
  })
}

export function invalidateDailyRecords(client: ReturnType<typeof useQueryClient>) {
  client.invalidateQueries({ queryKey: qk.dailyRecords })
}

export function invalidateMeter(client: ReturnType<typeof useQueryClient>, id?: string) {
  client.invalidateQueries({ queryKey: ['meters'] })
  client.invalidateQueries({ queryKey: ['notifications'] })
  if (id) {
    client.invalidateQueries({ queryKey: ['meter', id] })
    client.invalidateQueries({ queryKey: ['audit', id] })
  }
}