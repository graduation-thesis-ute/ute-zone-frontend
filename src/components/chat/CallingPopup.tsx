import React, { useState, useEffect } from "react";
import { PhoneOff, Phone } from "lucide-react";

interface CallingPopupProps {
  receiverId: string;
  receiverName?: string;
  receiverAvatar?: string;
  onCancelCall: () => void;
}

const CallingPopup: React.FC<CallingPopupProps> = ({
  receiverId,
  receiverName,
  receiverAvatar,
  onCancelCall,
}) => {
  const [callDuration, setCallDuration] = useState(0);
  const displayName = receiverName || receiverId;

  // Animated dots for "Calling..." text
  const [dots, setDots] = useState("");

  useEffect(() => {
    // Timer for call duration
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Animated dots
    const dotsTimer = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(dotsTimer);
    };
  }, []);

  // Format call duration
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white p-6 rounded-xl shadow-xl z-50 border border-gray-200 w-64 transition-all duration-300 hover:shadow-2xl">
      <div className="flex flex-col items-center">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center mb-3 shadow-md">
          {receiverAvatar ? (
            <img
              src={receiverAvatar}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white text-xl font-bold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Call status */}
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          Calling{dots}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{displayName}</p>

        {/* Call duration */}
        <div className="text-xs text-gray-500 mt-2">
          {formatTime(callDuration)}
        </div>

        {/* Call controls */}
        <div className="mt-6 flex justify-center space-x-4">
          <button
            onClick={onCancelCall}
            className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform duration-300"
            aria-label="End call"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>

      {/* Connection status */}
      <div className="mt-4 pt-2 border-t border-gray-100 flex justify-center">
        <p className="text-xs text-gray-500 flex items-center">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          Secure connection
        </p>
      </div>
    </div>
  );
};

export default CallingPopup;
