package auction

import (
	"fmt"
	"time"

	uuid "github.com/google/uuid"
)

type Service interface {
	RegisterAuction(request RegisterAuctionRequest, sellerID uuid.UUID) (*Auction, error)
	SearchAuctions(request SearchAuctionRequest) ([]Auction, error)
	GetAuctionByID(auctionID uuid.UUID) (*Auction, error)
	UpdateAuction(auctionID uuid.UUID, request AuctionUpdateRequest, userID uuid.UUID) (*Auction, error)
	DeleteAuction(auctionID uuid.UUID, userID uuid.UUID) error
}

type AuctionService struct {
	repository Repository
}

func NewAuctionService(repository Repository) Service {
	return &AuctionService{repository: repository}
}

func (s *AuctionService) RegisterAuction(request RegisterAuctionRequest, sellerID uuid.UUID) (*Auction, error) {
	startsAt, endsAt, err := ValidateAuction(request)
	if err != nil {
		return nil, err
	}

	auction := &Auction{
		Title:       request.Title,
		Description: request.Description,
		StartingBid: request.StartingBid,
		StartsAt:    startsAt,
		EndsAt:      endsAt,
		SellerID:    sellerID,
		CurrentBid:  request.StartingBid,
	}

	if err := s.repository.CreateAuction(auction); err != nil {
		return nil, err
	}

	return auction, nil
}

func ValidateAuction(request RegisterAuctionRequest) (time.Time, time.Time, error) {
	startsAt, err := parseAuctionTime(request.StartsAt, "starts_at")
	if err != nil {
		return time.Time{}, time.Time{}, err
	}

	endsAt, err := parseAuctionTime(request.EndsAt, "ends_at")
	if err != nil {
		return time.Time{}, time.Time{}, err
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

func ValidateAuctionUpdate(request AuctionUpdateRequest) (*time.Time, *time.Time, error) {
	var startsAt *time.Time
	var endsAt *time.Time

	if request.StartsAt != nil {
		parsedStartsAt, err := parseAuctionTime(*request.StartsAt, "starts_at")
		if err != nil {
			return nil, nil, err
		}
		if parsedStartsAt.Before(time.Now()) {
			return nil, nil, fmt.Errorf("starts_at cannot be in the past")
		}
		startsAt = &parsedStartsAt
	}

	if request.EndsAt != nil {
		parsedEndsAt, err := parseAuctionTime(*request.EndsAt, "ends_at")
		if err != nil {
			return nil, nil, err
		}
		if parsedEndsAt.Before(time.Now()) {
			return nil, nil, fmt.Errorf("ends_at cannot be in the past")
		}
		endsAt = &parsedEndsAt
	}

	if startsAt != nil && endsAt != nil && startsAt.After(*endsAt) {
		return nil, nil, fmt.Errorf("starts_at cannot be after ends_at")
	}

	if request.StartingBid != nil && *request.StartingBid <= 0 {
		return nil, nil, fmt.Errorf("starting_bid must be greater than 0")
	}

	return startsAt, endsAt, nil
}

func parseAuctionTime(value string, fieldName string) (time.Time, error) {
	parsedTime, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return time.Time{}, fmt.Errorf("invalid %s format", fieldName)
	}

	return parsedTime, nil
}

func (s *AuctionService) SearchAuctions(req SearchAuctionRequest) ([]Auction, error) {
	// Implement the logic to list auctions based on the request parameters
	// For example, you can query the database with filters, pagination, etc.

	if req.Page < 1 {
		req.Page = 1
	}
	if req.Limit < 1 {
		req.Limit = 10
	}
	// should also validate the inputs honestly, but for now I will just pass it to the repository layer
	auctions, err := s.repository.SearchAuctions(req)
	if err != nil {
		return []Auction{}, err
	}
	return auctions, nil
}

func (s *AuctionService) GetAuctionByID(auctionId uuid.UUID) (*Auction, error) {
	return s.repository.GetAuctionByID(auctionId)
}

func (s *AuctionService) UpdateAuction(auctionID uuid.UUID, request AuctionUpdateRequest, userID uuid.UUID) (*Auction, error) {
	// Validate the request fields if they are provided
	startsAt, endsAt, err := ValidateAuctionUpdate(request)
	if err != nil {
		return nil, err
	}

	updateData := AuctionUpdateData{
		Title:       request.Title,
		Description: request.Description,
		StartingBid: request.StartingBid,
		StartsAt:    startsAt,
		EndsAt:      endsAt,
	}

	// Update the auction in the repository
	updatedAuction, err := s.repository.UpdateAuction(auctionID, updateData, userID)
	if err != nil {
		return nil, err
	}

	return updatedAuction, nil
}

func (s *AuctionService) DeleteAuction(auctionID uuid.UUID, userID uuid.UUID) error {
	// Call the repository method to delete the auction
	err := s.repository.DeleteAuction(auctionID, userID)
	if err != nil {
		return err
	}

	return nil
}
