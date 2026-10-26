import searchImage from "../assets/Search.png"

type AddFriendsProps = {
  onClose: () => void
}

const overlay =
  "fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4"
const popup =
  "flex min-h-[560px] max-h-[90dvh] w-full max-w-[560px] flex-col overflow-y-auto rounded-xl bg-white px-9 py-10 shadow-[0_4px_16px_#000]"
const title =
  "self-start font-['Inter:Bold'] text-[36px]! leading-tight font-bold text-black underline decoration-[#B31517] decoration-[12.5%] underline-offset-8"
const description = "mt-6 text-left text-[20px]"
const searchField =
  "mt-5 flex h-12 items-center gap-3 rounded-[10px] border-2 border-[#919191] px-3"
const searchInput =
  "min-w-0 flex-1 bg-transparent text-[20px] outline-none placeholder:text-black"
const closeButton =
  "mt-auto h-12 w-[130px] self-center rounded-lg bg-[#b31517] text-[20px] font-bold text-white transition hover:bg-[#951214]"

export default function AddFriends({ onClose }: AddFriendsProps) {
  return (
    <div
      className={overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-bros-title"
    >
      <div className={popup}>
        <h2
          id="add-bros-title"
          className={title}
        >
          Add Bros
        </h2>
        <p className={description}>Add a bro using their username.</p>
        <label className={searchField}>
          <img
            src={searchImage}
            alt=""
            aria-hidden="true"
            className="size-5"
          />
          <input
            placeholder="Find your Bro"
            className={searchInput}
            readOnly
          />
        </label>
        <button
          type="button"
          onClick={onClose}
          className={closeButton}
        >
          Close
        </button>
      </div>
    </div>
  )
}
