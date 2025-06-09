import React, { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Loader2, Search, Filter } from "lucide-react";
import useFetch from "../../hooks/useFetch";
import { Page, PageResponse } from "../../models/page/Page";
import PageProfileCard from "./PageProfileCard";
import CreatePageDialog from "./CreatePageDialog";
import UpdatePageDialog from "./UpdatePageDialog";
import PageMembersDialog from "./PageMembersDialog";
import { toast } from "react-toastify";

interface MyPageDetailProps {
  setSelectedPageType: (type: string) => void;
}

const MyPageDetail: React.FC<MyPageDetailProps> = ({ setSelectedPageType }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [filteredPages, setFilteredPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
  const [settingsOpenForPage, setSettingsOpenForPage] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const settingsRef = useRef<HTMLDivElement>(null);
  const lastPageRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isUpdatePageOpen, setIsUpdatePageOpen] = useState(false);
  const [selectedPageForUpdate, setSelectedPageForUpdate] =
    useState<Page | null>(null);

  const { get, put } = useFetch();

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setSettingsOpenForPage(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchMyPages = useCallback(
    async (pageNum: number) => {
      try {
        if (pageNum === 0) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const response = await get("/v1/page/list", {
          isPaged: "1",
          page: pageNum.toString(),
          size: "10",
          status: 1, // Only fetch pages with status 1 (active)
        });

        const data: PageResponse = response.data;
        // Filter pages that are owned by user AND have status 1
        const myPages = data.content.filter(
          (page) => page.isOwner === 1 && page.status === 1
        );

        if (pageNum === 0) {
          setPages(myPages);
          setFilteredPages(myPages);
        } else {
          setPages((prev) => [...prev, ...myPages]);
          setFilteredPages((prev) => [...prev, ...myPages]);
        }

        setTotalPages(data.totalPages);
        setCurrentPage(pageNum);
      } catch (err) {
        console.error("Error fetching pages:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch pages");
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [get]
  );

  // Initial load
  useEffect(() => {
    fetchMyPages(0);
  }, [fetchMyPages]);

  // Setup Intersection Observer for infinite scroll
  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          currentPage < totalPages - 1 &&
          !isLoadingMore
        ) {
          fetchMyPages(currentPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (lastPageRef.current) {
      observer.current.observe(lastPageRef.current);
    }

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [currentPage, totalPages, isLoadingMore, fetchMyPages]);

  // Search and Filter Logic
  useEffect(() => {
    let result = pages;

    if (searchTerm) {
      result = result.filter(
        (page) =>
          page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          page.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory) {
      result = result.filter((page) => page.category === filterCategory);
    }

    setFilteredPages(result);
  }, [searchTerm, filterCategory, pages]);

  const handlePageClick = (pageId: string) => {
    setSelectedPageType(pageId);
  };

  const handleSettingsClick = (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    console.log("Settings clicked for page:", pageId);
    setSettingsOpenForPage(settingsOpenForPage === pageId ? null : pageId);
  };

  const handleUpdatePage = (pageId: string) => {
    const pageToUpdate = pages.find((p) => p._id === pageId);
    if (pageToUpdate) {
      setSelectedPageForUpdate(pageToUpdate);
      setIsUpdatePageOpen(true);
    }
    setSettingsOpenForPage(null);
  };

  // const handleAddMember = (pageId: string, e?: React.MouseEvent) => {
  //   if (e) {
  //     e.preventDefault();
  //     e.stopPropagation();
  //   }
  //   console.log('Opening members dialog for page:', pageId);
  //   setSelectedPageId(pageId);
  //   setIsMembersDialogOpen(true);
  //   setSettingsOpenForPage(null);
  // };

  // const handleToggleStatus = async (pageId: string) => {
  //   try {
  //     const page = pages.find(p => p._id === pageId);
  //     if (!page) return;

  //     const response = await post(`/v1/page/${pageId}/toggle-status`, {
  //       isPublished: !page.isPublished
  //     });

  //     if (response.result) {
  //       toast.success(page.isPublished ? 'Đã ẩn trang' : 'Đã công khai trang');
  //       fetchMyPages(0);
  //     } else {
  //       toast.error('Có lỗi xảy ra khi thay đổi trạng thái trang');
  //     }
  //   } catch (err) {
  //     toast.error('Có lỗi xảy ra khi thay đổi trạng thái trang');
  //   }
  //   setSettingsOpenForPage(null);
  // };

  const handleDeletePage = async (pageId: string) => {
    const confirmed = await new Promise((resolve) => {
      toast.info(
        <div className="flex flex-col items-center">
          <p className="font-semibold mb-2">Xác nhận xóa trang</p>
          <p className="text-sm text-gray-600">
            Bạn có chắc chắn muốn xóa trang này?
          </p>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => {
                toast.dismiss();
                resolve(true);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Xóa
            </button>
            <button
              onClick={() => {
                toast.dismiss();
                resolve(false);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Hủy
            </button>
          </div>
        </div>,
        {
          position: "top-center",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        }
      );
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await put(`/v1/page/change-status`, {
        id: pageId,
        status: 3, // 3 represents deleted status
      });

      if (response.result) {
        toast.success("Đã xóa trang thành công");
        fetchMyPages(0);
      } else {
        toast.error("Có lỗi xảy ra khi xóa trang");
      }
    } catch (err) {
      toast.error("Có lỗi xảy ra khi xóa trang");
    }
    setSettingsOpenForPage(null);
  };

  const handleCreatePageSuccess = () => {
    fetchMyPages(0);
    setIsCreatePageOpen(false);
  };

  const handleUpdatePageSuccess = () => {
    fetchMyPages(0);
    setIsUpdatePageOpen(false);
    setSelectedPageForUpdate(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto w-12 h-12 animate-spin text-indigo-600" />
          <p className="mt-4 text-gray-600">Đang tải trang...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="bg-white shadow-xl rounded-xl p-8 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => fetchMyPages(0)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Dynamically generate unique categories
  const uniqueCategories = Array.from(
    new Set(pages.map((page) => page.category))
  ).filter((category) => category); // Remove empty categories if any

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-white shadow-md rounded-lg mb-8">
          <div className="px-6 py-4">
            {/* Top Section with Title and Create Button */}
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-3xl font-extrabold text-gray-900">
                Trang của tôi
              </h1>
              <button
                onClick={() => setIsCreatePageOpen(true)}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
              >
                <Plus size={20} className="stroke-2" />
                <span className="font-medium">Tạo trang mới</span>
              </button>
            </div>

            {/* Search and Filter Section */}
            <div className="flex space-x-4">
              {/* Search Input */}
              <div className="flex-grow relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm trang..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Search
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
                >
                  <option value="">Tất cả danh mục</option>
                  {uniqueCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <Filter
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredPages.length === 0 && !isLoading && (
          <div className="text-center bg-white shadow-xl rounded-xl p-12">
            <div className="mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-24 w-24 mx-auto text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              {searchTerm || filterCategory
                ? "Không tìm thấy trang phù hợp"
                : "Chưa có trang nào"}
            </h2>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterCategory
                ? "Thử điều chỉnh tìm kiếm hoặc bộ lọc"
                : "Bắt đầu bằng việc tạo trang của riêng bạn"}
            </p>
            <button
              onClick={() => setIsCreatePageOpen(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Tạo trang mới
            </button>
          </div>
        )}

        {/* Pages List with fixed height and overflow */}
        <div className="space-y-4 h-[calc(100vh-300px)] overflow-y-auto">
          {filteredPages.map((page, index) => (
            <div
              key={page._id}
              ref={index === filteredPages.length - 1 ? lastPageRef : undefined}
              className="relative"
            >
              <div className="relative">
                <PageProfileCard
                  page={page}
                  onPageClick={handlePageClick}
                  onSettingsClick={handleSettingsClick}
                  onUpdate={handleUpdatePage}
                  onDelete={handleDeletePage}
                />
              </div>
            </div>
          ))}

          {/* Loading More Indicator */}
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          )}

          {/* No More Pages Indicator */}
          {currentPage >= totalPages - 1 && filteredPages.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              Đã hiển thị tất cả trang ({totalPages} trang)
            </div>
          )}
        </div>
      </div>

      <CreatePageDialog
        isOpen={isCreatePageOpen}
        onClose={() => setIsCreatePageOpen(false)}
        onSuccess={handleCreatePageSuccess}
      />

      {selectedPageForUpdate && (
        <UpdatePageDialog
          isOpen={isUpdatePageOpen}
          onClose={() => {
            setIsUpdatePageOpen(false);
            setSelectedPageForUpdate(null);
          }}
          onSuccess={handleUpdatePageSuccess}
          page={selectedPageForUpdate}
        />
      )}

      {selectedPageId && (
        <PageMembersDialog
          isOpen={isMembersDialogOpen}
          onClose={() => {
            console.log("Closing members dialog");
            setIsMembersDialogOpen(false);
            setSelectedPageId(null);
          }}
          pageId={selectedPageId}
        />
      )}
    </div>
  );
};

export default MyPageDetail;
