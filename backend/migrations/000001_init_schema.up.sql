CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_deleted_at ON users (deleted_at);

CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    seller_id UUID NOT NULL REFERENCES users(id),
    winner_id UUID REFERENCES users(id),
    starting_bid NUMERIC(10, 2) NOT NULL,
    current_bid NUMERIC(10, 2),
    status VARCHAR(20) NOT NULL DEFAULT 'NOT STARTED',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT auctions_status_check CHECK (status IN ('NOT STARTED', 'ACTIVE', 'ENDED', 'CANCELLED')),
    CONSTRAINT auctions_bid_check CHECK (current_bid IS NULL OR current_bid >= starting_bid),
    CONSTRAINT auctions_time_check CHECK (ends_at > starts_at)
);

CREATE INDEX idx_auctions_seller_id ON auctions (seller_id);
CREATE INDEX idx_auctions_winner_id ON auctions (winner_id);
CREATE INDEX idx_auctions_status ON auctions (status);
CREATE INDEX idx_auctions_deleted_at ON auctions (deleted_at);

CREATE TABLE auction_participants (
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (auction_id, user_id)
);

CREATE INDEX idx_auction_participants_user_id ON auction_participants (user_id);

CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL REFERENCES users(id),
    amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT bids_amount_check CHECK (amount > 0)
);

CREATE INDEX idx_bids_auction_id ON bids (auction_id);
CREATE INDEX idx_bids_bidder_id ON bids (bidder_id);
CREATE INDEX idx_bids_deleted_at ON bids (deleted_at);
CREATE INDEX idx_bids_auction_amount ON bids (auction_id, amount DESC);
