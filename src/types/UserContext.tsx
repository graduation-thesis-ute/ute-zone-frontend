import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Profile } from "../models/profile/Profile";
import { remoteUrl } from "../types/constant";

interface UserContextType {
  profile: Profile | null; // User có thể null nếu chưa đăng nhập
  setProfile: (profile: Profile | null) => void; // Hàm để cập nhật user
  fetchUserProfile: () => Promise<void>;
  isLoading: boolean;
}

// Khởi tạo context
const UserContext = createContext<UserContextType | undefined>(undefined);

// Tạo provider để bọc ứng dụng
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<Profile | null>(null); // State để lưu thông tin user
  const [isLoading, setIsLoading] = useState(false);

  // Hàm lấy thông tin user
  const fetchUserProfile = async () => {
    console.log('Fetching user profile...');
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.log('No token found');
        setProfile(null);
        return;
      }

      const response = await fetch(`${remoteUrl}/v1/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Profile API response status:', response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error('Profile fetch failed:', data);
        setProfile(null);
        return;
      }

      const data = await response.json();
      console.log('Profile data received:', data);
      
      setProfile(data.data);
      console.log('Global profile updated');
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Tự động lấy profile khi có token
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      console.log('Token found, fetching initial profile...');
      fetchUserProfile();
    }
  }, []);

  return (
    <UserContext.Provider 
      value={{ 
        profile, 
        setProfile, 
        fetchUserProfile,
        isLoading 
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Hook để sử dụng UserContext
export const useProfile = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useProfile phải được sử dụng trong UserProvider");
  }
  return context;
};
