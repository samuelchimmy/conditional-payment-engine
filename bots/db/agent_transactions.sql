CREATE TABLE IF NOT EXISTS agent_transactions (
    id SERIAL PRIMARY KEY,
    platform TEXT NOT NULL,
    message_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    intent_type TEXT,
    amount NUMERIC,
    recipient TEXT,
    tx_hash TEXT,
    error_reason TEXT,
    replied BOOLEAN DEFAULT false,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for the social queue to fetch quickly
CREATE INDEX IF NOT EXISTS idx_agent_transactions_unreplied ON agent_transactions(replied, retry_count) WHERE replied = false;
