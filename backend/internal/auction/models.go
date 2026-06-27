package auction

import (
	"time"

	"github.com/Aalind-S/go-auction/internal/common"
	"github.com/Aalind-S/go-auction/internal/user"
	uuid "github.com/google/uuid"
)

type Auction struct {
	common.BaseModel
	Title       string        `gorm:"type:varchar(255);not null"`
	Description string        `gorm:"type:text"`
	SellerID    uuid.UUID     `gorm:"type:uuid;not null;index"`
	Seller      user.User     `gorm:"foreignKey:SellerID;references:ID"`
	WinnerID    *uuid.UUID    `gorm:"type:uuid;index"`
	Winner      *user.User    `gorm:"foreignKey:WinnerID;references:ID"`
	StartingBid float64       `gorm:"type:numeric(10,2);not null"`
	CurrentBid  float64       `gorm:"type:numeric(10,2)"`
	Status      AuctionStatus `gorm:"type:varchar(20);not null;default:'NOT STARTED'"`
	StartsAt    time.Time     `gorm:"not null"`
	EndsAt      time.Time     `gorm:"not null"`
}

type AuctionParticipant struct {
	AuctionID uuid.UUID `gorm:"primaryKey"`
	Auction   Auction   `gorm:"foreignKey:AuctionID;references:ID"`
	UserID    uuid.UUID `gorm:"primaryKey"`
	User      user.User `gorm:"foreignKey:UserID;references:ID"`

	JoinedAt            time.Time `gorm:"not null;default:CURRENT_TIMESTAMP"`
	NotificationEnabled bool      `gorm:"not null;default:true"`
}
