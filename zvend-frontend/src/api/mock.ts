import type { ZvendApi } from './contract'
import type {
  AppNotification,
  AuditEntry,
  Facility,
  MeterInstallation,
  MeterStatus,
  User,
} from '../types'
import { METER_NUMBER_PATTERN, normalizeMeterNumber } from '../lib/meterNumber'

let seq = 100

const uid = (prefix: string) => `${prefix}-${++seq}`

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms))

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v))

const users: User[] = [
  { id: 'u-sec', fullName: 'Amara Okafor', role: 'Secretary', email: 'amara@zvend.com', phone: '0801 000 1111' },
  { id: 'u-tech', fullName: 'Tunde Bakare', role: 'FieldTechnician', email: 'tunde@zvend.com', phone: '0802 000 2222' },
  { id: 'u-gm', fullName: 'Grace Alabi', role: 'GM', email: 'grace@zvend.com', phone: '0803 000 3333' },
  { id: 'u-md', fullName: 'Yusuf Bello', role: 'MD', email: 'yusuf@zvend.com', phone: '0804 000 4444' },
  { id: 'u-it', fullName: 'Chidi Eze', role: 'IT', email: 'chidi@zvend.com', phone: '0805 000 5555' },
]

const facilities: Facility[] = [
  { id: 'f1', name: 'Lagos HQ', location: 'Victoria Island, Lagos', active: true },
  { id: 'f2', name: 'Ikeja Depot', location: 'Ikeja, Lagos', active: true },
  { id: 'f3', name: 'Abuja Office', location: 'Wuse, Abuja', active: true },
  { id: 'f4', name: 'Port Harcourt Branch', location: 'PH, Rivers', active: false },
]

const now = () => new Date().toISOString()

const daysAgo = (d: number, h = 0, m = 0) => {
  const t = new Date()
  t.setDate(t.getDate() - d)
  t.setHours(t.getHours() - h)
  t.setMinutes(t.getMinutes() - m)
  return t.toISOString()
}

