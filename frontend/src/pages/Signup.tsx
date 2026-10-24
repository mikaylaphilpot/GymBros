const page =
  "fixed inset-0 flex min-h-dvh w-screen items-center justify-center overflow-hidden px-5 py-10"
const form =
  "relative z-10 flex w-full max-w-[679px] flex-col px-[clamp(24px,8.1vw,117px)] pb-[clamp(28px,4vw,36px)] pt-[clamp(34px,6.7vw,61px)]"
const title =
  "mb-[25px] text-center font-['Inter:Bold'] text-[clamp(40px,3vw,50px)]! leading-normal font-bold"
const input =
  "h-[92px] w-full appearance-none rounded border border-gray-400 bg-transparent px-6 font-['Inter:Regular'] text-[clamp(22px,2.08vw,30px)] font-normal shadow-none outline-none focus-visible:border-[#b31517] focus-visible:ring-2 focus-visible:ring-[#b31517]"
const button =
  "mt-[23px] h-[83px] w-[235px] self-center rounded-[20px] border border-[#b31517] bg-[#b31517] font-['Inter:Regular'] text-[40px] leading-normal font-normal text-white transition-colors hover:bg-[#981214] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#b31517] active:bg-[#7d0f11]"
const link =
  "mt-4 self-center font-['Inter:Regular'] text-[20px] font-normal hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b31517]"

export default function SignUp() {
  return (
    <main className={page}>
      <form
        onSubmit={(event) => event.preventDefault()}
        className={form}
      >
        <h1 className={title}>Become a Bro!</h1>

        <label htmlFor="username" className="sr-only">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
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
          required
          placeholder="Email"
          className={`mt-[45px] ${input}`}
        />

        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Password"
          className={`mt-[45px] ${input}`}
        />

        <button type="submit" className={button}>
          Sign Up
        </button>

        <a href="/" className={link}>
          Already a Bro? Sign In
        </a>
      </form>
    </main>
  )
}
