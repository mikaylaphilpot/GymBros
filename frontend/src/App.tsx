import { Route, Routes } from "react-router"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import FriendsPage from "./pages/FriendsPage"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/friends" element={<FriendsPage />} />
      <Route path="*" element={<Login />} />
    </Routes>
  )
}