const meters: MeterInstallation[] = [
  {
    id: 'm2',
    officialMeterNumber: '58100000002',
    facilityId: 'f1',
    facilityName: 'Lagos HQ',
    status: 'PendingSecretaryConfirm',
    scannedMeterNumber: '58100000002',
    gpsLatitude: 6.4281,
    gpsLongitude: 3.4219,
    gpsAccuracy: 12,
    installationAddress: '14B Adetokunbo Ademola Street, VI, Lagos',
    fieldTechnicianName: 'Tunde Bakare',
    customerName: 'Oluwatobi Adeyemi',
    customerPhone: '0803 456 7001',
    createdBy: 'u-tech',
    createdAt: daysAgo(4),
    updatedAt: daysAgo(1, 3),
  },
  {
    id: 'm3',
    officialMeterNumber: '58100000003',
    facilityId: 'f2',
    facilityName: 'Ikeja Depot',
    status: 'PendingGM',
    scannedMeterNumber: '58100000003',
    gpsLatitude: 6.6018,
    gpsLongitude: 3.3515,
    gpsAccuracy: 9,
    installationAddress: '22 Awolowo Way, Ikeja, Lagos',
    fieldTechnicianName: 'Tunde Bakare',
    customerName: 'Ngozi Eze',
    customerPhone: '0805 234 8112',
    createdBy: 'u-tech',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(0, 20),
  },
  {
    id: 'm4',
    officialMeterNumber: '58100000004',
    facilityId: 'f2',
    facilityName: 'Ikeja Depot',
    status: 'PendingMD',
    scannedMeterNumber: '58100000004',
    gpsLatitude: 6.6039,
    gpsLongitude: 3.3717,
    gpsAccuracy: 14,
    installationAddress: '3 Allen Avenue, Ikeja, Lagos',
    fieldTechnicianName: 'Tunde Bakare',
    customerName: 'Ibrahim Musa',
    customerPhone: '0703 812 9003',
    createdBy: 'u-tech',
    createdAt: daysAgo(8),
    updatedAt: daysAgo(0, 8),
  },
  {
    id: 'm5',
    officialMeterNumber: '58100000005',
    facilityId: 'f3',
    facilityName: 'Abuja Office',
    status: 'PendingIT',
    scannedMeterNumber: '58100000005',
    gpsLatitude: 9.0579,
    gpsLongitude: 7.4951,
    gpsAccuracy: 10,
    installationAddress: 'Plot 45, Gwarimpa Road, Wuse, Abuja',
    fieldTechnicianName: 'Tunde Bakare',
    customerName: 'Blessing Chukwu',
    customerPhone: '0814 567 2134',
    createdBy: 'u-tech',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(0, 5),
  },
  {
    id: 'm6',
    officialMeterNumber: '58100000006',
    facilityId: 'f3',
    facilityName: 'Abuja Office',
    status: 'Completed',
    scannedMeterNumber: '58100000006',
    gpsLatitude: 9.0468,
    gpsLongitude: 7.5189,
    gpsAccuracy: 11,
    installationAddress: '8 Ibrahim Babangida Way, Abuja',
    fieldTechnicianName: 'Tunde Bakare',
    customerName: 'Segun Ajayi',
    customerPhone: '0809 876 5015',
    activationCode: '4K8F-2M7Q',
    profileConfirmed: true,
    itNotes: 'Profiled on ST-12 grid, relay ok.',
    createdBy: 'u-tech',
    createdAt: daysAgo(12),
    updatedAt: daysAgo(0, 2),
  },
  {
    id: 'm7',
    officialMeterNumber: '58100000007',
    facilityId: 'f1',
    facilityName: 'Lagos HQ',
    status: 'Completed',
    scannedMeterNumber: '58100000007',
    gpsLatitude: 6.4375,
    gpsLongitude: 3.4475,
    gpsAccuracy: 8,
    installationAddress: '9B Admiralty Way, Lekki, Lagos',
    fieldTechnicianName: 'Tunde Bakare',
    customerName: 'Fatima Bello',
    customerPhone: '0706 345 1206',
    activationCode: '7P2T-9W4R',
    profileConfirmed: true,
    createdBy: 'u-tech',
    createdAt: daysAgo(20),
    updatedAt: daysAgo(5),
  },
  {
    id: 'm8',
    officialMeterNumber: '58100000008',
    facilityId: 'f2',
    facilityName: 'Ikeja Depot',
    status: 'Rejected',
    scannedMeterNumber: '58100000008',
    gpsLatitude: 6.5946,
    gpsLongitude: 3.3453,
    gpsAccuracy: 16,
    installationAddress: 'Unknown building, near Oba Akran',
    fieldTechnicianName: 'Tunde Bakare',
    customerName: 'Kunle Ojo',
    customerPhone: '0802 655 7788',
    createdBy: 'u-tech',
    createdAt: daysAgo(14),
    updatedAt: daysAgo(1, 6),
    rejectionReason: 'Installation address is incomplete. Field tech must capture the exact building number before resubmission.',
  },
]

