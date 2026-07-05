package bid

import (
	"github.com/Aalind-S/go-auction/internal/common"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) PlaceBid(c *gin.Context) {

	userID, ok := common.GetUserIDFromContext(c)
	if !ok {
		return
	}

	bidRequest := PlaceBidRequest{}
	if err := c.ShouldBindJSON(&bidRequest); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	err := h.service.PlaceBid(bidRequest, userID)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Bid placed successfully"})
}
