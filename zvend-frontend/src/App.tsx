import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from './components/Layout'
import { ToastProvider } from './components/Toast'
import { ThemeProvider } from './components/ThemeProvider'
import { RequireAuth, RequireRole } from './components/guards'
import { useAuth, homePath } from './store/auth'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Facilities } from './pages/Facilities'
import { MeterDetail } from './pages/MeterDetail'
import { FieldHome } from './pages/FieldHome'
import { FieldScanPage } from './pages/FieldScan'
import { QueuePage } from './pages/QueuePage'
import { Settings } from './pages/Settings'
import type { Role } from './types'

const ADMIN_ROLES: Role[] = ['Secretary', 'GM', 'MD', 'IT']

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5_000, refetchOnWindowFocus: false },
  },
})

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? homePath(user) : '/login'} replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route index element={<HomeRedirect />} />

                <Route path="dashboard" element={<RequireRole roles={ADMIN_ROLES} />}>
                  <Route index element={<Dashboard />} />
                </Route>

                <Route path="meters/:id" element={<RequireAuth />}>
                  <Route index element={<MeterDetail />} />
                </Route>

                <Route path="facilities" element={<RequireRole roles={['Secretary']} />}>
                  <Route index element={<Facilities />} />
                </Route>

                <Route path="field" element={<RequireRole roles={['FieldTechnician']} />}>
                  <Route index element={<FieldHome />} />
                </Route>

                <Route path="scan/new" element={<RequireRole roles={['FieldTechnician']} />}>
                  <Route index element={<FieldScanPage />} />
                </Route>

                <Route path="reviews" element={<RequireRole roles={['GM']} />}>
                  <Route
                    index
                    element={
                      <QueuePage
                        status="PendingGM"
                        title="GM Review Queue"
                        subtitle="Review confirmed field data and forward to the MD."
                      />
                    }
                  />
                </Route>

                <Route path="approvals" element={<RequireRole roles={['MD']} />}>
                  <Route
                    index
                    element={
                      <QueuePage
                        status="PendingMD"
                        title="MD Approvals"
                        subtitle="Final management approval before the job goes to IT."
                      />
                    }
                  />
                </Route>

                <Route path="it" element={<RequireRole roles={['IT']} />}>
                  <Route
                    index
                    element={
                      <QueuePage
                        status="PendingIT"
                        title="IT Queue"
                        subtitle="Review customer profiling, carry out the task, and record the activation code."
                      />
                    }
                  />
                </Route>

                <Route path="settings" element={<RequireAuth />}>
                  <Route index element={<Settings />} />
                </Route>

                <Route path="meters/:id" element={<RequireAuth />}>
                  <Route index element={<MeterDetail />} />
                </Route>

                <Route path="*" element={<HomeRedirect />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}