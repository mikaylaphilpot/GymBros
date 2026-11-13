import { Route, Routes } from "react-router"
import './App.css'

import Login from "./pages/Login"
import Signup from "./pages/Signup"
import FriendsPage from "./pages/FriendsPage"

import ForgotPswdPage from './pages/ForgotPswdPage'
import HomePage from './pages/HomePage'
import ProfilePage from './pages/ProfilePage'
import EditUserInfoPage from './pages/EditUserInfoPage'
import EditSchedulePage from './pages/EditSchedulePage'
import ResetPasswordPage from "./pages/ResetPasswordPage"
import NotificationTestPage from "./pages/NotificationTestPage"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/friends" element={<FriendsPage />} />

      <Route path="/home-page" element={<HomePage />} />
      <Route path="/forgot-password" element={<ForgotPswdPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/profile-page" element={<ProfilePage />} />
      <Route path="/edit-user-info-page" element={<EditUserInfoPage />} />
      <Route path="/edit-schedule-page" element={<EditSchedulePage />} />

      <Route path="/test-notif-page" element={<NotificationTestPage />} />

      <Route path="*" element={<Login />} />
    </Routes>
  )
}
