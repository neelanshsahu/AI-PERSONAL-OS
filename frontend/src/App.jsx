import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Layout } from '@/components/layout/Layout'

// Pages
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Chat from '@/pages/Chat'
import KnowledgeBase from '@/pages/KnowledgeBase'
import Planner from '@/pages/Planner'
import ImageGenerator from '@/pages/ImageGenerator'
import Analytics from '@/pages/Analytics'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'
import UpdatePassword from '@/pages/UpdatePassword'

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />

              {/* Protected — requires valid session */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/"                element={<Dashboard />}      />
                  <Route path="/chat"            element={<Chat />}           />
                  <Route path="/knowledge-base"  element={<KnowledgeBase />}  />
                  <Route path="/planner"         element={<Planner />}        />
                  <Route path="/image-generator" element={<ImageGenerator />} />
                  <Route path="/analytics"       element={<Analytics />}      />
                  <Route path="/settings"        element={<Settings />}       />
                  <Route path="/update-password" element={<UpdatePassword />} />
                  <Route path="*"                element={<NotFound />}       />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
