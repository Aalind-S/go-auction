package auction

import (
	uuid "github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository interface {
	CreateAuction(auction *Auction) error
	SearchAuctions(request SearchAuctionRequest) ([]Auction, error)
	GetAuctionByID(auctionId uuid.UUID) (*Auction, error)
	UpdateAuction(auctionID uuid.UUID, request AuctionUpdateData, userID uuid.UUID) (*Auction, error)
}

type GormRepository struct {
	db *gorm.DB
}

func NewGormRepository(db *gorm.DB) Repository {
	return &GormRepository{db: db}
}

func (r *GormRepository) CreateAuction(auction *Auction) error {
	return r.db.Create(auction).Error
}

func (r *GormRepository) SearchAuctions(searchAuctionRequest SearchAuctionRequest) ([]Auction, error) {
	auctions := []Auction{}
	query := r.db.
		Model(&Auction{}).
		Preload("Seller", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "first_name", "last_name", "email")
		})

	if searchAuctionRequest.Status != "" {
		query = query.Where("status = ?", searchAuctionRequest.Status)
	}

	if searchAuctionRequest.DateFrom != "" {
		query = query.Where("starts_at >= ?", searchAuctionRequest.DateFrom)
	}

	if searchAuctionRequest.Page > 0 && searchAuctionRequest.Limit > 0 {
		// I know its not scalable for millions of auctions but works for now, we can implement cursor based pagination later
		offset := (searchAuctionRequest.Page - 1) * searchAuctionRequest.Limit
		query = query.Offset(offset).Limit(searchAuctionRequest.Limit)
	} else {
		query = query.Limit(10)
	}

	if searchAuctionRequest.Search != "" {
		searchTerm := "%" + searchAuctionRequest.Search + "%"
		query = query.Where("title LIKE ? OR description LIKE ?", searchTerm, searchTerm)
	}

	err := query.Find(&auctions).Error
	if err != nil {
		return []Auction{}, err
	}
	return auctions, nil
}

func (r *GormRepository) GetAuctionByID(auctionId uuid.UUID) (*Auction, error) {
	auction := &Auction{}
	err := r.db.
		Preload("Seller", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "first_name", "last_name", "email")
		}).
		First(auction, "id = ?", auctionId).Error

	if err != nil {
		return nil, err
	}
	return auction, nil
}

func (r *GormRepository) UpdateAuction(auctionID uuid.UUID, request AuctionUpdateData, userID uuid.UUID) (*Auction, error) {
	auction := &Auction{}
	err := r.db.First(auction, "id = ? AND seller_id = ?", auctionID, userID).Error
	if err != nil {
		return nil, err
	}

	if request.Title != nil {
		auction.Title = *request.Title
	}
	if request.Description != nil {
		auction.Description = *request.Description
	}
	if request.StartingBid != nil {
		auction.StartingBid = *request.StartingBid
	}
	if request.StartsAt != nil {
		auction.StartsAt = *request.StartsAt
	}
	if request.EndsAt != nil {
		auction.EndsAt = *request.EndsAt
	}

	err = r.db.Save(auction).Error
	if err != nil {
		return nil, err
	}

	return auction, nil
}
