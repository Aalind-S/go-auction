package auction

import (
	"github.com/gin-gonic/gin"
)

func RegisterAuctionRoutes(router *gin.RouterGroup, handler *Handler) {
	auctionGroup := router.Group("/auction")
	auctionGroup.POST("/create", handler.RegisterAuction)
	auctionGroup.GET("/search", handler.SearchAuctions)
}