const audits: AuditEntry[] = [
  { id: uid('a'), meterActivationId: 'm2', userId: 'u-tech', userName: 'Tunde Bakare', userRole: 'FieldTechnician', action: 'Meter registered from field scan', timestamp: daysAgo(4), notes: 'GPS captured at 6.4281, 3.4219' },
  { id: uid('a'), meterActivationId: 'm3', userId: 'u-tech', userName: 'Tunde Bakare', userRole: 'FieldTechnician', action: 'Meter registered from field scan', timestamp: daysAgo(6), notes: 'GPS captured at 6.5102, 3.3813' },
  { id: uid('a'), meterActivationId: 'm3', userId: 'u-sec', userName: 'Amara Okafor', userRole: 'Secretary', action: 'Field data confirmed, sent to GM', timestamp: daysAgo(0, 18) },
  { id: uid('a'), meterActivationId: 'm4', userId: 'u-tech', userName: 'Tunde Bakare', userRole: 'FieldTechnician', action: 'Meter registered from field scan', timestamp: daysAgo(8), notes: 'GPS captured at 6.5247, 3.3792' },
  { id: uid('a'), meterActivationId: 'm4', userId: 'u-sec', userName: 'Amara Okafor', userRole: 'Secretary', action: 'Field data confirmed, sent to GM', timestamp: daysAgo(0, 8, 1) },
  { id: uid('a'), meterActivationId: 'm4', userId: 'u-gm', userName: 'Grace Alabi', userRole: 'GM', action: 'Reviewed and forwarded to MD', timestamp: daysAgo(0, 8) },
  { id: uid('a'), meterActivationId: 'm5', userId: 'u-tech', userName: 'Tunde Bakare', userRole: 'FieldTechnician', action: 'Meter registered from field scan', timestamp: daysAgo(10), notes: 'GPS captured at 6.4531, 3.3958' },
  { id: uid('a'), meterActivationId: 'm5', userId: 'u-sec', userName: 'Amara Okafor', userRole: 'Secretary', action: 'Field data confirmed, sent to GM', timestamp: daysAgo(0, 5, 2) },
  { id: uid('a'), meterActivationId: 'm5', userId: 'u-gm', userName: 'Grace Alabi', userRole: 'GM', action: 'Reviewed and forwarded to MD', timestamp: daysAgo(0, 5, 1) },
  { id: uid('a'), meterActivationId: 'm5', userId: 'u-md', userName: 'Yusuf Bello', userRole: 'MD', action: 'Approved for IT action', timestamp: daysAgo(0, 5) },
  { id: uid('a'), meterActivationId: 'm6', userId: 'u-tech', userName: 'Tunde Bakare', userRole: 'FieldTechnician', action: 'Meter registered from field scan', timestamp: daysAgo(12), notes: 'GPS captured at 6.4689, 3.4312' },
  { id: uid('a'), meterActivationId: 'm6', userId: 'u-sec', userName: 'Amara Okafor', userRole: 'Secretary', action: 'Field data confirmed, sent to GM', timestamp: daysAgo(1, 8) },
  { id: uid('a'), meterActivationId: 'm6', userId: 'u-gm', userName: 'Grace Alabi', userRole: 'GM', action: 'Reviewed and forwarded to MD', timestamp: daysAgo(1, 6) },
  { id: uid('a'), meterActivationId: 'm6', userId: 'u-md', userName: 'Yusuf Bello', userRole: 'MD', action: 'Approved for IT action', timestamp: daysAgo(1, 4) },
  { id: uid('a'), meterActivationId: 'm6', userId: 'u-it', userName: 'Chidi Eze', userRole: 'IT', action: 'Acted on the task and recorded activation code', timestamp: daysAgo(0, 2), notes: '4K8F-2M7Q' },
  { id: uid('a'), meterActivationId: 'm7', userId: 'u-tech', userName: 'Tunde Bakare', userRole: 'FieldTechnician', action: 'Meter registered from field scan', timestamp: daysAgo(20), notes: 'GPS captured at 6.5174, 3.4102' },
  { id: uid('a'), meterActivationId: 'm7', userId: 'u-sec', userName: 'Amara Okafor', userRole: 'Secretary', action: 'Field data confirmed, sent to GM', timestamp: daysAgo(11) },
  { id: uid('a'), meterActivationId: 'm7', userId: 'u-gm', userName: 'Grace Alabi', userRole: 'GM', action: 'Reviewed and forwarded to MD', timestamp: daysAgo(10) },
  { id: uid('a'), meterActivationId: 'm7', userId: 'u-md', userName: 'Yusuf Bello', userRole: 'MD', action: 'Approved for IT action', timestamp: daysAgo(9) },
  { id: uid('a'), meterActivationId: 'm7', userId: 'u-it', userName: 'Chidi Eze', userRole: 'IT', action: 'Acted on the task and recorded activation code', timestamp: daysAgo(7), notes: '7P2T-9W4R' },
  { id: uid('a'), meterActivationId: 'm7', userId: 'u-sec', userName: 'Amara Okafor', userRole: 'Secretary', action: 'Job closed and archived', timestamp: daysAgo(5) },
  { id: uid('a'), meterActivationId: 'm8', userId: 'u-tech', userName: 'Tunde Bakare', userRole: 'FieldTechnician', action: 'Meter registered from field scan', timestamp: daysAgo(14), notes: 'GPS captured at 6.5946, 3.3453' },
  { id: uid('a'), meterActivationId: 'm8', userId: 'u-sec', userName: 'Amara Okafor', userRole: 'Secretary', action: 'Field data confirmed, sent to GM', timestamp: daysAgo(1, 8) },
  { id: uid('a'), meterActivationId: 'm8', userId: 'u-gm', userName: 'Grace Alabi', userRole: 'GM', action: 'Rejected - incomplete address', timestamp: daysAgo(1, 6), notes: 'Installation address is incomplete. Field tech must capture the exact building number before resubmission.' },
]

