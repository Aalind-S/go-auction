package auction

import "github.com/Aalind-S/go-auction/database"

func CreateAuction(a *Auction) error {
	return database.DB.Create(a).Error
}

func ListAuction(auctionListRequest AuctionListRequest) ([]Auction, error) {
	var auctions []Auction
	query := database.DB.Model(&Auction{})

	if auctionListRequest.Status != "" {
		query = query.Where("status = ?", auctionListRequest.Status)
	}

	if auctionListRequest.DateFrom != "" {
		query = query.Where("starts_at >= ?", auctionListRequest.DateFrom)
	}

	if auctionListRequest.Page > 0 && auctionListRequest.Limit > 0 {
		// I know its not scalable for millions of auctions but works for now, we can implement cursor based pagination later
		offset := (auctionListRequest.Page - 1) * auctionListRequest.Limit
		query = query.Offset(offset).Limit(auctionListRequest.Limit)
	} else {
		query = query.Limit(10)
	}

	if auctionListRequest.Search != "" {
		searchTerm := "%" + auctionListRequest.Search + "%"
		query = query.Where("title LIKE ? OR description LIKE ?", searchTerm, searchTerm)
	}

	err := query.Find(&auctions).Error
	if err != nil {
		return nil, err
	}
	return auctions, nil
}
