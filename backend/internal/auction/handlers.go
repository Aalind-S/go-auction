package auction

import (
	"net/http"

	"github.com/Aalind-S/go-auction/internal/common"
	"github.com/gin-gonic/gin"
	uuid "github.com/google/uuid"
	"gorm.io/gorm"
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

	userID, ok := common.GetUserIDFromContext(c)
	if !ok {
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

func (h *Handler) GetAuctionByID(c *gin.Context) {
	auctionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid auction ID"})
		return
	}

	auction, err := h.service.GetAuctionByID(auctionID)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to get auction"})
		return
	}
	c.JSON(http.StatusOK, toRegisterAuctionResponse(*auction))
}

func (h *Handler) UpdateAuction(c *gin.Context) {
	auctionID, err := uuid.Parse(c.Param("id"))
	userID, ok := common.GetUserIDFromContext(c)
	if !ok {
		return
	}

	if err != nil {
		c.JSON(400, gin.H{"error": "invalid auction ID"})
		return
	}

	AuctionUpdateRequest := AuctionUpdateRequest{}
	if err := c.ShouldBindJSON(&AuctionUpdateRequest); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	updatedAuction, err := h.service.UpdateAuction(auctionID, AuctionUpdateRequest, userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to update auction"})
		return
	}
	c.JSON(http.StatusOK, toRegisterAuctionResponse(*updatedAuction))
}

func (h *Handler) DeleteAuction(c *gin.Context) {
	auctionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid auction ID"})
		return
	}

	userID, ok := common.GetUserIDFromContext(c)
	if !ok {
		return
	}

	err = h.service.DeleteAuction(auctionID, userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to delete auction"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "auction deleted successfully"})
}

func (h *Handler) JoinAuction(c *gin.Context) {
	auctionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid auction ID"})
		return
	}

	userID, ok := common.GetUserIDFromContext(c)
	if !ok {
		return
	}
	var req JoinAuctionRequest
	req = JoinAuctionRequest{
		AuctionID:           auctionID,
		UserID:              userID,
		NotificationEnabled: true, // default to true, can be changed later
	}
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	err = h.service.JoinAuction(&req)
	if err == gorm.ErrDuplicatedKey {
		c.JSON(400, gin.H{"error": "Already joined this auction"})
		return
	}
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to join auction"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "successfully joined auction"})
}

func (h *Handler) LeaveAuction(c *gin.Context) {
	auctionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(400, gin.H{"error": "invalid auction ID"})
		return
	}

	userID, ok := common.GetUserIDFromContext(c)
	if !ok {
		return
	}

	err = h.service.LeaveAuction(auctionID, userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to leave auction"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "successfully left auction"})
}
