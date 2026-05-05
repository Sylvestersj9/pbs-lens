import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import Auth from '@/pages/Auth'
import Dashboard from '@/pages/Dashboard'
import AddYoungPerson from '@/pages/AddYoungPerson'
import PersonProfile from '@/pages/PersonProfile'
import LogIncident from '@/pages/LogIncident'
import Admin from '@/pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddYoungPerson />} />
          <Route path="/person/:id" element={<PersonProfile />} />
          <Route path="/person/:id/log" element={<LogIncident />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Route>
    </Routes>
  )
}
