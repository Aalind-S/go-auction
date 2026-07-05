package bid

import (
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Repository interface {
	PlaceBid(req PlaceBidRequest, userID uuid.UUID) error
}

type GormRepository struct {
	// Add your database connection or ORM instance here
	db *gorm.DB
}

func NewGormRepository(db *gorm.DB) Repository {
	return &GormRepository{db: db}
}

func (r *GormRepository) PlaceBid(req PlaceBidRequest, userID uuid.UUID) error {
	bid := Bid{
		AuctionID: req.AuctionID,
		BidderID:  userID,
		Amount:    req.Amount,
	}

	return r.db.Create(&bid).Error
}
