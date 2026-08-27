export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          role: 'Secretary' | 'FieldTechnician' | 'GM' | 'MD' | 'IT'
          password_hash: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone?: string | null
          role: 'Secretary' | 'FieldTechnician' | 'GM' | 'MD' | 'IT'
          password_hash: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          role?: 'Secretary' | 'FieldTechnician' | 'GM' | 'MD' | 'IT'
          password_hash?: string
          created_at?: string
          updated_at?: string
        }
      }
      facilities: {
        Row: {
          id: string
          name: string
          location: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      meter_installations: {
        Row: {
          id: string
          official_meter_number: string
          facility_id: string
          status:
            | 'PendingSecretaryConfirm'
            | 'PendingGM'
            | 'PendingMD'
            | 'PendingIT'
            | 'PendingClosure'
            | 'Completed'
            | 'Rejected'
          scanned_meter_number: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          gps_accuracy: number | null
          installation_address: string | null
          field_technician_name: string | null
          customer_name: string | null
          customer_phone: string | null
          activation_code: string | null
          profile_confirmed: boolean | null
          it_notes: string | null
          rejection_reason: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          official_meter_number: string
          facility_id: string
          status?:
            | 'PendingSecretaryConfirm'
            | 'PendingGM'
            | 'PendingMD'
            | 'PendingIT'
            | 'PendingClosure'
            | 'Completed'
            | 'Rejected'
          scanned_meter_number?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          gps_accuracy?: number | null
          installation_address?: string | null
          field_technician_name?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          activation_code?: string | null
          profile_confirmed?: boolean | null
          it_notes?: string | null
          rejection_reason?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          official_meter_number?: string
          facility_id?: string
          status?:
            | 'PendingSecretaryConfirm'
            | 'PendingGM'
            | 'PendingMD'
            | 'PendingIT'
            | 'PendingClosure'
            | 'Completed'
            | 'Rejected'
          scanned_meter_number?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          gps_accuracy?: number | null
          installation_address?: string | null
          field_technician_name?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          activation_code?: string | null
          profile_confirmed?: boolean | null
          it_notes?: string | null
          rejection_reason?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      audit_entries: {
        Row: {
          id: string
          meter_activation_id: string
          user_id: string
          user_name: string
          user_role:
            | 'Secretary'
            | 'FieldTechnician'
            | 'GM'
            | 'MD'
            | 'IT'
          action: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          meter_activation_id: string
          user_id: string
          user_name: string
          user_role:
            | 'Secretary'
            | 'FieldTechnician'
            | 'GM'
            | 'MD'
            | 'IT'
          action: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          meter_activation_id?: string
          user_id?: string
          user_name?: string
          user_role?:
            | 'Secretary'
            | 'FieldTechnician'
            | 'GM'
            | 'MD'
            | 'IT'
          action?: string
          notes?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          meter_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          meter_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          meter_id?: string | null
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      user_role: 'Secretary' | 'FieldTechnician' | 'GM' | 'MD' | 'IT'
      meter_status:
        | 'PendingSecretaryConfirm'
        | 'PendingGM'
        | 'PendingMD'
        | 'PendingIT'
        | 'PendingClosure'
        | 'Completed'
        | 'Rejected'
    }
  }
}
