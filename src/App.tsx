import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider'
import { RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { LanguageProvider } from './i18n/LanguageProvider'
import { ContractsPage } from './pages/ContractsPage'
import { LoginPage } from './pages/LoginPage'
import { NewContractPage } from './pages/NewContractPage'
import { UploadPage } from './pages/UploadPage'

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route index element={<ContractsPage />} />
                <Route path="upload" element={<UploadPage />} />
                <Route path="contracts/new" element={<NewContractPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  )
}
