import type {
  AppNotification,
  AuditEntry,
  DailyRecord,
  Facility,
  MeterInstallation,
  MeterStatus,
  User,
} from '../types'

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResult {
  token: string
  user: User
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export interface UpdateProfileInput {
  fullName?: string
  phone?: string
}

export interface CreateFacilityInput {
  name: string
  location: string
  active: boolean
}

export interface AddToInventoryResult {
  created: MeterInstallation[]
  errors: { meterNumber: string; error: string }[]
}

export interface AddToInventoryInput {
  meterNumbers: string[]
}

export interface ClaimMeterInput {
  scannedMeterNumber: string
  facilityId: string
  gpsLatitude: number
  gpsLongitude: number
  gpsAccuracy?: number
  installationAddress: string
  customerName: string
  customerPhone: string
}

export interface RejectInput {
  reason: string
}

export interface ItCompleteInput {
  profileConfirmed: boolean
  activationCode?: string
  clearCode?: string
  tamperCode?: string
  notes?: string
}

export interface ListMetersQuery {
  status?: MeterStatus
  facilityId?: string
  search?: string
}

export interface ZvendApi {
  login(input: LoginInput): Promise<LoginResult>
  me(token: string): Promise<User>
  changePassword(input: ChangePasswordInput): Promise<void>
  updateProfile(input: UpdateProfileInput): Promise<User>
  listFacilities(): Promise<Facility[]>
  createFacility(input: CreateFacilityInput): Promise<Facility>
  listMeters(query: ListMetersQuery): Promise<MeterInstallation[]>
  getMeter(id: string): Promise<MeterInstallation>
  addToInventory(input: AddToInventoryInput, userId: string): Promise<AddToInventoryResult>
  approveInventory(id: string, userId: string): Promise<MeterInstallation>
  claimMeter(id: string, userId: string): Promise<MeterInstallation>
  submitFieldInstall(id: string, input: ClaimMeterInput, userId: string): Promise<MeterInstallation>
  secretaryConfirm(id: string, userId: string): Promise<MeterInstallation>
  gmForward(id: string, userId: string): Promise<MeterInstallation>
  gmReject(id: string, input: RejectInput, userId: string): Promise<MeterInstallation>
  mdApprove(id: string, userId: string): Promise<MeterInstallation>
  mdReject(id: string, input: RejectInput, userId: string): Promise<MeterInstallation>
  itComplete(id: string, input: ItCompleteInput, userId: string): Promise<MeterInstallation>
  resendToGM(id: string, userId: string): Promise<MeterInstallation>
  listAudit(meterId: string): Promise<AuditEntry[]>
  listNotifications(userId: string): Promise<AppNotification[]>
  markNotificationRead(id: string): Promise<void>
  listDailyRecords(): Promise<DailyRecord[]>
  createDailyRecord(date?: string): Promise<DailyRecord>
}
