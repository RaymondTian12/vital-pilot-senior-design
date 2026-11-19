-- Groups chat messages into conversations so patients can list and resume them.
-- ChatMessages had no rows when this was written. The NOT NULL column below
-- would fail on a database that already stores ungrouped messages.
CREATE TABLE IF NOT EXISTS ChatConversations (
    conversation_id SERIAL PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    summary TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_chat_conversations_user_recent (user_id, last_message_at),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

ALTER TABLE ChatMessages
    ADD COLUMN conversation_id BIGINT UNSIGNED NOT NULL AFTER user_id,
    ADD CONSTRAINT fk_chat_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES ChatConversations(conversation_id) ON DELETE CASCADE;
