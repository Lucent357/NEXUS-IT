import { Route, Routes } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Assets from './pages/Assets'
import Employees from './pages/Employees'
import Assignments from './pages/Assignments'
import Maintenance from './pages/Maintenance'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="assets" element={<Assets />} />
          <Route path="employees" element={<Employees />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}