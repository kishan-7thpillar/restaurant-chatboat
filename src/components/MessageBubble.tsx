"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIResponse } from "@/lib/ai-responses";
import ResponseRenderer from "./ResponseRenderer";

interface MessageBubbleProps {
  message: string | AIResponse;
  isAI: boolean;
  timestamp: Date;
}

export default function MessageBubble({
  message,
  isAI,
  timestamp,
}: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("flex gap-3 mb-4", isAI ? "justify-start" : "justify-end")}
    >
      {isAI && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600">
            <Bot className="h-4 w-4 text-white" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
          isAI
            ? "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 text-slate-900 dark:text-slate-100"
            : "bg-gradient-to-br from-blue-500 to-blue-600 text-white ml-auto"
        )}
      >
        {typeof message === "string" ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        ) : (
          <ResponseRenderer response={message} />
        )}
        <p
          className={cn(
            "text-xs mt-2 opacity-70",
            isAI ? "text-slate-500 dark:text-slate-400" : "text-blue-100"
          )}
        >
          {timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>

      {!isAI && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600">
            <User className="h-4 w-4 text-white" />
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}
