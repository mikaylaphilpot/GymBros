import Login from "./pages/Login"
import ForgotPswdPage from "./pages/ForgotPswdPage"
import Signup from "./pages/Signup"

export default function App() {
  const path = window.location.pathname

  if (path === "/forgot-password") {
    return <ForgotPswdPage />
  }

  if (path === "/signup") {
    return <Signup />
  }

  return <Login />
}