package bid

import "github.com/google/uuid"

type PlaceBidRequest struct {
	AuctionID uuid.UUID `json:"auction_id" binding:"required"`
	Amount    float64   `json:"amount" binding:"required"`
	BidderID  uuid.UUID `json:"bidder_id" binding:"required"`
}
