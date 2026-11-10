import { Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/layout/app-layout"
import { CategoriesPage } from "@/pages/categories"
import { DashboardPage } from "@/pages/dashboard"
import { SettingsPage } from "@/pages/settings"
import { TransactionsPage } from "@/pages/transactions"

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/transactions" replace />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/transactions" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default App