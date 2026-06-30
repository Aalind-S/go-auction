package auction

import (
	"github.com/gin-gonic/gin"
)

func RegisterAuctionRoutes(router *gin.RouterGroup) {
	auctionGroup := router.Group("/auction")
	auctionGroup.POST("/create", RegisterAuction)
	auctionGroup.GET("/", ListAuctions)
}
