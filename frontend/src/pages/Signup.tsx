import loginBackground from "../assets/Background.png"
import { useState, type FormEvent } from "react"
import { Link } from "react-router"
import { signup } from "../api/auth"

// The sign-up page keeps its layout and visual rules separate from the validation flow,
// making it easier to update styling without affecting the API call behavior.
const page =
  "fixed inset-0 flex min-h-dvh w-screen items-center justify-center overflow-y-auto px-3 py-4"
const background =
  "pointer-events-none absolute inset-0 h-full w-full object-cover"
const form =
  "relative z-10 flex w-full max-w-[440px] flex-col rounded-xl bg-white px-[clamp(20px,5vw,56px)] pb-5 pt-6 shadow-[0_4px_20px_#000]"
const title =
  "mb-4 text-center font-['Inter:Bold'] text-[clamp(26px,2vw,34px)]! leading-normal font-bold text-black underline decoration-[#B31517] decoration-[12.5%] underline-offset-4"
const input =
  "h-[52px] w-full appearance-none rounded border border-gray-400 bg-[#d9d9d9] px-4 font-['Inter:Regular'] text-[clamp(16px,1.4vw,19px)] font-normal text-black placeholder:text-[#a59f9f] shadow-none outline-none focus-visible:border-[#b31517] focus-visible:ring-2 focus-visible:ring-[#b31517]"
const button =
  "mt-4 h-[52px] w-[145px] self-center rounded-xl border border-[#b31517] bg-[#b31517] font-['Inter:Regular'] text-[22px] leading-normal font-normal text-white transition-colors hover:bg-[#981214] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b31517] active:bg-[#7d0f11]"
const link =
  "mt-3 self-center font-['Inter:Regular'] text-sm font-normal text-[#546ac0] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#546ac0]"

export default function SignUp() {
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // The API request should only happen after the form passes several checks so we
  // avoid sending incomplete or invalid data to the backend.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")

    const formData = new FormData(event.currentTarget)
    const username = String(formData.get("username") ?? "").trim()
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    // Check the required fields and password rules before sending the signup request.
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
      // Capture the backend message so the user sees a concrete success state after
      // account creation without losing the rest of the form layout.
      setMessage(await signup(username, email, password))
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create your account.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Keep all sign-up inputs inside a single focused card to mirror the login screen and
  // reduce distractions during account creation.
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

        {error && <p role="alert" aria-live="polite" className="mb-4 text-center text-[#B31517]!">{error}</p>}
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
          className={`mt-3 ${input}`}
        />

        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <div className="group relative mt-3">
          {/* The tooltip explains the password complexity rules without cluttering the form.
              It appears on hover/focus so new users still have visible guidance. */}
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="Password"
            className={`${input} pr-12`}
          />
          <button
            type="button"
            aria-label="Show password requirements"
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-[#B31517] text-sm font-bold text-[#B31517] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B31517]"
          >
            ?
          </button>
          <span
            role="tooltip"
            className="pointer-events-none absolute right-0 top-full z-20 mt-2 hidden w-64 rounded bg-white px-3 py-2 text-left text-xs leading-5 font-medium text-[#B31517] shadow-lg ring-1 ring-[#B31517] group-hover:block group-focus-within:block"
          >
            Use 8+ characters with uppercase and lowercase letters, a number,
            and at least one of these symbols: @$!%*?&amp;. No spaces or other
            characters.
          </span>
        </div>

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
