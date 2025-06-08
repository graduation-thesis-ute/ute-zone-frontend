import React, { useRef, useState, useEffect } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Maximize,
  Minimize,
  MessageSquare,
  Users,
  Timer,
} from "lucide-react";

interface VideoCallModalProps {
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  onEndCall: () => void;
  callerName: string;
  callerAvatar: string;
  receiverName: string;
  receiverAvatar: string;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  localStream,
  remoteStream,
  onEndCall,
  callerName,
  callerAvatar,
  receiverName,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  //const [isConnectionStrong, setIsConnectionStrong] = useState(true);
  const [showControlsTimer, setShowControlsTimer] =
    useState<NodeJS.Timeout | null>(null);
  const [areControlsVisible, setAreControlsVisible] = useState(true);

  // Initialize localStreamRef when localStream prop changes
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [localStream, remoteStream]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Simulate network condition changes
    // const networkTimer = setInterval(() => {
    //   setIsConnectionStrong(Math.random() > 0.2); // 80% chance of good connection
    // }, 8000);

    return () => {
      clearInterval(timer);
      //clearInterval(networkTimer);
    };
  }, []);

  // Auto-hide controls after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setAreControlsVisible(true);

      if (showControlsTimer) {
        clearTimeout(showControlsTimer);
      }

      const timer = setTimeout(() => {
        setAreControlsVisible(false);
      }, 3000);

      setShowControlsTimer(timer);
    };

    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (showControlsTimer) clearTimeout(showControlsTimer);
    };
  }, [showControlsTimer]);

  // Function to toggle mic
  const toggleMic = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach((track) => (track.enabled = !isMicOn));
      setIsMicOn(!isMicOn);
    }
  };

  // Function to toggle camera
  const toggleCamera = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach((track) => (track.enabled = !isCameraOn));
      setIsCameraOn(!isCameraOn);
    }
  };

  // Function to toggle fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  // Get display names
  // const displayReceiverName = receiverName;
  // const displayCallerName = callerName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div
        ref={containerRef}
        className="relative w-full max-w-4xl h-[80vh] bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Connection quality indicator */}
        {/* <div
          className={`absolute top-2 right-2 z-20 flex items-center space-x-1 px-2 py-1 rounded-full ${
            isConnectionStrong
              ? "bg-green-700 bg-opacity-70"
              : "bg-yellow-700 bg-opacity-70"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isConnectionStrong ? "bg-green-400" : "bg-yellow-400"
            } animate-pulse`}
          ></div>
          <span className="text-xs text-white">
            {isConnectionStrong ? "Good connection" : "Weak signal"}
          </span>
        </div> */}

        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover rounded-t-xl"
        />

        {/* Remote user info - visible when video is off or at start */}
        {/* <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10">
          {receiverAvatar && (
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-2 border-2 border-blue-400 shadow-lg">
              <img
                src={receiverAvatar}
                alt={displayReceiverName || "Receiver"}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div> */}

        {/* Local Video with border indicator for mic status */}
        <div
          className={`absolute bottom-6 right-6 w-48 h-36 bg-gray-800 rounded-lg shadow-md transition-all duration-300 border-2 ${
            isMicOn ? "border-blue-500" : "border-red-500"
          }`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover rounded-lg"
          />

          {/* Local user info - visible when camera is off */}
          {!isCameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-80 rounded-lg">
              {callerAvatar ? (
                <img
                  src={callerAvatar}
                  alt={callerName || "Caller"}
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-lg font-bold">
                    {callerName ? callerName.charAt(0).toUpperCase() : ""}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mic status indicator on local video */}
          <div
            className={`absolute bottom-1 right-1 p-1 rounded-full ${
              isMicOn ? "bg-blue-500" : "bg-red-500"
            }`}
          >
            {isMicOn ? (
              <Mic size={12} className="text-white" />
            ) : (
              <MicOff size={12} className="text-white" />
            )}
          </div>
        </div>

        {/* Call information */}
        <div
          className={`absolute top-4 left-4 text-white transition-opacity duration-300 ${
            areControlsVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center space-x-2">
            <Users size={16} className="text-blue-400" />
            <p className="text-sm font-semibold">{receiverName}</p>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <Timer size={16} className="text-green-400" />
            <p className="text-xs">{formatTime(callDuration)}</p>
          </div>
        </div>

        {/* Control bar */}
        <div
          className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-3 px-4 py-3 bg-gray-800 bg-opacity-80 rounded-full shadow-lg transition-opacity duration-300 ${
            areControlsVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full shadow transition-colors ${
              isMicOn
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-red-600 hover:bg-red-500"
            } text-white`}
            title={isMicOn ? "Turn off microphone" : "Turn on microphone"}
          >
            {isMicOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button
            onClick={toggleCamera}
            className={`p-3 rounded-full shadow transition-colors ${
              isCameraOn
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-red-600 hover:bg-red-500"
            } text-white`}
            title={isCameraOn ? "Turn off camera" : "Turn on camera"}
          >
            {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>

          <button
            onClick={onEndCall}
            className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg transform hover:scale-110"
            title="End call"
          >
            <PhoneOff size={24} />
          </button>

          <button
            onClick={toggleFullScreen}
            className="p-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full transition-colors shadow"
            title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>

        {/* Call quality indicator */}
        {/* <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex space-x-1">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`w-1 rounded-full ${
                isConnectionStrong
                  ? bar <= 3
                    ? "bg-green-400"
                    : "bg-gray-600"
                  : bar <= 1
                  ? "bg-yellow-400"
                  : "bg-gray-600"
              }`}
              style={{
                height: `${bar * 4}px`,
              }}
            ></div>
          ))}
        </div> */}
      </div>
    </div>
  );
};

export default VideoCallModal;
