import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router"

import backgroundImage from "../assets/Background.png"
import brosIcon from "../assets/brosIcon.png"
import searchImage from "../assets/Search.png"
import streakIcon from "../assets/streak.png"
import trophyIcon from "../assets/trophy.png"
import vertMenu from "../assets/vertMenu.png"
import { deleteFriend, getCurrentUserId, getFriendsByStats, type Friend, type FriendsByStats } from "../api/friends"
import AddFriends from "./AddFriends"

const page = "relative min-h-dvh overflow-x-hidden"
const background = "pointer-events-none fixed inset-0 size-full object-cover"
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
const menuButton =
  "rounded-full p-2 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#b31517]"
const menuAction =
  "w-full whitespace-nowrap px-4 py-2 text-left text-sm text-[#b31517] hover:bg-red-50 disabled:opacity-50"

type FriendCardProps = {
  friend: Friend
  statistic: string
  achievementIcon?: string
  isRemoving: boolean
  onRemove: (friend: Friend) => void
}

function FriendCard({
  friend,
  statistic,
  achievementIcon,
  isRemoving,
  onRemove,
}: FriendCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <li className="flex items-center justify-between gap-4 border-b border-gray-200 py-3 text-left">
      <div className="flex min-w-0 items-center gap-3">
        <img
          src={achievementIcon ?? brosIcon}
          alt=""
          aria-hidden="true"
          className="size-10 shrink-0 object-contain"
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{friend.username}</p>
          <p className="text-sm text-gray-700">{statistic}</p>
        </div>
      </div>
      <div className="relative shrink-0">
        <button
          type="button"
          className={menuButton}
          aria-label={`Options for ${friend.username}`}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <img src={vertMenu} alt="" aria-hidden="true" className="size-6 object-contain" />
        </button>
        {isMenuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-10 mt-1 min-w-36 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          >
            <button
              type="button"
              role="menuitem"
              className={menuAction}
              disabled={isRemoving}
              onClick={() => {
                setIsMenuOpen(false)
                onRemove(friend)
              }}
            >
              {isRemoving ? "Removing..." : "Remove"}
            </button>
          </div>
        )}
      </div>
    </li>
  )
}

