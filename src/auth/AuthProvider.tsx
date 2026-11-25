import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContext'
import type { Profile } from './AuthContext'

type ProfileState = { userId: string; profile: Profile | null }

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [profileState, setProfileState] = useState<ProfileState | null>(null)

  // Dengarkan perubahan sesi (termasuk sesi awal saat halaman dibuka)
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setSessionReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Ambil profil (peran) setiap kali pengguna yang login berganti
  const userId = session?.user.id
  useEffect(() => {
    if (!userId) return
    const id: string = userId
    let cancelled = false

    async function loadProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', id)
        .maybeSingle()
      if (!cancelled) {
        setProfileState({ userId: id, profile: (data as Profile | null) ?? null })
      }
    }

    loadProfile()
    return () => {
      cancelled = true
    }
  }, [userId])

  // Nilai turunan: tidak disimpan di state supaya tidak bisa tidak sinkron
  const profile =
    session && profileState?.userId === session.user.id ? profileState.profile : null
  const loading =
    !sessionReady || (session !== null && profileState?.userId !== session.user.id)

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return null
    return error.message.toLowerCase().includes('invalid')
      ? 'Email atau password salah.'
      : error.message
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        isDemo: profile?.role === 'demo',
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}