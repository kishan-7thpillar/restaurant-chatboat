"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ChatWindow, { Message } from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";
import Sidebar from "@/components/Sidebar";
import LocationSetup from "@/components/LocationSetup";
import {
  saveChatMessage,
  getConversationHistory,
  startNewConversation,
  getMostRecentConversationId,
  formatMessagesForOpenAI,
  ChatMessage,
} from "@/lib/chat-messages";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [showLocationSetup, setShowLocationSetup] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingStep, setProcessingStep] = useState<string | null>(null);

  // Load conversation history on component mount
  useEffect(() => {
    const loadConversationHistory = async () => {
      try {
        // Get the most recent conversation or start a new one
        let conversationId = await getMostRecentConversationId();

        if (!conversationId) {
          conversationId = await startNewConversation();
        }

        if (conversationId) {
          setCurrentConversationId(conversationId);

          // Load conversation history
          const chatHistory = await getConversationHistory(conversationId);

          // Convert ChatMessage[] to Message[] format
          const formattedMessages: Message[] = chatHistory
            .filter(
              (msg) =>
                msg.role !== "system" ||
                msg.content !== "New conversation started"
            )
            .map((msg) => {
              let content = msg.content;

              // Parse JSON content for AI responses
              if (msg.role === "assistant" && typeof content === "string") {
                try {
                  const parsed = JSON.parse(content);
                  content = parsed;
                } catch (e) {
                  // If parsing fails, keep as string
                }
              }

              return {
                id: msg.id,
                content,
                isAI: msg.role === "assistant",
                timestamp: new Date(msg.created_at),
              };
            });

          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error("Error loading conversation history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversationHistory();
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId) {
      console.error("No active conversation");
      return;
    }

    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isAI: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Save user message to database
      await saveChatMessage(currentConversationId, "user", content);

      console.log("🚀 Starting streaming AI workflow for query:", content);
      setProcessingStep("🤖 Processing your request...");

      // Call the streaming API through our proxy
      const response = await fetch("/api/streaming-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error("No response body received");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalResponse = null;
      let streamEnded = false;

      setProcessingStep("🔍 Analyzing your query...");

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          // Decode the chunk and add to buffer
          buffer += decoder.decode(value, { stream: true });

          // Process complete lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim() === "") continue;

            // Parse Server-Sent Events format
            if (line.startsWith("data: ")) {
              try {
                const jsonData = JSON.parse(line.slice(6)); // Remove 'data: ' prefix
                console.log("📡 Streaming data:", jsonData);

                // Update processing step based on the event
                if (jsonData.event_type === "new_message") {
                  if (
                    jsonData.additional_args?.name === "Table Analyzer Agent"
                  ) {
                    setProcessingStep(
                      "📋 Selecting relevant database tables..."
                    );
                  } else if (
                    jsonData.additional_args?.name === "SQL Generator Agent"
                  ) {
                    if (jsonData.content?.[0]?.type === "tool_call") {
                      setProcessingStep(
                        "⚡ Generating and executing SQL query..."
                      );
                    } else if (jsonData.content?.[0]?.type === "text") {
                      setProcessingStep("💾 Processing query results...");
                    }
                  } else if (
                    jsonData.additional_args?.name === "Results Presenter Agent"
                  ) {
                    setProcessingStep("🎨 Formatting results for display...");

                    // This is the final response from Results Presenter Agent
                    if (jsonData.content?.[0]?.type === "json") {
                      try {
                        finalResponse = JSON.parse(jsonData.content[0].text);
                        console.log("🎯 Final response captured:", finalResponse);
                      } catch (e) {
                        console.error("Error parsing final response:", e);
                      }
                    }
                  }
                }

                // Check for stream completion
                if (jsonData.event === "stream.ended") {
                  console.log("🏁 Stream ended, ready to display final response");
                  streamEnded = true;
                  break; // Exit the line processing loop
                }
              } catch (e) {
                console.error(
                  "Error parsing streaming data:",
                  e,
                  "Line:",
                  line
                );
              }
            }
          }

          // If stream ended, break out of the main reading loop
          if (streamEnded) {
            break;
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Process the final response only after stream has ended
      if (streamEnded && finalResponse) {
        console.log("🎯 Processing Final Response:", finalResponse);

        // Add AI message to UI
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: finalResponse,
          isAI: true,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Save AI response to database
        const responseContent = JSON.stringify(finalResponse);
        await saveChatMessage(
          currentConversationId,
          "assistant",
          responseContent
        );

        console.log("✅ Streaming AI workflow completed successfully!");
      } else if (streamEnded && !finalResponse) {
        throw new Error("Stream ended but no final response was captured");
      } else if (!streamEnded) {
        throw new Error("Stream did not complete properly");
      }

      setProcessingStep(null);
    } catch (error) {
      console.error("Error in streaming AI workflow:", error);
      setProcessingStep(null);

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        isAI: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConversationId = await startNewConversation();
      if (newConversationId) {
        setCurrentConversationId(newConversationId);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error starting new conversation:", error);
    }
  };

  const handleConversationSelect = async (conversationId: string) => {
    try {
      setIsLoading(true);
      setCurrentConversationId(conversationId);

      // Load conversation history
      const chatHistory = await getConversationHistory(conversationId);

      // Convert ChatMessage[] to Message[] format
      const formattedMessages: Message[] = chatHistory
        .filter(
          (msg) =>
            msg.role !== "system" || msg.content !== "New conversation started"
        )
        .map((msg) => {
          let content = msg.content;

          // Parse JSON content for AI responses
          if (msg.role === "assistant" && typeof content === "string") {
            try {
              const parsed = JSON.parse(content);
              content = parsed;
            } catch (e) {
              // If parsing fails, keep as string
            }
          }

          return {
            id: msg.id,
            content,
            isAI: msg.role === "assistant",
            timestamp: new Date(msg.created_at),
          };
        });

      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">
              Loading conversation...
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar
          onSetupClick={() => setShowLocationSetup(true)}
          onNewConversation={handleNewConversation}
          onConversationSelect={handleConversationSelect}
          currentConversationId={currentConversationId}
        />
        <div className="flex-1 flex flex-col">
          <ChatWindow messages={messages} />
          <ChatInput
            onSendMessage={handleSendMessage}
            processingStep={processingStep}
          />
        </div>
        {showLocationSetup && (
          <LocationSetup onClose={() => setShowLocationSetup(false)} />
        )}
      </div>
    </ProtectedRoute>
  );
}