const notifications: AppNotification[] = [
  { id: uid('n'), userId: 'u-sec', title: 'Field data awaiting confirmation', body: 'Meter 58100000002 was registered by Tunde Bakare and needs your confirmation.', meterId: 'm2', read: false, createdAt: daysAgo(1, 3) },
  { id: uid('n'), userId: 'u-sec', title: 'IT returned a completed job', body: 'Meter 58100000006 has an activation code and awaits final closure.', meterId: 'm6', read: false, createdAt: daysAgo(0, 2) },
  { id: uid('n'), userId: 'u-gm', title: 'New review request', body: 'Meter 58100000003 is awaiting your review.', meterId: 'm3', read: false, createdAt: daysAgo(0, 18) },
  { id: uid('n'), userId: 'u-md', title: 'New approval request', body: 'Meter 58100000004 was forwarded to you by GM.', meterId: 'm4', read: false, createdAt: daysAgo(0, 8) },
  { id: uid('n'), userId: 'u-it', title: 'Approved job ready', body: 'Meter 58100000005 is approved and ready for profiling.', meterId: 'm5', read: false, createdAt: daysAgo(0, 5) },
]

const findUser = (id: string) => users.find((u) => u.id === id)!

const transition = (id: string, status: MeterStatus, user: User, action: string, notes?: string) => {
  const meter = meters.find((m) => m.id === id)
  if (!meter) throw new Error('Meter not found')
  meter.status = status
  meter.updatedAt = now()
  audits.unshift({
    id: uid('a'),
    meterActivationId: meter.id,
    userId: user.id,
    userName: user.fullName,
    userRole: user.role,
    action,
    timestamp: now(),
    notes,
  })
  return clone(meter)
}

const notify = (userId: string, title: string, body: string, meterId?: string) => {
  notifications.unshift({
    id: uid('n'),
    userId,
    title,
    body,
    meterId,
    read: false,
    createdAt: now(),
  })
}

