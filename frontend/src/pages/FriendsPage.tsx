import { useState } from "react"
import backgroundImage from "../assets/Background.png"
import searchImage from "../assets/Search.png"
import AddFriends from "./AddFriends"

const page =
  "relative min-h-dvh overflow-x-hidden"
const background =
  "pointer-events-none fixed inset-0 size-full object-cover"
const panel =
  "relative mx-auto min-h-dvh w-full max-w-[964px] bg-white px-6 pb-12 pt-6 shadow-[0_4px_25px_#000] sm:px-14 lg:px-[70px]"
const toolbar = "flex flex-wrap items-center gap-4"
const backButton = "mr-auto text-[28px] text-[#546ac0] hover:underline"
const searchField =
  "order-3 flex h-[62px] w-full items-center gap-3 rounded-[10px] border-2 border-[#919191] px-4 sm:order-none sm:w-auto sm:flex-1"
const searchInput =
  "min-w-0 flex-1 border-0 bg-transparent text-[26px] outline-none placeholder:text-black"
const addButton =
  "rounded-[20px] border border-[#ccc] bg-[#b31517] px-6 py-3 text-[25px] text-white hover:bg-[#951214]"
const title =
  "mt-10 block text-left font-['Inter:Bold'] text-[60px]! leading-tight font-bold underline decoration-[#B31517] decoration-[12.5%] underline-offset-8 sm:text-[70px]!"
const sectionTitle = "text-left text-[28px] leading-none"

export default function FriendsPage() {
  const [query, setQuery] = useState("")
  const [showAdd, setShowAdd] = useState(false)

  const section = (title: string, subtitle?: string) => {
    return (
      <section className="mb-7">
        <header className="border-b border-black/55 pb-2 text-left">
          <h2 className={sectionTitle}>{title}</h2>
          {subtitle && <p className="text-base">{subtitle}</p>}
        </header>
      </section>
    )
  }

  return (
    <main className={page}>
      <img
        src={backgroundImage}
        alt=""
        aria-hidden="true"
        className={background}
      />
      <div className={panel}>
        <div className={toolbar}>
          <button type="button" className={backButton}>
            Back
          </button>
          <label className={searchField}>
            <img
              src={searchImage}
              alt=""
              aria-hidden="true"
              className="size-[25px]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find your Bro"
              className={searchInput}
            />
          </label>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className={addButton}
          >
            Add Bros
          </button>
        </div>
        <h1 className={title}>Your Bros</h1>
        <div className="mt-9">
          {section("Best Bro", "Bugged the most")}
          {section("Streak Bro", "Highest Streak")}
          {section("Regular Bros")}
        </div>
      </div>
      {showAdd && (
        <AddFriends
          onClose={() => setShowAdd(false)}
        />
      )}
    </main>
  )
}
