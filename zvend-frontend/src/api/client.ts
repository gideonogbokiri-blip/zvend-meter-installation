import axios from 'axios'
import type {
  ZvendApi,
  LoginInput,
  LoginResult,
  ChangePasswordInput,
  UpdateProfileInput,
  CreateFacilityInput,
  AddToInventoryInput,
  AddToInventoryResult,
  ClaimMeterInput,
  RejectInput,
  ItCompleteInput,
  ListMetersQuery,
} from './contract'
import type {
  AppNotification,
  AuditEntry,
  DailyRecord,
  Facility,
  MeterInstallation,
  User,
} from '../types'

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? 'https://zvend-meter-installation.onrender.com'
    : 'http://localhost:3000')

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

export function setAuthToken(token: string | null) {
  if (token) {
    http.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete http.defaults.headers.common['Authorization']
  }
}

function q(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ''
  ).map(([k, v]) => [k, v as string])
  if (entries.length === 0) return ''
  return '?' + new URLSearchParams(entries).toString()
}

export const clientApi: ZvendApi = {
  async login(input: LoginInput): Promise<LoginResult> {
    const { data } = await http.post<LoginResult>('/api/auth/login', input)
    setAuthToken(data.token)
    return data
  },

  async me(token: string): Promise<User> {
    setAuthToken(token)
    const { data } = await http.get<User>('/api/auth/me')
    return data
  },

  async changePassword(input: ChangePasswordInput): Promise<void> {
    const { data } = await http.post<{ message: string }>(
      '/api/auth/change-password',
      input
    )
    void data
  },

  async updateProfile(input: UpdateProfileInput): Promise<User> {
    const { data } = await http.patch<User>('/api/auth/profile', input)
    return data
  },

  async listFacilities(): Promise<Facility[]> {
    const { data } = await http.get<Facility[]>('/api/facilities')
    return data
  },

  async createFacility(input: CreateFacilityInput): Promise<Facility> {
    const { data } = await http.post<Facility>('/api/facilities', input)
    return data
  },

  async listMeters(query: ListMetersQuery): Promise<MeterInstallation[]> {
    const qs = q({
      status: query.status,
      facilityId: query.facilityId,
      search: query.search,
    })
    const { data } = await http.get<MeterInstallation[]>(
      `/api/meters${qs}`
    )
    return data
  },

  async getMeter(id: string): Promise<MeterInstallation> {
    const { data } = await http.get<MeterInstallation>(`/api/meters/${id}`)
    return data
  },

  async addToInventory(
    input: AddToInventoryInput,
    _userId: string
  ): Promise<AddToInventoryResult> {
    const { data } = await http.post<AddToInventoryResult>(
      '/api/meters/inventory',
      input
    )
    return data
  },

  async approveInventory(
    id: string,
    _userId: string
  ): Promise<MeterInstallation> {
    const { data } = await http.post<MeterInstallation>(
      `/api/meters/${id}/inventory-approve`
    )
    return data
  },

  async claimMeter(id: string, _userId: string): Promise<MeterInstallation> {
    const { data } = await http.post<MeterInstallation>(
      `/api/meters/${id}/claim`
    )
    return data
  },

  async submitFieldInstall(
    id: string,
    input: ClaimMeterInput,
    _userId: string
  ): Promise<MeterInstallation> {
    const { data } = await http.post<MeterInstallation>(
      `/api/meters/${id}/submit-field`,
      input
    )
    return data
  },

  async secretaryConfirm(
    id: string,
    _userId: string
  ): Promise<MeterInstallation> {
    const { data } = await http.post<MeterInstallation>(
      `/api/meters/${id}/confirm`
    )
    return data
  },

  async gmForward(id: string, _userId: string): Promise<MeterInstallation> {
    const { data } = await http.post<MeterInstallation>(
      `/api/meters/${id}/forward`
    )
    return data
  },

  async gmReject(
    id: string,
    input: RejectInput,
    _userId: string
  ): Promise<MeterInstallation> {
    const { data } = await http.post<MeterInstallation>(
      `/api/meters/${id}/gm-reject`,
      input
    )
    return data
  },

  async mdApprove(id: string, _userId: string): Promise<MeterInstallation> {
    const { data } = await http.post<MeterInstallation>(
      `/api/meters/${id}/approve`
    )
    return data
  },

  async mdReject(
    id: string,
    input: RejectInput,
    _userId: string
  ): Promise<MeterInstallation> {
    const { data } = await http.post<MeterInstallation>(
      `/api/meters/${id}/md-reject`,
      input
    )
    return data
  },

  async itComplete(
    id: string,
    input: ItCompleteInput,
    _userId: string
  ): Promise<MeterInstallation> {
    const { data } = await http.post<MeterInstallation>(
      `/api/meters/${id}/it-complete`,
      input
    )
    return data
  },

  async resendToGM(
    id: string,
    _userId: string
  ): Promise<MeterInstallation> {
    const { data } = await http.post<MeterInstallation>(
      `/api/meters/${id}/resend`
    )
    return data
  },

  async listAudit(meterId: string): Promise<AuditEntry[]> {
    const { data } = await http.get<AuditEntry[]>(`/api/audit/${meterId}`)
    return data
  },

  async listNotifications(userId: string): Promise<AppNotification[]> {
    const { data } = await http.get<AppNotification[]>(
      '/api/notifications'
    )
    return data.filter((n) => n.userId === userId)
  },

  async markNotificationRead(id: string): Promise<void> {
    await http.patch(`/api/notifications/${id}/read`)
  },

  async listDailyRecords(): Promise<DailyRecord[]> {
    const { data } = await http.get<DailyRecord[]>('/api/records')
    return data
  },

  async createDailyRecord(date?: string): Promise<DailyRecord> {
    const { data } = await http.post<DailyRecord>('/api/records', { date })
    return data
  },
}
