package auction

import (
	"net/http"

	"github.com/gin-gonic/gin"
	uuid "github.com/google/uuid"
)

func RegisterAuction(c *gin.Context) {
	var req RegisterAuctionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	startsAt, endsAt, err := ValidateAuction(req)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Proceed with creating the auction
	userIDValue, exists := c.Get("userID")
	if !exists {
		c.JSON(401, gin.H{"error": "unauthorized"})
		return
	}

	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		c.JSON(500, gin.H{"error": "invalid user context"})
		return
	}

	newAuction := Auction{
		Title:       req.Title,
		Description: req.Description,
		StartingBid: req.StartingBid,
		StartsAt:    startsAt,
		EndsAt:      endsAt,
		SellerID:    userID,
		CurrentBid:  req.StartingBid,
	}

	err = CreateAuction(&newAuction)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to create auction"})
		return
	}
	c.JSON(http.StatusCreated, toRegisterAuctionResponse(newAuction))

}
