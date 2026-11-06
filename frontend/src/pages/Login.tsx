import loginBackground from "../assets/Background.png"
import { useState, type FormEvent } from "react"
import { Link, useNavigate } from "react-router"
import { login } from "../api/auth"

// Styling for the Login component and its child elements.
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
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    setIsSubmitting(true)

    try {
      const token = await login(email, password)
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

        {error && <p role="alert" aria-live="polite" className="mb-4 text-center text-red-700">{error}</p>}

        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email"
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
          className={`mt-[45px] ${input}`}
        />

        <Link
          to="/forgot-password"
          className={`self-start leading-[35px] ${link}`}
        >
          Forget Password?
        </Link>

        <button type="submit" className={button} disabled={isSubmitting}>
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
