import { supabase } from './supabase';

export interface ChatMessage {
  id: string;
  user_id: string;
  conversation_id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ConversationSummary {
  user_id: string;
  conversation_id: string;
  message_count: number;
  conversation_started: string;
  last_message: string;
  preview: string;
}

// Save a message to the database
export const saveChatMessage = async (
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  metadata?: Record<string, any>
): Promise<ChatMessage | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        role,
        content,
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving chat message:', error);
    return null;
  }
};

// Get conversation history for a specific conversation
export const getConversationHistory = async (
  conversationId: string,
  limit: number = 50
): Promise<ChatMessage[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }
};

// Get all conversations for the current user
export const getUserConversations = async (): Promise<ConversationSummary[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('conversation_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('last_message', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    return [];
  }
};

// Start a new conversation
export const startNewConversation = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('start_new_conversation', {
      p_user_id: user.id
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error starting new conversation:', error);
    return null;
  }
};

// Get the most recent conversation ID for a user
export const getMostRecentConversationId = async (): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chat_messages')
      .select('conversation_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data?.conversation_id || null;
  } catch (error) {
    console.error('Error getting most recent conversation:', error);
    return null;
  }
};

// Delete a conversation and all its messages
export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }
};

// Format messages for OpenAI API
export const formatMessagesForOpenAI = (messages: ChatMessage[]) => {
  return messages
    .filter(msg => msg.role !== 'system' || msg.content !== 'New conversation started')
    .map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content
    }));
};
