package auction

import (
	uuid "github.com/google/uuid"
)

type RegisterAuctionRequest struct {
	Title       string  `json:"title" binding:"required"`
	Description string  `json:"description" binding:"required"`
	StartingBid float64 `json:"starting_bid" binding:"required,gt=0"`
	StartsAt    string  `json:"starts_at" binding:"required,datetime=2006-01-02T15:04:05Z07:00"`
	EndsAt      string  `json:"ends_at" binding:"required,datetime=2006-01-02T15:04:05Z07:00"`
}

type RegisterAuctionResponse struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartingBid float64   `json:"starting_bid"`
	StartsAt    string    `json:"starts_at"`
	EndsAt      string    `json:"ends_at"`
}

func toRegisterAuctionResponse(a Auction) RegisterAuctionResponse {
	return RegisterAuctionResponse{
		ID:          a.ID,
		Title:       a.Title,
		Description: a.Description,
		StartingBid: a.StartingBid,
		StartsAt:    a.StartsAt.String(),
		EndsAt:      a.EndsAt.String(),
	}
}

type AuctionListRequest struct {
	Page     int    `form:"page" json:"page"`
	Limit    int    `form:"limit" json:"limit"`
	Status   string `form:"status" json:"status"`
	Search   string `form:"search" json:"search"`
	DateFrom string `form:"date_from" json:"date_from"`
	// Add any filters or pagination parameters if needed
}

type AuctionResponse struct {
	ID          uuid.UUID `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartingBid float64   `json:"starting_bid"`
	Status      string    `json:"status"`
	StartsAt    string    `json:"starts_at"`
	EndsAt      string    `json:"ends_at"`
}

func toAuctionResponse(auctions []Auction) []AuctionResponse {
	var responses []AuctionResponse
	for _, auction := range auctions {
		responses = append(responses, AuctionResponse{
			ID:          auction.ID,
			Title:       auction.Title,
			Description: auction.Description,
			StartingBid: auction.StartingBid,
			Status:      string(auction.Status),
			StartsAt:    auction.StartsAt.String(),
			EndsAt:      auction.EndsAt.String(),
		})
	}
	return responses
}
