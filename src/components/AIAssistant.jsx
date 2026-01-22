// src/components/AIAssistant.jsx
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Send,
  Bot,
  User,
  Clock,
  Copy,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  Mic,
  MicOff,
  Volume2,
  X,
} from "lucide-react";
import { aiService } from "../utils/ai-service";
import useUserInfo from "../hooks/useUserInfo";

const AIAssistant = ({ onClose, isFullPage = false }) => {
  const { t } = useTranslation();
  const { userInfo, getAvatar } = useUserInfo();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [typingText, setTypingText] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [aiStatus, setAiStatus] = useState({});

  // Avatar sizes
  const AVATAR_SIZES = {
    normal: {
      container: "w-14 h-14",
      icon: "w-7 h-7",
    },
    header: {
      container: "w-14 h-14",
      icon: "w-7 h-7",
    },
    typing: {
      container: "w-14 h-14",
      icon: "w-7 h-7",
    },
  };

  // Initialization
  useEffect(() => {
    setAiStatus(aiService.getStatus());

    // Welcome message
    const welcomeMessage = {
      id: "welcome",
      text:
        t("ai_welcome") ||
        `Hello! I am ${aiService.name} - your AI human rights advisor.\n\nI can help with:\n• Explanation of human rights\n• References to laws and articles\n• Practical advice on rights protection\n• International protection mechanisms\n\nAsk your question!`,
      sender: "ai",
      timestamp: new Date().toISOString(),
      status: "sent",
    };

    setMessages([welcomeMessage]);
    scrollToBottom();

    // Focus on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
  }, [t]);

  // Scroll to last message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message
  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || inputMessage.trim();

    if (!textToSend || isLoading) return;

    // Add user message
    const userMessage = {
      id: `user_${Date.now()}`,
      text: textToSend,
      sender: "user",
      timestamp: new Date().toISOString(),
      status: "sending",
      avatarUrl: getAvatar(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate AI typing
    setTypingText(t("ai_typing") || "Atticus is typing...");

    try {
      // Call AI service
      const response = await aiService.sendMessage(textToSend);

      if (response.success) {
        // Add AI response
        const aiMessage = {
          id: `ai_${Date.now()}`,
          text: response.message,
          sender: "ai",
          timestamp: response.timestamp,
          status: "sent",
          responseTime: response.responseTime,
        };

        setMessages((prev) => [
          ...prev.slice(0, -1),
          { ...userMessage, status: "sent" },
          aiMessage,
        ]);
      } else {
        // Error
        const errorMessage = {
          id: `error_${Date.now()}`,
          text: `${t("ai_error") || "Error"}: ${response.error}`,
          sender: "error",
          timestamp: new Date().toISOString(),
          status: "error",
        };

        setMessages((prev) => [
          ...prev.slice(0, -1),
          { ...userMessage, status: "error" },
          errorMessage,
        ]);
      }
    } catch (error) {
      console.error("Send error:", error);

      const errorMessage = {
        id: `error_${Date.now()}`,
        text: `${t("ai_error") || "Connection error with AI. Please try again."}`,
        sender: "error",
        timestamp: new Date().toISOString(),
        status: "error",
      };

      setMessages((prev) => [
        ...prev.slice(0, -1),
        { ...userMessage, status: "error" },
        errorMessage,
      ]);
    } finally {
      setIsLoading(false);
      setTypingText("");
      inputRef.current?.focus();
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Copy text
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // You can add a toast notification here
      console.log("Text copied");
    });
  };

  // Clear chat history
  const clearChat = () => {
    if (window.confirm(t("ai_clear_confirm") || "Clear chat history?")) {
      setMessages([]);
      aiService.clearHistory();

      // Add new welcome message
      const welcomeMessage = {
        id: "welcome_cleared",
        text:
          t("ai_welcome") ||
          `Hello! I am ${aiService.name} - your AI human rights advisor.`,
        sender: "ai",
        timestamp: new Date().toISOString(),
        status: "sent",
      };

      setMessages([welcomeMessage]);
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Format response duration
  const formatResponseTime = (ms) => {
    if (!ms) return "";
    return `${ms}ms`;
  };

  // Start/stop voice recording
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Web Speech API implementation will be here
    if (!isRecording) {
      console.log("Starting voice recording");
    } else {
      console.log("Stopping voice recording");
    }
  };

  // Get user avatar
  const getUserAvatar = (message) => {
    if (message.sender === "user" && message.avatarUrl) {
      return message.avatarUrl;
    }
    return null;
  };

  // Function to get AI avatar
  const getAIAvatar = () => {
    return "/atticus.png";
  };

  // Render a single message
  const MessageBubble = ({ message }) => {
    const isUser = message.sender === "user";
    const isError = message.sender === "error";
    const userAvatar = getUserAvatar(message);
    const sizes = AVATAR_SIZES.normal;

    return (
      <div className={`flex gap-3 mb-4 ${isUser ? "flex-row-reverse" : ""}`}>
        {/* Avatar */}
        <div
          className={`flex-shrink-0 ${sizes.container} rounded-full flex items-center justify-center overflow-hidden ${
            isUser
              ? "bg-blue-100 dark:bg-blue-900"
              : isError
                ? "bg-red-100 dark:bg-red-900"
                : "bg-purple-100 dark:bg-purple-900"
          }`}
        >
          {userAvatar ? (
            // User avatar
            <img
              src={userAvatar}
              alt="User avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentNode.innerHTML = `<User class="${sizes.icon} text-blue-600 dark:text-blue-400" />`;
              }}
            />
          ) : isUser ? (
            // User icon if no avatar
            <User
              className={`${sizes.icon} text-blue-600 dark:text-blue-400`}
            />
          ) : isError ? (
            // Error icon
            <AlertCircle
              className={`${sizes.icon} text-red-600 dark:text-red-400`}
            />
          ) : (
            // AI avatar or icon
            <>
              <img
                src={getAIAvatar()}
                alt="AI Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentNode.innerHTML = `<Bot class="${sizes.icon} text-purple-600 dark:text-purple-400" />`;
                }}
              />
            </>
          )}
        </div>

        {/* Message text */}
        <div className={`flex-1 ${isUser ? "max-w-[80%]" : "max-w-[85%]"}`}>
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? "bg-blue-500 text-white rounded-br-none"
                : isError
                  ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none"
            }`}
          >
            <div className="whitespace-pre-wrap break-words">
              {message.text}
            </div>

            {/* Time and status */}
            <div
              className={`flex items-center justify-between mt-1 text-xs ${
                isUser
                  ? "text-blue-200"
                  : isError
                    ? "text-red-500"
                    : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTime(message.timestamp)}</span>

                {message.responseTime && (
                  <span className="ml-2">
                    • {formatResponseTime(message.responseTime)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {message.sender === "ai" && (
                  <button
                    onClick={() => copyToClipboard(message.text)}
                    className="opacity-50 hover:opacity-100 transition-opacity"
                    title={t("copy") || "Copy"}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                )}

                {message.status === "sending" && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>{t("sending") || "Sending..."}</span>
                  </div>
                )}

                {message.status === "sent" && (
                  <Check className="w-3 h-3 text-green-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full ${isFullPage ? "min-h-screen" : ""}`}>
      {/* Chat header */}
      <div
        className={`p-4 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-800 dark:to-blue-800 text-white`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`${AVATAR_SIZES.header.container} bg-white/20 rounded-full flex items-center justify-center overflow-hidden`}
            >
              <img
                src={getAIAvatar()}
                alt="AI Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentNode.innerHTML = `<Bot class="${AVATAR_SIZES.header.icon}" />`;
                }}
              />
            </div>
            <div>
              <h2 className={`text-lg font-bold`}>{aiService.name}</h2>
              <p className="text-sm opacity-90">
                {t("ai_subtitle") || "AI human rights advisor"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
              title={t("clear_chat") || "Clear chat"}
            >
              <Trash2 className="w-5 h-5" />
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                title={t("close") || "Close"}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="flex items-center gap-4 mt-3 text-sm">
          <div className="flex items-center gap-1">
            <span className="opacity-80">{t("messages") || "Messages"}:</span>
            <span className="font-bold">{messages.length - 1}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="opacity-80">{t("api_calls") || "Requests"}:</span>
            <span className="font-bold">{aiStatus.apiCalls || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="opacity-80">{t("status") || "Status"}:</span>
            <span className="font-bold">{t("ai_online") || "Online"}</span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className={`flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900`}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Typing indicator */}
        {typingText && (
          <div className="flex gap-3 mb-4">
            <div
              className={`flex-shrink-0 ${AVATAR_SIZES.typing.container} rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center overflow-hidden`}
            >
              <img
                src={getAIAvatar()}
                alt="AI Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentNode.innerHTML = `<Bot class="${AVATAR_SIZES.typing.icon} text-purple-600 dark:text-purple-400" />`;
                }}
              />
            </div>
            <div
              className={`rounded-2xl rounded-bl-none px-4 py-3 bg-gray-100 dark:bg-gray-800`}
            >
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className={`w-2 h-2 bg-gray-400 rounded-full animate-bounce`}
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className={`w-2 h-2 bg-gray-400 rounded-full animate-bounce`}
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className={`w-2 h-2 bg-gray-400 rounded-full animate-bounce`}
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <span className={`text-sm text-gray-600 dark:text-gray-400`}>
                  {typingText}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input field */}
      <div
        className={`p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800`}
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                t("ai_placeholder") ||
                "Write your question about human rights..."
              }
              disabled={isLoading}
              rows="1"
              className={`w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent resize-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50`}
              style={{
                minHeight: "44px",
                maxHeight: "120px",
              }}
            />

            {/* Buttons in input field */}
            <div
              className={`absolute right-2 bottom-2 flex items-center gap-1`}
            >
              <button
                onClick={toggleRecording}
                className={`p-1.5 rounded-full transition-colors ${
                  isRecording
                    ? "bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
                title={isRecording ? t("stop_recording") : t("start_recording")}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={() => sendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            className={`flex-shrink-0 p-3 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-700 dark:to-blue-700 text-white rounded-full hover:from-purple-700 hover:to-blue-700 dark:hover:from-purple-600 dark:hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200`}
            title={t("send") || "Send"}
          >
            {isLoading ? (
              <RefreshCw className={`w-5 h-5 animate-spin`} />
            ) : (
              <Send className={`w-5 h-5`} />
            )}
          </button>
        </div>

        {/* Hints */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-4">
            <span>
              {t("ai_tip") || "Press Enter to send, Shift+Enter for a new line"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            <span>
              {t("ai_disclaimer") ||
                "AI can make mistakes. Consult with lawyers."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
