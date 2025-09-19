-- Migration: Create chat_messages table
-- Description: Table to store chatbot conversation history with user-specific conversations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_conversation ON chat_messages(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);

-- Create trigger to automatically update updated_at (reuse existing function)
CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_messages
CREATE POLICY "Users can view their own chat messages" ON chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" ON chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" ON chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" ON chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to get conversation history for OpenAI LLM
CREATE OR REPLACE FUNCTION get_conversation_history(
    p_user_id UUID,
    p_conversation_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    role TEXT,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    IF p_conversation_id IS NULL THEN
        -- Get the most recent conversation for the user
        SELECT conversation_id INTO p_conversation_id
        FROM chat_messages
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    RETURN QUERY
    SELECT 
        cm.role,
        cm.content,
        cm.created_at
    FROM chat_messages cm
    WHERE cm.user_id = p_user_id 
    AND cm.conversation_id = p_conversation_id
    ORDER BY cm.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to start a new conversation
CREATE OR REPLACE FUNCTION start_new_conversation(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    new_conversation_id UUID;
BEGIN
    new_conversation_id := uuid_generate_v4();
    
    -- Insert system message to start the conversation
    INSERT INTO chat_messages (user_id, conversation_id, role, content)
    VALUES (p_user_id, new_conversation_id, 'system', 'New conversation started');
    
    RETURN new_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for conversation summaries
CREATE OR REPLACE VIEW conversation_summaries AS
SELECT 
    user_id,
    conversation_id,
    COUNT(*) as message_count,
    MIN(created_at) as conversation_started,
    MAX(created_at) as last_message,
    STRING_AGG(
        CASE 
            WHEN role = 'user' THEN SUBSTRING(content, 1, 50) || '...'
            ELSE NULL 
        END, 
        ' | ' 
        ORDER BY created_at
    ) as preview
FROM chat_messages
WHERE role != 'system'
GROUP BY user_id, conversation_id;

-- Grant necessary permissions
GRANT SELECT ON conversation_summaries TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_history(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION start_new_conversation(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE chat_messages IS 'Stores chatbot conversation history with user-specific conversations';
COMMENT ON COLUMN chat_messages.conversation_id IS 'Groups messages into conversations - each conversation has a unique UUID';
COMMENT ON COLUMN chat_messages.role IS 'Message sender: system (bot instructions), user (human), assistant (AI response)';
COMMENT ON COLUMN chat_messages.metadata IS 'Optional JSON metadata for storing additional context like tokens, model used, etc.';
COMMENT ON FUNCTION get_conversation_history IS 'Retrieves conversation history for OpenAI LLM context';
COMMENT ON FUNCTION start_new_conversation IS 'Creates a new conversation and returns the conversation_id';
