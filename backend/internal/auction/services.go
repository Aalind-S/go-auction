package auction

import (
	"fmt"
	"time"
)

func ValidateAuction(request RegisterAuctionRequest) (time.Time, time.Time, error) {
	startsAt, err := time.Parse(time.RFC3339, request.StartsAt)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid starts_at format")
	}

	endsAt, err := time.Parse(time.RFC3339, request.EndsAt)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("invalid ends_at format")
	}

	if startsAt.After(endsAt) {
		return time.Time{}, time.Time{}, fmt.Errorf("starts_at cannot be after ends_at")
	}

	if startsAt.Before(time.Now()) {
		return time.Time{}, time.Time{}, fmt.Errorf("starts_at cannot be in the past")
	}

	if endsAt.Before(time.Now()) {
		return time.Time{}, time.Time{}, fmt.Errorf("ends_at cannot be in the past")
	}

	if startingBid := request.StartingBid; startingBid <= 0 {
		return time.Time{}, time.Time{}, fmt.Errorf("starting_bid must be greater than 0")
	}
	return startsAt, endsAt, nil
}

func ListAuctionService(req AuctionListRequest) ([]Auction, error) {
	// Implement the logic to list auctions based on the request parameters
	// For example, you can query the database with filters, pagination, etc.

	if req.Page < 1 {
		req.Page = 1
	}
	if req.Limit < 1 {
		req.Limit = 10
	}
	// should also validate the inputs honestly, but for now I will just pass it to the repository layer
	auctions, err := ListAuction(req)
	if err != nil {
		return nil, err
	}
	return auctions, nil
}
