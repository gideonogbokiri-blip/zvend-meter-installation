export const ROLES = ['Secretary', 'FieldTechnician', 'GM', 'MD', 'IT'] as const
export type Role = (typeof ROLES)[number]

export const STATUSES = [
  'PendingSecretaryConfirm',
  'PendingGM',
  'PendingMD',
  'PendingIT',
  'Completed',
  'Rejected',
] as const
export type MeterStatus = (typeof STATUSES)[number]

export interface User {
  id: string
  fullName: string
  role: Role
  email: string
  phone?: string
}

export interface Facility {
  id: string
  name: string
  location: string
  active: boolean
}

export interface MeterInstallation {
  id: string
  officialMeterNumber: string
  facilityId: string
  facilityName: string
  status: MeterStatus
  scannedMeterNumber?: string
  gpsLatitude?: number
  gpsLongitude?: number
  gpsAccuracy?: number
  installationAddress?: string
  fieldTechnicianName?: string
  customerName?: string
  customerPhone?: string
  activationCode?: string
  clearCode?: string
  tamperCode?: string
  completedAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  rejectionReason?: string
  itNotes?: string
  profileConfirmed?: boolean
}

export interface RecordedMeter {
  id: string
  official_meter_number: string
  facility_name?: string
  customer_name?: string
  customer_phone?: string
  installation_address?: string
  field_technician_name?: string
  activation_code?: string
  clear_code?: string
  tamper_code?: string
  completed_at?: string
}

export interface DailyRecord {
  id: string
  recordDate: string
  meters: RecordedMeter[]
  createdBy?: string
  createdByName?: string
  createdAt: string
  updatedAt: string
}

export interface AuditEntry {
  id: string
  meterActivationId: string
  userId: string
  userName: string
  userRole: Role
  action: string
  timestamp: string
  notes?: string
}

export interface AppNotification {
  id: string
  userId: string
  title: string
  body: string
  meterId?: string
  read: boolean
  createdAt: string
}
