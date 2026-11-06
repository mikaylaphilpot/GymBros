import loginBackground from "../assets/Background.png"
import { useState, type FormEvent } from "react"
import { Link } from "react-router"
import { signup } from "../api/auth"

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
const button =
  "mt-[23px] h-[83px] w-[235px] self-center rounded-[20px] border border-[#b31517] bg-[#b31517] font-['Inter:Regular'] text-[40px] leading-normal font-normal text-white transition-colors hover:bg-[#981214] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b31517] active:bg-[#7d0f11]"
const link =
  "mt-4 self-center font-['Inter:Regular'] text-[20px] font-normal text-[#546ac0] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#546ac0]"

export default function SignUp() {
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")

    const formData = new FormData(event.currentTarget)
    const username = String(formData.get("username") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    if (!username || !email || !password) {
      setError("Please fill out all fields.")
      return
    }

    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
      setError(
        "Use 8+ characters with uppercase and lowercase letters, a number, and at least one of these symbols: @$!%*?&. No spaces or other characters.",
      )
      return
    }

    setIsSubmitting(true)

    try {
      setMessage(await signup(username, email, password))
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create your account.")
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
        <h1 className={title}>Become a Bro!</h1>

        {error && <p role="alert" aria-live="polite" className="mb-4 text-center text-red-700">{error}</p>}
        {message && <p role="status" aria-live="polite" className="mb-4 text-center text-green-700">{message}</p>}

        <label htmlFor="username" className="sr-only">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          placeholder="Username"
          className={input}
        />

        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Email"
          className={`mt-[25px] ${input}`}
        />

        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Password"
          className={`mt-[25px] ${input}`}
        />

        <p className="mt-2 text-sm text-gray-700">
          Use at least 8 characters, including uppercase and lowercase letters, a
          number, and one of these symbols: @$!%*?&amp;. No spaces or other characters.
        </p>

        <button type="submit" className={button} disabled={isSubmitting}>
          {isSubmitting ? "Signing Up..." : "Sign Up"}
        </button>

        <Link to="/" className={link}>
          Already a Bro? Sign In
        </Link>
      </form>
    </main>
  )
}
