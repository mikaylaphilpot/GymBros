const page =
  "fixed inset-0 flex min-h-dvh w-screen items-center justify-center overflow-hidden px-5 py-10"
const form =
  "relative z-10 flex w-full max-w-[679px] flex-col px-[clamp(24px,8.1vw,117px)] pb-[clamp(28px,4vw,36px)] pt-[clamp(34px,6.7vw,61px)]"
const title =
  "mb-[25px] text-center font-['Inter:Bold'] text-[clamp(40px,3vw,50px)]! leading-normal font-bold"
const input =
  "h-[92px] w-full appearance-none rounded border border-gray-400 bg-transparent px-6 font-['Inter:Regular'] text-[clamp(22px,2.08vw,30px)] font-normal shadow-none outline-none focus-visible:border-[#b31517] focus-visible:ring-2 focus-visible:ring-[#b31517]"
const link =
  "font-['Inter:Regular'] text-[20px] font-normal"
const button =
  "mt-[23px] h-[83px] w-[235px] self-center rounded-[20px] border border-[#b31517] bg-[#b31517] font-['Inter:Regular'] text-[40px] leading-normal font-normal text-white transition-colors hover:bg-[#981214] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b31517] active:bg-[#7d0f11]"

export default function Login() {
  return (
    <main className={page}>
      <form
        onSubmit={(event) => event.preventDefault()}
        className={form}
      >
        <h1 className={title}>Welcome Back Bro!</h1>

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
          placeholder="Password"
          className={`mt-[45px] ${input}`}
        />

        <a
          href="/forgot-password"
          className={`self-start leading-[35px] ${link}`}
        >
          Forget Password?
        </a>

        <button type="submit" className={button}>
          Sign In
        </button>

        <a
          href="/signup"
          className={`self-center text-center leading-[40px] ${link}`}
        >
          Not a Bro? Create Account
        </a>
      </form>
    </main>
  )
}
