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

// Keep page layout and card styling together for consistent, scannable sections.
const page = "relative min-h-dvh overflow-x-hidden font-sans"
const background = "pointer-events-none fixed inset-0 size-full object-cover"
const panel =
  "relative mx-auto min-h-dvh w-full max-w-[600px] bg-white px-4 pb-6 pt-3 shadow-[0_4px_16px_#000] sm:px-7 lg:px-8"
const toolbar = "flex flex-wrap items-center gap-2"
const backButton = "mr-auto text-base text-[#546ac0] hover:underline"
const searchField =
  "order-3 flex h-9 w-full items-center gap-2 rounded-md border-2 border-[#919191] px-2 sm:order-none sm:w-auto sm:flex-1"
const searchInput =
  "min-w-0 flex-1 border-0 bg-transparent text-sm outline-none placeholder:text-black"
const addButton =
  "rounded-lg border border-[#ccc] bg-[#b31517] px-3 py-1.5 text-sm text-white hover:bg-[#951214]"
const title =
  "mt-5 block text-left text-[30px]! leading-tight font-bold underline decoration-[#B31517] decoration-[12.5%] underline-offset-4 sm:text-[34px]!"
const sectionTitle = "text-left text-lg leading-none"
const menuButton =
  "rounded-full p-1.5 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#b31517]"
const menuAction =
  "w-full whitespace-nowrap px-3 py-1.5 text-left text-xs text-[#b31517] hover:bg-red-50 disabled:opacity-50"
const confirmOverlay =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-2"
const confirmPopup =
  "flex w-full max-w-[340px] flex-col items-center rounded-lg bg-white px-5 py-5 text-center shadow-[0_4px_16px_#000]"
const confirmButton =
  "rounded-md bg-[#b31517] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#951214] disabled:cursor-not-allowed disabled:opacity-50"
const cancelButton =
  "rounded-md border border-gray-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"

type FriendCardProps = {
  friend: Friend
  statistic: string
  achievementIcon?: string
  isRemoving: boolean
  onRemove: (friend: Friend) => void
}

// Each friend card shows stats and a menu for removing the relationship in place.
function FriendCard({
  friend,
  statistic,
  achievementIcon,
  isRemoving,
  onRemove,
}: FriendCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <li className="flex items-center justify-between gap-2 border-b border-gray-200 py-1.5 text-left">
      <div className="flex min-w-0 items-center gap-1.5">
        <img
          src={achievementIcon ?? brosIcon}
          alt=""
          aria-hidden="true"
          className="size-6 shrink-0 object-contain"
        />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{friend.username}</p>
          <p className="text-xs text-gray-700">{statistic}</p>
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
          <img src={vertMenu} alt="" aria-hidden="true" className="size-3.5 object-contain" />
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
  // Keep the selected friend pending until the user confirms or cancels removal.
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null)
  const [currentUserId, setCurrentUserId] = useState("")
  const [friends, setFriends] = useState<FriendsByStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRemoving, setIsRemoving] = useState("")
  const [error, setError] = useState("")

  // Load the signed-in user's friend list and report request errors.
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

  // Combine featured and regular friends so duplicates can be filtered out.
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

  // Filter the friend sections by username while preserving their groups.
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

  // Remove confirmed friends and refresh all friend sections.
  async function handleRemove(friend: Friend) {
    if (!currentUserId) return
    setError("")
    setIsRemoving(friend.friendId)

    try {
      // Reload the list after removal so featured-friend sections stay up to date.
      await deleteFriend(currentUserId, friend.friendId)
      await refreshFriends()
      setFriendToRemove(null)
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Unable to remove friend.")
    } finally {
      setIsRemoving("")
    }
  }

  // Render the featured friend sections with a consistent layout.
  function renderFeaturedFriend(
    heading: string,
    subtitle: string,
    friend: Friend | null,
    statistic: (friend: Friend) => string,
    achievementIcon: string,
  ) {
    return (
      <section className="mb-3">
        <header className="border-b border-black/55 pb-2 text-left">
          <h2 className={sectionTitle}>{heading}</h2>
          <p className="text-sm">{subtitle}</p>
        </header>
        {friend
          ? (
              <ul>
                <FriendCard
                  friend={friend}
                  statistic={statistic(friend)}
                  achievementIcon={achievementIcon}
                  isRemoving={isRemoving === friend.friendId}
                  onRemove={(selectedFriend) => {
                    setError("")
                    setFriendToRemove(selectedFriend)
                  }}
                />
              </ul>
            )
          : <p className="py-2 text-left text-sm text-gray-600">No friend found.</p>}
      </section>
    )
  }

  function renderOtherFriends(list: Friend[]) {
    return (
      <section className="mb-3">
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
                    onRemove={(selectedFriend) => {
                      setError("")
                      setFriendToRemove(selectedFriend)
                    }}
                  />
                ))}
              </ul>
            )
          : <p className="py-2 text-left text-sm text-gray-600">No regular bros found.</p>}
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
              className="size-5"
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
        {error && !friendToRemove && (
          <p role="alert" className="mt-4 text-left text-red-700">{error}</p>
        )}
        {isLoading
          ? <p className="mt-9 text-left text-gray-700">Loading your bros...</p>
          : !currentUserId
            ? (
                <p className="mt-5 text-left text-gray-700">
                  <Link to="/" className="text-[#546ac0] underline">Sign in</Link> to view your friends.
                </p>
              )
            : (
              <div className="mt-4">
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
      {friendToRemove && (
        <div
          className={confirmOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="remove-friend-title"
          aria-describedby="remove-friend-description"
        >
          <div className={confirmPopup}>
            <h2 id="remove-friend-title" className="text-lg font-bold">
              Remove {friendToRemove.username}?
            </h2>
            <p id="remove-friend-description" className="mt-2 text-sm">
              Are you sure you want to remove this friend?
            </p>
            {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className={cancelButton}
                disabled={isRemoving === friendToRemove.friendId}
                onClick={() => {
                  setFriendToRemove(null)
                  setError("")
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={confirmButton}
                disabled={isRemoving === friendToRemove.friendId}
                onClick={() => void handleRemove(friendToRemove)}
              >
                {isRemoving === friendToRemove.friendId ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
