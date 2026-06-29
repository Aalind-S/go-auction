package auction

import (
	"github.com/gin-gonic/gin"
)

func RegisterAuctionRoutes(router *gin.RouterGroup) {
	router.POST("/create", RegisterAuction)

}
