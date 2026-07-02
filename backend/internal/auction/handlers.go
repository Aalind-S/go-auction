package auction

import (
	"net/http"

	"github.com/gin-gonic/gin"
	uuid "github.com/google/uuid"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterAuction(c *gin.Context) {
	var req RegisterAuctionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

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

	newAuction, err := h.service.RegisterAuction(req, userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to create auction"})
		return
	}
	c.JSON(http.StatusCreated, toRegisterAuctionResponse(*newAuction))

}

func (h *Handler) SearchAuctions(c *gin.Context) {
	var req SearchAuctionRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	auctions, err := h.service.SearchAuctions(req)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to search auctions"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"auctions": toAuctionResponse(auctions),
	})
}
