package auction

import "github.com/Aalind-S/go-auction/database"

func CreateAuction(a *Auction) error {
	return database.DB.Create(a).Error
}
