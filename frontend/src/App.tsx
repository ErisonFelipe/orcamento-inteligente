import { Navigate, Route, Routes } from "react-router-dom"

import { AppLayout } from "@/components/layout/app-layout"
import { CategoriesPage } from "@/pages/categories"
import { DashboardPage } from "@/pages/dashboard"
import { SettingsPage } from "@/pages/settings"
import { TransactionsPage } from "@/pages/transactions"
import { InvestmentsPage } from "@/pages/investments"
import { WealthPage } from "@/pages/wealth"
import { CalendarPage } from "@/pages/calendar"

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/transactions" replace />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/wealth" element={<WealthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/transactions" replace />} />
      </Routes>
    </AppLayout>
  )
}

export default App