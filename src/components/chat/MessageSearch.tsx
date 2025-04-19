import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Loader2, MessageSquare, ImageIcon } from "lucide-react";
import UserIcon from "../../assets/user_icon.png";
import useFetch from "../../hooks/useFetch";
import { decrypt } from "../../types/utils";
import { Message, UserProfile } from "../../models/profile/chat";

const MessageSearch = ({
  conversation,
  onMessageSelect,
  userCurrent,
}: {
  userCurrent: UserProfile | null;
  conversation: any;
  onMessageSelect: (id: string) => void;
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [totalSearchResults, setTotalSearchResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchComplete, setIsSearchComplete] = useState(false);
  const [page, setPage] = useState(0); // Track current page
  const [hasMore, setHasMore] = useState(true); // Track if more results are available
  const { get } = useFetch();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(
    async (pageNum: number, append: boolean = false) => {
      if (!searchQuery.trim() || !hasMore) return;

      setIsLoading(true);
      try {
        const res = await get(
          `/v1/message/list?conversation=${
            conversation._id
          }&content=${encodeURIComponent(searchQuery)}&page=${pageNum}&size=10`
        );
        const data = await res.data.content;
        const total = await res.data.totalElements;

        setSearchResults((prev) => (append ? [...prev, ...data] : data || []));
        setTotalSearchResults(total);
        setHasMore(data.length === 10); // Assume 10 is the page size
        setPage(pageNum);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
        setIsSearchComplete(true);
      }
    },
    [searchQuery, conversation._id, get, hasMore]
  );

  const handleSearch = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      setPage(0);
      setHasMore(true);
      await fetchMessages(0, false); // Fetch first page
    }
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!isSearchOpen || !hasMore || isLoading) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMessages(page + 1, true); // Fetch next page
        }
      },
      { threshold: 1.0 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current && observerRef.current) {
        observerRef.current.unobserve(loadMoreRef.current);
      }
    };
  }, [isSearchOpen, hasMore, isLoading, page, fetchMessages]);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      searchRef.current &&
      !searchRef.current.contains(event.target as Node)
    ) {
      resetSearch();
    }
  };

  useEffect(() => {
    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      inputRef.current?.focus();
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  const resetSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setTotalSearchResults(0);
    setSearchResults([]);
    setIsSearchComplete(false);
    setPage(0);
    setHasMore(true);
  };

  return (
    <div className="relative" ref={searchRef}>
      {!isSearchOpen ? (
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 text-gray-600 dark:text-gray-300"
          aria-label="Search messages"
          title="Tìm kiếm tin nhắn"
        >
          <Search size={20} />
        </button>
      ) : (
        <div className="absolute right-0 top-0 flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
          <div className="flex items-center pl-3 text-gray-400">
            <Search size={18} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Tìm kiếm tin nhắn..."
            className="w-64 p-2.5 pl-2 focus:outline-none bg-transparent text-gray-800 dark:text-gray-200 text-sm"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="p-1 mr-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X size={16} className="text-gray-500 dark:text-gray-400" />
            </button>
          )}
          <button
            onClick={resetSearch}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors border-l border-gray-100 dark:border-gray-700"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {isSearchOpen &&
        (searchResults.length > 0 ||
          isLoading ||
          (isSearchComplete && searchQuery.trim())) && (
          <div className="absolute z-50 right-0 top-12 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            {isLoading && !searchResults.length ? (
              <div className="p-6 flex flex-col items-center justify-center text-center">
                <Loader2
                  size={24}
                  className="text-indigo-500 animate-spin mb-2"
                />
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Đang tìm kiếm...
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <div className="p-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600 sticky top-0 z-10">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Tìm thấy {totalSearchResults} kết quả cho "{searchQuery}"
                  </p>
                </div>
                {searchResults.map((message: Message, index) => (
                  <div
                    key={message._id}
                    onClick={() => {
                      onMessageSelect(message._id);
                      resetSearch();
                    }}
                    className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                      index < searchResults.length - 1
                        ? "border-b border-gray-100 dark:border-gray-700"
                        : ""
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1.5">
                      <img
                        src={message.user.avatarUrl || UserIcon}
                        alt={message.user.displayName}
                        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
                          {message.user.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {message.createdAt}
                        </p>
                      </div>
                    </div>
                    <div className="pl-10">
                      {message.content ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                          {decrypt(message.content, userCurrent?.secretKey)}
                        </p>
                      ) : message.imageUrl ? (
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <ImageIcon size={14} className="mr-1" />
                          <span>Hình ảnh</span>
                        </div>
                      ) : (
                        <p className="text-sm italic text-gray-500 dark:text-gray-400">
                          Không thể hiển thị tin nhắn
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {hasMore && (
                  <div ref={loadMoreRef} className="p-4 flex justify-center">
                    <Loader2
                      size={20}
                      className="text-indigo-500 animate-spin"
                    />
                  </div>
                )}
              </div>
            ) : isSearchComplete && !isLoading && searchQuery.trim() ? (
              <div className="p-6 flex flex-col items-center justify-center text-center">
                <MessageSquare size={24} className="text-gray-400 mb-2" />
                <p className="text-gray-600 dark:text-gray-300 font-medium">
                  Không tìm thấy kết quả
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  Không tìm thấy tin nhắn nào cho "{searchQuery}"
                </p>
              </div>
            ) : null}
          </div>
        )}
    </div>
  );
};

export default MessageSearch;