export default function FriendsPage() {
  const [query, setQuery] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [currentUserId, setCurrentUserId] = useState("")
  const [friends, setFriends] = useState<FriendsByStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRemoving, setIsRemoving] = useState("")
  const [error, setError] = useState("")

  // Resolve the signed-in user before requesting their friend list.
  useEffect(() => {
    let active = true

    async function loadFriends() {
      try {
        const userId = await getCurrentUserId()
        if (!active) return

        setCurrentUserId(userId)
        const result = await getFriendsByStats(userId)
        if (active) {
          setFriends(result)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load friends.")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadFriends()
    return () => {
      active = false
    }
  }, [])

  const refreshFriends = useCallback(async () => {
    if (!currentUserId) return
    setFriends(await getFriendsByStats(currentUserId))
  }, [currentUserId])

  const visibleFriends = useMemo(() => {
    const allFriends = friends
      ? [
          friends.highestStreakFriend,
          friends.mostBuggedFriend,
          ...friends.otherFriends,
        ].filter((friend): friend is Friend => friend !== null)
      : []

    // Featured friends may also appear in the regular list; show each person once.
    return allFriends.filter((friend, index) =>
      allFriends.findIndex((candidate) => candidate.friendId === friend.friendId) === index,
    )
  }, [friends])

  const visibleFriendIds = useMemo(
    () => visibleFriends.map((friend) => friend.friendId),
    [visibleFriends],
  )

  const filteredFriends = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const matches = (friend: Friend | null): friend is Friend =>
      friend !== null &&
      (!normalizedQuery || friend.username.toLowerCase().includes(normalizedQuery))

    return {
      highestStreakFriend: matches(friends?.highestStreakFriend ?? null)
        ? friends?.highestStreakFriend ?? null
        : null,
      mostBuggedFriend: matches(friends?.mostBuggedFriend ?? null)
        ? friends?.mostBuggedFriend ?? null
        : null,
      otherFriends: (friends?.otherFriends ?? []).filter(matches),
    }
  }, [friends, query])

  async function handleRemove(friend: Friend) {
    if (!currentUserId) return
    setError("")
    setIsRemoving(friend.friendId)

    try {
      // Reload the list after removal so featured-friend sections stay up to date.
      await deleteFriend(currentUserId, friend.friendId)
      await refreshFriends()
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove friend.")
    } finally {
      setIsRemoving("")
    }
  }

  function renderFeaturedFriend(
    heading: string,
    subtitle: string,
    friend: Friend | null,
    statistic: (friend: Friend) => string,
    achievementIcon: string,
  ) {
    return (
      <section className="mb-7">
        <header className="border-b border-black/55 pb-2 text-left">
          <h2 className={sectionTitle}>{heading}</h2>
          <p className="text-base">{subtitle}</p>
        </header>
        {friend
          ? (
              <ul>
                <FriendCard
                  friend={friend}
                  statistic={statistic(friend)}
                  achievementIcon={achievementIcon}
                  isRemoving={isRemoving === friend.friendId}
                  onRemove={(selectedFriend) => void handleRemove(selectedFriend)}
                />
              </ul>
            )
          : <p className="py-3 text-left text-gray-600">No friend found.</p>}
      </section>
    )
  }

  function renderOtherFriends(list: Friend[]) {
    return (
      <section className="mb-7">
        <header className="border-b border-black/55 pb-2 text-left">
          <h2 className={sectionTitle}>Regular Bros</h2>
        </header>
        {list.length > 0
          ? (
              <ul>
                {list.map((friend) => (
                  <FriendCard
                    key={friend.friendId}
                    friend={friend}
                    statistic={`${friend.streakCount} day streak · ${friend.bugCount} bugs`}
                    isRemoving={isRemoving === friend.friendId}
                    onRemove={(selectedFriend) => void handleRemove(selectedFriend)}
                  />
                ))}
              </ul>
            )
          : <p className="py-3 text-left text-gray-600">No regular bros found.</p>}
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
          <Link to="/home-page" className={backButton}>Back</Link>
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
              aria-label="Filter your friends"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className={addButton}
            disabled={!currentUserId}
          >
            Add Bros
          </button>
        </div>
        <h1 className={title}>Your Bros</h1>
        {error && <p role="alert" className="mt-4 text-left text-red-700">{error}</p>}
        {isLoading
          ? <p className="mt-9 text-left text-gray-700">Loading your bros...</p>
          : !currentUserId
            ? (
                <p className="mt-5 text-left text-gray-700">
                  <Link to="/" className="text-[#546ac0] underline">Sign in</Link> to view your friends.
                </p>
              )
            : (
              <div className="mt-9">
                {visibleFriends.length === 0 && (
                  <p className="mb-5 text-left text-gray-700">You haven&apos;t added any bros yet.</p>
                )}
                {renderFeaturedFriend(
                  "Best Bro",
                  "Bugged the most",
                  filteredFriends.mostBuggedFriend,
                  (friend) => `${friend.bugCount} bugs · ${friend.streakCount} day streak`,
                  trophyIcon,
                )}
                {renderFeaturedFriend(
                  "Streak Bro",
                  "Highest streak",
                  filteredFriends.highestStreakFriend,
                  (friend) => `${friend.streakCount} day streak · ${friend.bugCount} bugs`,
                  streakIcon,
                )}
                {renderOtherFriends(filteredFriends.otherFriends)}
              </div>
            )}
      </div>
      {showAdd && currentUserId && (
        <AddFriends
          currentUserId={currentUserId}
          friendIds={visibleFriendIds}
          onAdded={refreshFriends}
          onClose={() => setShowAdd(false)}
        />
      )}
    </main>
  )
}
