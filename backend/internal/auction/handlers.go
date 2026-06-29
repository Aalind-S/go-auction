package auction

import (
	"net/http"

	"github.com/Aalind-S/go-auction/database"
	"github.com/gin-gonic/gin"
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

	newAuction := Auction{
		Title:       req.Title,
		Description: req.Description,
		StartingBid: req.StartingBid,
		StartsAt:    startsAt,
		EndsAt:      endsAt,
	}

	err = database.DB.Create(&newAuction).Error
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to create auction"})
		return
	}
	c.JSON(http.StatusCreated, toRegisterAuctionResponse(newAuction))

}