export const api: ZvendApi = {
  async login(input) {
    await delay()
    const user = users.find((u) => u.email.toLowerCase() === input.email.trim().toLowerCase())
    if (!user || !input.password) throw new Error('Invalid email or password')
    return { token: `mock-${user.id}`, user: clone(user) }
  },

  async me(token) {
    await delay(100)
    const id = token.replace('mock-', '')
    const user = users.find((u) => u.id === id)
    if (!user) throw new Error('Session expired')
    return clone(user)
  },

  async changePassword() {
    await delay(100)
    return
  },

  async listFacilities() {
    await delay()
    return clone(facilities.filter((f) => f.active))
  },

  async createFacility(input) {
    await delay()
    const facility: Facility = { id: uid('f'), ...input }
    facilities.push(facility)
    return clone(facility)
  },

  async listMeters(query) {
    await delay()
    let items = [...meters]
    if (query.status) items = items.filter((m) => m.status === query.status)
    if (query.facilityId) items = items.filter((m) => m.facilityId === query.facilityId)
    if (query.search) {
      const q = query.search.toLowerCase()
      items = items.filter(
        (m) =>
          m.officialMeterNumber.toLowerCase().includes(q) ||
          (m.installationAddress ?? '').toLowerCase().includes(q) ||
          (m.fieldTechnicianName ?? '').toLowerCase().includes(q) ||
          (m.customerName ?? '').toLowerCase().includes(q) ||
          (m.customerPhone ?? '').toLowerCase().includes(q),
      )
    }
    return clone(items)
  },

  async getMeter(id) {
    await delay()
    const meter = meters.find((m) => m.id === id)
    if (!meter) throw new Error('Meter not found')
    return clone(meter)
  },

  async submitScanNew(input, userId) {
    await delay()
    const number = normalizeMeterNumber(input.scannedMeterNumber)
    if (!METER_NUMBER_PATTERN.test(number)) {
      throw new Error('Invalid barcode. Meter number must be 11 digits starting with 5810.')
    }
    if (meters.some((m) => m.officialMeterNumber === number)) {
      throw new Error('A meter with this number is already registered')
    }
    const facility = facilities.find((f) => f.id === input.facilityId)
    if (!facility) throw new Error('Select a valid facility')
    const meter: MeterInstallation = {
      id: uid('m'),
      officialMeterNumber: number,
      scannedMeterNumber: number,
      facilityId: input.facilityId,
      facilityName: facility.name,
      status: 'PendingSecretaryConfirm',
      gpsLatitude: input.gpsLatitude,
      gpsLongitude: input.gpsLongitude,
      gpsAccuracy: input.gpsAccuracy,
      installationAddress: input.installationAddress,
      fieldTechnicianName: input.fieldTechnicianName,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      createdBy: userId,
      createdAt: now(),
      updatedAt: now(),
    }
    meters.unshift(meter)
    const user = findUser(userId)
    audits.unshift({
      id: uid('a'),
      meterActivationId: meter.id,
      userId,
      userName: user.fullName,
      userRole: user.role,
      action: 'Meter registered from field scan',
      timestamp: now(),
      notes: `GPS captured at ${input.gpsLatitude.toFixed(4)}, ${input.gpsLongitude.toFixed(4)}`,
    })
    notify('u-sec', 'Field data awaiting confirmation', `Meter ${meter.officialMeterNumber} was registered by ${input.fieldTechnicianName} and needs your confirmation.`, meter.id)
    return clone(meter)
  },

  async secretaryConfirm(id, userId) {
    await delay()
    const meter = meters.find((m) => m.id === id)
    if (!meter) throw new Error('Meter not found')
    const user = findUser(userId)
    const result = transition(id, 'PendingGM', user, 'Field data confirmed, sent to GM')
    notify('u-gm', 'New review request', `Meter ${meter.officialMeterNumber} is awaiting your review.`, meter.id)
    return result
  },

  async gmForward(id, userId) {
    await delay()
    const meter = meters.find((m) => m.id === id)
    if (!meter) throw new Error('Meter not found')
    const user = findUser(userId)
    const result = transition(id, 'PendingMD', user, 'Reviewed and forwarded to MD')
    notify('u-md', 'New approval request', `Meter ${meter.officialMeterNumber} was forwarded to you by GM.`, meter.id)
    return result
  },

  async gmReject(id, input, userId) {
    await delay()
    const meter = meters.find((m) => m.id === id)
    if (!meter) throw new Error('Meter not found')
    if (!input.reason.trim()) throw new Error('A reason is required when rejecting')
    meter.rejectionReason = input.reason
    const user = findUser(userId)
    const result = transition(id, 'Rejected', user, 'Rejected at GM level', input.reason)
    notify('u-sec', 'Job rejected by GM', `Meter ${meter.officialMeterNumber} was rejected. Reason: ${input.reason}`, meter.id)
    return result
  },

  async mdApprove(id, userId) {
    await delay()
    const meter = meters.find((m) => m.id === id)
    if (!meter) throw new Error('Meter not found')
    const user = findUser(userId)
    const result = transition(id, 'PendingIT', user, 'Approved for IT action')
    notify('u-it', 'Approved job ready', `Meter ${meter.officialMeterNumber} is approved and ready for profiling.`, meter.id)
    return result
  },

  async mdReject(id, input, userId) {
    await delay()
    const meter = meters.find((m) => m.id === id)
    if (!meter) throw new Error('Meter not found')
    if (!input.reason.trim()) throw new Error('A reason is required when rejecting')
    meter.rejectionReason = input.reason
    const user = findUser(userId)
    const result = transition(id, 'Rejected', user, 'Rejected at MD level', input.reason)
    notify('u-sec', 'Job rejected by MD', `Meter ${meter.officialMeterNumber} was rejected. Reason: ${input.reason}`, meter.id)
    return result
  },

  async itComplete(id, input, userId) {
    await delay()
    const meter = meters.find((m) => m.id === id)
    if (!meter) throw new Error('Meter not found')
    if (!input.profileConfirmed) throw new Error('Confirm that you have acted on the task before recording the code')
    if (!input.activationCode.trim()) throw new Error('An activation code is required')
    meter.activationCode = input.activationCode
    meter.profileConfirmed = true
    meter.itNotes = input.notes
    const user = findUser(userId)
    const result = transition(id, 'Completed', user, `Job completed and closed. Activation code recorded: ${input.activationCode}`, input.activationCode)
    notify(meter.createdBy, 'Job completed', `Meter ${meter.officialMeterNumber} is complete. Activation code: ${input.activationCode}`, meter.id)
    return result
  },

  async resendToGM(id, userId) {
    await delay()
    const meter = meters.find((m) => m.id === id)
    if (!meter) throw new Error('Meter not found')
    const user = findUser(userId)
    const result = transition(id, 'PendingGM', user, 'Resubmitted to GM after rejection')
    notify('u-gm', 'Resubmitted for review', `Meter ${meter.officialMeterNumber} was resubmitted after rejection.`, meter.id)
    return result
  },

  async listAudit(meterId) {
    await delay(100)
    return clone(audits.filter((a) => a.meterActivationId === meterId))
  },

  async listNotifications(userId) {
    await delay(100)
    return clone(notifications.filter((n) => n.userId === userId))
  },

  async markNotificationRead(id) {
    const n = notifications.find((x) => x.id === id)
    if (n) n.read = true
  },
}
