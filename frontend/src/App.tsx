import Login from "./pages/Login"
import Signup from "./pages/Signup"

export default function App() {
  const path = window.location.pathname


  if (path === "/signup") {
    return <Signup />
  }

  return <Login />
}