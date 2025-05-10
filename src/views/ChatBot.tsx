import React, { useState, useRef } from "react";
import { remoteUrl } from "../types/constant";

const Chatbot: React.FC = () => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleAsk = () => {
    if (!question.trim()) return;

    setAnswer("");
    setIsLoading(true);

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(
      `${remoteUrl}/v1/chatbot/chat?question=${encodeURIComponent(question)}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.token) {
        setAnswer((prev) => prev + data.token);
      } else if (data.done) {
        setIsLoading(false);
        eventSource.close();
      } else if (data.error) {
        setAnswer((prev) => prev + `\n[ERROR]: ${data.error}`);
        setIsLoading(false);
        eventSource.close();
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      setAnswer((prev) => prev + `\n[Connection error: ${error.type}]`);
      setIsLoading(false);
      eventSource.close();
    };

    eventSource.onopen = () => {
      console.log("EventSource connection opened");
    };
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-2xl font-bold mb-4">HCMUTE Chatbot</h1>
      <div className="w-full max-w-2xl">
        <textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring focus:border-blue-400"
          placeholder="Nhập câu hỏi của bạn..."
        />
        <button
          onClick={handleAsk}
          disabled={isLoading}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Đang trả lời..." : "Gửi câu hỏi"}
        </button>
        <div className="mt-6 p-4 bg-white rounded-lg shadow border border-gray-200 whitespace-pre-wrap min-h-[200px]">
          {answer || "Phản hồi sẽ hiển thị tại đây..."}
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
