import loginBackground from "../assets/Background.png"
import { Link, useLocation, useNavigate } from "react-router"
import { useState } from "react"
import { logIn } from "../utils/authApi"

const page =
  "fixed inset-0 flex min-h-dvh w-screen items-center justify-center overflow-hidden px-5 py-10"
const background =
  "pointer-events-none absolute inset-0 h-full w-full object-cover"
const form =
  "relative z-10 flex w-full max-w-[679px] flex-col rounded-[20px] bg-white px-[clamp(24px,8.1vw,117px)] pb-[clamp(28px,4vw,36px)] pt-[clamp(34px,6.7vw,61px)] shadow-[0_4px_25px_#000]"
const title =
  "mb-[25px] text-center font-['Inter:Bold'] text-[clamp(40px,3vw,50px)]! leading-normal font-bold text-black underline decoration-[#B31517] decoration-[12.5%] underline-offset-8"
const input =
  "h-[92px] w-full appearance-none rounded border border-gray-400 bg-[#d9d9d9] px-6 font-['Inter:Regular'] text-[clamp(22px,2.08vw,30px)] font-normal text-black placeholder:text-[#a59f9f] shadow-none outline-none focus-visible:border-[#b31517] focus-visible:ring-2 focus-visible:ring-[#b31517]"
const link =
  "font-['Inter:Regular'] text-[16px] font-normal text-[#546ac0] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#546ac0] sm:text-[20px]"
const button =
  "mt-[23px] h-[83px] w-[235px] self-center rounded-[20px] border border-[#b31517] bg-[#b31517] font-['Inter:Regular'] text-[40px] leading-normal font-normal text-white transition-colors hover:bg-[#981214] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b31517] active:bg-[#7d0f11]"

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const successMessage =
    (location.state as { message?: string } | null)?.message

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      await logIn(username.trim(), password)
      navigate("/home-page")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Login failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={page}>
      <img
        src={loginBackground}
        alt=""
        aria-hidden="true"
        className={background}
      />

      <form
        onSubmit={handleSubmit}
        className={form}
      >
        <h1 className={title}>Welcome Back Bro!</h1>

        {successMessage && (
          <p className="mb-4 text-left text-green-700">{successMessage}</p>
        )}
        {error && <p className="mb-4 text-left text-[#b31517]">{error}</p>}

        <label htmlFor="username" className="sr-only">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
          className={input}
        />

        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className={`mt-[45px] ${input}`}
        />

        <Link
          to="/forgot-password"
          className={`self-start leading-[35px] ${link}`}
        >
          Forget Password?
        </Link>

        <button type="submit" disabled={isSubmitting} className={button}>
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>

        <Link
          to="/signup"
          className={`self-center text-center leading-[40px] ${link}`}
        >
          Not a Bro? Create Account
        </Link>
      </form>
    </main>
  )
}
