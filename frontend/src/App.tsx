import Login from "./pages/Login"
import Signup from "./pages/Signup"
import FriendsPage from "./pages/FriendsPage"

export default function App() {
  const path = window.location.pathname

  if (path === "/friends") {
    return <FriendsPage />
  }

  if (path === "/signup") {
    return <Signup />
  }

  return <Login />
}