import React, { useState, useEffect } from "react";
import { Phone, PhoneOff, User } from "lucide-react";

interface IncomingCallPopupProps {
  callerName?: string;
  callerAvatar?: string;
  onAcceptCall: () => void;
  onRejectCall: () => void;
}

const IncomingCallPopup: React.FC<IncomingCallPopupProps> = ({
  callerName,
  callerAvatar,
  onAcceptCall,
  onRejectCall,
}) => {
  const displayName = callerName;

  // State for animation effects
  const [isRinging, setIsRinging] = useState(true);
  const [ringCount, setRingCount] = useState(0);

  // Ringing animation effect
  useEffect(() => {
    const ringInterval = setInterval(() => {
      setIsRinging((prev) => !prev);
      setRingCount((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(ringInterval);
  }, []);

  return (
    <div
      className={`fixed top-20 left-1/2 transform -translate-x-1/2 bg-white p-6 rounded-xl shadow-xl z-50 border border-gray-200 w-64 ${
        isRinging ? "scale-105" : "scale-100"
      } transition-transform duration-300`}
    >
      <div className="flex flex-col items-center">
        {/* Avatar with ring animation */}
        <div className="relative w-20 h-20 mb-3">
          <div
            className={`absolute inset-0 rounded-full bg-green-500 opacity-20 ${
              isRinging ? "scale-110" : "scale-100"
            } transition-transform duration-300`}
          ></div>
          <div
            className={`absolute inset-0 rounded-full bg-green-500 opacity-10 ${
              isRinging ? "scale-125" : "scale-105"
            } transition-transform duration-300`}
          ></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center shadow-md overflow-hidden">
            {callerAvatar ? (
              <img
                src={callerAvatar}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="text-white w-8 h-8" />
            )}
          </div>
        </div>

        {/* Call info */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 animate-pulse">
            Cuộc gọi đến
          </h3>
          <p className="text-sm text-gray-600 mt-1 font-medium">
            {displayName}
          </p>
          {/* <p className="text-xs text-gray-500 mt-1">{callerId}</p> */}
        </div>

        {/* Call controls */}
        <div className="mt-6 flex space-x-6 justify-center">
          <button
            onClick={onAcceptCall}
            className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
            aria-label="Accept call"
          >
            <Phone size={20} />
          </button>
          <button
            onClick={onRejectCall}
            className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
            aria-label="Reject call"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>

      {/* Custom ripple animation for ringing effect */}
      <div className="mt-4 pt-2 border-t border-gray-100 flex justify-center">
        <div className="flex items-center">
          <span
            className={`h-2 w-2 rounded-full bg-green-500 mr-1 ${
              ringCount % 2 === 0 ? "opacity-100" : "opacity-50"
            }`}
          ></span>
          <span
            className={`h-2 w-2 rounded-full bg-green-500 mr-1 ${
              ringCount % 2 === 1 ? "opacity-100" : "opacity-50"
            }`}
          ></span>
          <span
            className={`h-2 w-2 rounded-full bg-green-500 ${
              ringCount % 3 === 0 ? "opacity-100" : "opacity-50"
            }`}
          ></span>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallPopup;
