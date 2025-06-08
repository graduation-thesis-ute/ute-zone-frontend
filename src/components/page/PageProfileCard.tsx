import React, { useState, useRef, useEffect } from "react";
import { Users, Bookmark, Settings } from "lucide-react";
import { Page } from "../../models/page/Page";
import PageSettingsDropdown from "./PageSettingsDropdown";

interface PageProfileCardProps {
  page: Page;
  onPageClick: (pageId: string) => void;
  onSettingsClick: (e: React.MouseEvent, pageId: string) => void;
  onUpdate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
}

const PageProfileCard: React.FC<PageProfileCardProps> = ({
  page,
  onPageClick,
  onUpdate,
  onDelete,
}) => {
  const [coverError, setCoverError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSettingsOpen(!isSettingsOpen);
  };

  const handleUpdate = () => {
    onUpdate(page._id);
    setIsSettingsOpen(false);
  };

  const handleDelete = () => {
    onDelete(page._id);
    setIsSettingsOpen(false);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onPageClick(page._id)}
    >
      {/* Cover Image */}
      <div className="h-32 bg-gray-200 relative">
        {page.coverUrl && !coverError ? (
          <img
            src={page.coverUrl}
            alt={`${page.name} cover`}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setCoverError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500" />
        )}
        {/* Avatar */}
        <div className="absolute -bottom-12 left-4">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden">
            {page.avatarUrl && !avatarError ? (
              <img
                src={page.avatarUrl}
                alt={`${page.name} avatar`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <span className="text-2xl text-gray-500">
                  {page.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page Info */}
      <div className="pt-14 px-4 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{page.name}</h3>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
              {page.description}
            </p>
            <p className="text-xs text-gray-500 mt-1">{page.category}</p>
          </div>
          <div ref={settingsRef} className="relative">
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={handleSettingsClick}
            >
              <Settings size={20} />
            </button>
            <PageSettingsDropdown
              isOpen={isSettingsOpen}
              onClose={() => setIsSettingsOpen(false)}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex space-x-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Users size={16} />
            <span>{page.totalFollowers} người theo dõi</span>
          </div>
          <div className="flex items-center space-x-1">
            <Bookmark size={16} />
            <span>Đã tạo {new Date(page.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageProfileCard;
