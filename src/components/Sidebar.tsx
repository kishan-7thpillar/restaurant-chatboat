"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "./AuthProvider";
import { signOut } from "@/lib/auth";
import {
  getUserConversations,
  deleteConversation,
  ConversationSummary,
} from "@/lib/chat-messages";
import { useState, useEffect } from "react";
import {
  LogOut,
  DollarSign,
  Users,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  MessageSquare,
  Plus,
  Trash2,
  Calendar,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

// Mock data for restaurant insights
const mockInsights = {
  todaySales: { value: "$2,847", change: "+12%", trend: "up" },
  laborCost: { value: "28.5%", change: "-2.1%", trend: "down" },
  pendingTasks: { value: "7", change: "+3", trend: "up" },
  customerSatisfaction: { value: "4.6/5", change: "+0.2", trend: "up" },
};

const mockTasks = [
  {
    id: 1,
    title: "Complete food safety training",
    priority: "high",
    dueDate: "Today",
  },
  {
    id: 2,
    title: "Update inventory counts",
    priority: "medium",
    dueDate: "Tomorrow",
  },
  {
    id: 3,
    title: "Review staff schedules",
    priority: "low",
    dueDate: "This week",
  },
];

interface SidebarProps {
  onSetupClick: () => void;
  onNewConversation: () => void;
  onConversationSelect: (conversationId: string) => void;
  currentConversationId: string | null;
}

export default function Sidebar({
  onSetupClick,
  onNewConversation,
  onConversationSelect,
  currentConversationId,
}: SidebarProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const handleSignOut = async () => {
    await signOut();
  };

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const userConversations = await getUserConversations();
      setConversations(userConversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleDeleteConversation = async (
    conversationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this conversation?")) {
      const success = await deleteConversation(conversationId);
      if (success) {
        await loadConversations();
        // If we deleted the current conversation, the parent should handle creating a new one
        if (conversationId === currentConversationId) {
          onNewConversation();
        }
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = (now.getTime() - date.getTime()) / (1000 * 60);
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;

    if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  // Reload conversations when a new conversation is created
  useEffect(() => {
    if (currentConversationId) {
      loadConversations();
    }
  }, [currentConversationId]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto"
    >
      {/* Chat Controls */}
      <div className="mb-6 space-y-2">
        <Button
          onClick={onNewConversation}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {/* User Profile */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {user?.user_metadata?.full_name ||
                  user?.email?.split("@")[0] ||
                  "User"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
            <div className="flex space-x-1">
              <ThemeToggle />
              {/* <Button
                variant="ghost"
                size="icon"
                onClick={onSetupClick}
                className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                title="Location Setup"
              >
                <Settings className="h-4 w-4" />
              </Button> */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights */}
      {/* <div className="space-y-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Today's Insights
        </h3>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />
              Sales Today
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {mockInsights.todaySales.value}
              </span>
              <Badge
                variant="secondary"
                className="text-green-700 bg-green-100 dark:bg-green-900/20"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {mockInsights.todaySales.change}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Users className="h-4 w-4 mr-2 text-blue-600" />
              Labor Cost %
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {mockInsights.laborCost.value}
              </span>
              <Badge
                variant="secondary"
                className="text-green-700 bg-green-100 dark:bg-green-900/20"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                {mockInsights.laborCost.change}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <ClipboardList className="h-4 w-4 mr-2 text-orange-600" />
              Pending Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {mockInsights.pendingTasks.value}
              </span>
              <Badge
                variant="secondary"
                className="text-orange-700 bg-orange-100 dark:bg-orange-900/20"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                {mockInsights.pendingTasks.change}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div> */}

      <Separator className="my-4" />

      {/* Conversation History */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Chat History
          </h3>
          <Badge variant="outline" className="text-xs">
            {conversations.length}
          </Badge>
        </div>

        {loadingConversations ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No conversations yet
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Start chatting to see history
            </p>
          </div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {conversations.slice(0, 15).map((conversation, index) => {
              const isActive =
                conversation.conversation_id === currentConversationId;
              const preview =
                conversation.preview?.replace(/[|]/g, " ").trim() ||
                "New conversation";
              const truncatedPreview =
                preview.length > 60
                  ? preview.substring(0, 60) + "..."
                  : preview;

              return (
                <div
                  key={conversation.conversation_id}
                  className={`group relative rounded-lg p-3 cursor-pointer transition-all duration-200 hover:shadow-sm ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 shadow-sm"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent"
                  }`}
                  onClick={() =>
                    onConversationSelect(conversation.conversation_id)
                  }
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        isActive
                          ? "bg-blue-500"
                          : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium ${
                              isActive
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {formatDate(conversation.last_message)}
                          </span>
                          <Badge
                            variant={isActive ? "default" : "secondary"}
                            className={`text-xs px-1.5 py-0 h-4 ${
                              isActive
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-200"
                                : ""
                            }`}
                          >
                            {conversation.message_count}
                          </Badge>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={(e) =>
                            handleDeleteConversation(
                              conversation.conversation_id,
                              e
                            )
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <p
                        className={`text-sm leading-relaxed ${
                          isActive
                            ? "text-slate-800 dark:text-slate-200 font-medium"
                            : "text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {truncatedPreview}
                      </p>
                    </div>
                  </div>

                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r" />
                  )}
                </div>
              );
            })}

            {conversations.length > 15 && (
              <div className="text-center py-2">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  +{conversations.length - 15} more conversations
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <Separator className="my-4" />

      {/* Recent Tasks */}
      {/* <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Priority Tasks
        </h3>

        <div className="space-y-3">
          {mockTasks.map((task) => (
            <Card key={task.id} className="p-3">
              <div className="flex items-start space-x-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-tight">
                    {task.title}
                  </p>
                  <div className="flex items-center mt-2 space-x-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {task.dueDate}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div> */}

      <Separator className="my-4" />

      {/* System Status */}
      {/* <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          System Status
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Toast POS
            </span>
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">7Shifts</span>
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Jolt</span>
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </div>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">
              Restaurant365
            </span>
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </div>
          </div>
        </div>
      </div> */}
    </motion.div>
  );
}
