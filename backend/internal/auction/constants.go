package auction

type AuctionStatus string

const (
	AuctionStatusNotStarted AuctionStatus = "NOT STARTED"
	AuctionStatusActive     AuctionStatus = "ACTIVE"
	AuctionStatusEnded      AuctionStatus = "ENDED"
	AuctionStatusCancelled  AuctionStatus = "CANCELLED"
)

const (
	AuctionNotFoundError  = "Auction not found"
	AuctionNotActiveError = "Auction is not active"
)
