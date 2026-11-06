import { useEffect, useState } from "react"
import searchImage from "../assets/Search.png"
import { addFriend, searchUsers, type UserSearchResult } from "../api/friends"

type AddFriendsProps = {
  currentUserId: string
  friendIds: string[]
  onClose: () => void
  onAdded: () => Promise<void>
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
  "mt-6 h-12 w-[130px] self-center rounded-lg bg-[#b31517] text-[20px] font-bold text-white transition hover:bg-[#951214]"
const resultButton =
  "rounded-lg bg-[#b31517] px-4 py-2 font-semibold text-white hover:bg-[#951214] disabled:cursor-not-allowed disabled:bg-gray-400"

export default function AddFriends({
  currentUserId,
  friendIds,
  onClose,
  onAdded,
}: AddFriendsProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [pendingFriendId, setPendingFriendId] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const friendIdSet = new Set(friendIds)

  // Debounce username searches and ignore results from searches that have been replaced.
  useEffect(() => {
    let active = true
    const searchQuery = query.trim()

    const timeout = setTimeout(async () => {
      if (!searchQuery) {
        setResults([])
        setIsSearching(false)
        setError("")
        return
      }

      setIsSearching(true)
      setError("")

      try {
        const users = await searchUsers(searchQuery, currentUserId)
        if (active) {
          setResults(users)
        }
      } catch (searchError) {
        if (active) {
          setError(searchError instanceof Error ? searchError.message : "Unable to search users.")
          setResults([])
        }
      } finally {
        if (active) {
          setIsSearching(false)
        }
      }
    }, searchQuery ? 250 : 0)

    return () => {
      active = false
      clearTimeout(timeout)
    }
  }, [currentUserId, query])

  // Refresh the parent list after adding so the new friend is reflected immediately.
  async function handleAdd(user: UserSearchResult) {
    setPendingFriendId(user.id)
    setError("")
    setMessage("")

    try {
      const result = await addFriend(currentUserId, user.id)
      setMessage(result.message)
      await onAdded()
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Unable to add this friend.")
    } finally {
      setPendingFriendId("")
    }
  }

  return (
    <div
      className={overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-bros-title"
    >
      <div className={popup}>
        <h2 id="add-bros-title" className={title}>Add Bros</h2>
        <p className={description}>Add a bro using their username.</p>
        {error && <p role="alert" className="mt-4 text-center text-red-700">{error}</p>}
        {message && <p role="status" className="mt-4 text-center text-green-700">{message}</p>}
        <label className={searchField}>
          <img
            src={searchImage}
            alt=""
            aria-hidden="true"
            className="size-5"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find your Bro"
            className={searchInput}
            aria-label="Search users by username"
          />
        </label>

        <div className="mt-4" aria-live="polite">
          {isSearching && <p className="text-center text-gray-700">Searching...</p>}
          {!isSearching && query.trim() && results.length === 0 && !error && (
            <p className="text-center text-gray-700">No users found.</p>
          )}
          <ul className="space-y-2">
            {results.map((user) => {
              const isFriend = friendIdSet.has(user.id)

              return (
                <li
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-300 px-4 py-3"
                >
                  <span className="min-w-0 truncate">{user.username}</span>
                  <button
                    type="button"
                    className={resultButton}
                    disabled={isFriend || pendingFriendId === user.id}
                    onClick={() => void handleAdd(user)}
                  >
                    {isFriend ? "Added" : pendingFriendId === user.id ? "Adding..." : "Add"}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <button type="button" onClick={onClose} className={closeButton}>
          Close
        </button>
      </div>
    </div>
  )
}
