"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import MessageBubble from "./MessageBubble";
import { AIResponse } from "@/lib/ai-responses";

export interface Message {
  id: string;
  content: string | AIResponse;
  isAI: boolean;
  timestamp: Date;
}

interface ChatWindowProps {
  messages: Message[];
}

export default function ChatWindow({ messages }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  console.log(messages);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">
                Welcome to Restaurant AI Assistant
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                I can help you with insights from your restaurant systems
                including POS, scheduling, tasks, and financial data.
              </p>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                  <strong>💰 Sales:</strong> "Why are sales down this week?"
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                  <strong>👥 Scheduling:</strong> "Show me today's staff
                  schedule"
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                  <strong>📋 Tasks:</strong> "What training tasks are overdue?"
                </div>
                <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3">
                  <strong>📊 Financial:</strong> "What's our labor cost
                  percentage?"
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message.content}
              isAI={message.isAI}
              timestamp={message.timestamp}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
