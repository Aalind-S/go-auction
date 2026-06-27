package bid

import (
	"github.com/Aalind-S/go-auction/internal/auction"
	"github.com/Aalind-S/go-auction/internal/common"
	"github.com/Aalind-S/go-auction/internal/user"
	"github.com/google/uuid"
)

type Bid struct {
	common.BaseModel
	AuctionID uuid.UUID       `gorm:"not null"`
	Auction   auction.Auction `gorm:"foreignKey:AuctionID;references:ID;index"`
	BidderID  uuid.UUID       `gorm:"not null"`
	Bidder    user.User       `gorm:"foreignKey:BidderID;references:ID;index"`
	Amount    float64         `gorm:"not null;type:numeric(10,2);check:amount > 0"`
}
