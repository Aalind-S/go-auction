package bid

import (
	"errors"
	"time"

	"github.com/Aalind-S/go-auction/internal/auction"
	"github.com/google/uuid"
)

type Service interface {
	PlaceBid(req PlaceBidRequest, userID uuid.UUID) error
}

type BidService struct {
	repo              Repository
	auctionRepository auction.Repository
}

func (b *BidService) PlaceBid(req PlaceBidRequest, userID uuid.UUID) error {
	// Validate the bid amount
	if req.Amount <= 0 {
		return errors.New(ErrInvalidBidAmount)
	}
	auctionObj, err := b.auctionRepository.GetAuctionByID(req.AuctionID)
	if err != nil {
		return errors.New(auction.AuctionNotFoundError)
	}
	if auctionObj.Status != auction.AuctionStatusActive {
		return errors.New(auction.AuctionNotActiveError)
	}
	if time.Now().Before(auctionObj.StartsAt) || time.Now().After(auctionObj.EndsAt) {
		return errors.New(auction.AuctionNotActiveError)
	}
	err = b.repo.PlaceBid(req, userID)
	if err != nil {
		return err
	}
	return nil
	// Check if the auction exists and is active
}
