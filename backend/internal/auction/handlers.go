package auction

import (
	"net/http"
	"time"

	"github.com/Aalind-S/go-auction/database"
	"github.com/gin-gonic/gin"
)

func RegisterAuction(c *gin.Context) {
	var req RegisterAuctionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	startsAt, err := time.Parse(time.RFC3339, req.StartsAt)
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid starts_at format"})
		return
	}

	endsAt, err := time.Parse(time.RFC3339, req.EndsAt)
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid ends_at format"})
		return
	}

	if startsAt.After(endsAt) {
		c.JSON(400, gin.H{"error": "starts_at cannot be after ends_at"})
		return
	}

	if startsAt.Before(time.Now()) {
		c.JSON(400, gin.H{"error": "starts_at cannot be in the past"})
		return
	}

	if endsAt.Before(time.Now()) {
		c.JSON(400, gin.H{"error": "ends_at cannot be in the past"})
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
	c.JSON(http.StatusCreated, newAuction)

}
