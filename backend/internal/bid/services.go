package bid

type Service interface {
	PlaceBid(req PlaceBidRequest) error
}
