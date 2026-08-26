import type { User } from '../types'
import { supabase } from './supabase'

const METER_NUMBER_REGEX = /^5810\d{7}$/

export function isValidMeterNumber(num: string): boolean {
  return METER_NUMBER_REGEX.test(num)
}

export function normalizeMeterNumber(num: string): string {
  return num.replace(/\s/g, '').trim()
}

export function dbUserToUser(row: {
  id: string
  full_name: string
  email: string
  phone: string | null
  role: string
}): User {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role as User['role'],
  }
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single()

  if (error || !data) return null
  return data
}
