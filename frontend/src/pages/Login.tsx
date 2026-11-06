import loginBackground from "../assets/Background.png"
import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { login } from "../api/auth"

// Styling for the Login component and its child elements.
const page =
  "fixed inset-0 flex min-h-dvh w-screen items-center justify-center overflow-y-auto px-3 py-4"
const background =
  "pointer-events-none absolute inset-0 h-full w-full object-cover"
const form =
  "relative z-10 flex w-full max-w-[440px] flex-col rounded-xl bg-white px-[clamp(20px,5vw,56px)] pb-5 pt-6 shadow-[0_4px_20px_#000]"
const title =
  "mb-3 text-center font-['Inter:Bold'] text-[clamp(26px,2vw,34px)]! leading-normal font-bold text-black underline decoration-[#B31517] decoration-[12.5%] underline-offset-4"
const input =
  "h-[52px] w-full appearance-none rounded border border-gray-400 bg-[#d9d9d9] px-4 font-['Inter:Regular'] text-[clamp(16px,1.4vw,19px)] font-normal text-black placeholder:text-[#a59f9f] shadow-none outline-none focus-visible:border-[#b31517] focus-visible:ring-2 focus-visible:ring-[#b31517]"
const link =
  "font-['Inter:Regular'] text-[13px] font-normal text-[#546ac0] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#546ac0] sm:text-sm"
const button =
  "mt-4 h-[52px] w-[145px] self-center rounded-xl border border-[#b31517] bg-[#b31517] font-['Inter:Regular'] text-[22px] leading-normal font-normal text-white transition-colors hover:bg-[#981214] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b31517] active:bg-[#7d0f11]"

export default function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const formData = new FormData(event.currentTarget)
    const identifier = String(formData.get("identifier") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (!identifier || !password) {
      setError("Please enter your email or username and password.")
      return
    }

    setIsSubmitting(true)

    try {
      const token = await login(identifier, password)
      // Keep the token available for authenticated API requests during this session.
      sessionStorage.setItem("authToken", token)
      navigate("/home-page")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to log in.")
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
        noValidate
        className={form}
      >
        <h1 className={title}>Welcome Back Bro!</h1>
        <p className="mb-4 text-center text-sm font-semibold text-[#B31517]!">
          Email, username, and password are case-sensitive.*
        </p>

        {error && <p role="alert" aria-live="polite" className="mb-4 text-center text-[#B31517]!">{error}</p>}

        <label htmlFor="identifier" className="sr-only">
          Email or username
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="Email/Username"
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
          required
          placeholder="Password"
          className={`mt-5 ${input}`}
        />
        <Link
          to="/forgot-password"
          className={`self-start leading-6 ${link}`}
        >
          Forget Password?
        </Link>

        <button type="submit" className={button} disabled={isSubmitting}>
          {isSubmitting ? "Signing In..." : "Sign In"}
        </button>

        <Link
          to="/signup"
          className={`self-center text-center leading-7 ${link}`}
        >
          Not a Bro? Create Account
        </Link>
      </form>
    </main>
  )
}
