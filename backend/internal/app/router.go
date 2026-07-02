package app

import (
	"github.com/Aalind-S/go-auction/internal/auction"
	"github.com/Aalind-S/go-auction/internal/auth"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func NewRouter(db *gorm.DB) *gin.Engine {
	router := gin.Default()

	api := router.Group("/api")
	registerHealthRoutes(api)
	registerAuthRoutes(api)
	registerAuctionRoutes(api, db)
	registerFrontendRoutes(router)

	return router
}

func registerHealthRoutes(api *gin.RouterGroup) {
	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})
}

func registerAuthRoutes(api *gin.RouterGroup) {
	auth.RegisterPublicRoutes(api.Group("/auth"))

	protected := api.Group("")
	protected.Use(auth.RequireAuth())
	auth.RegisterProtectedRoutes(protected)
}

func registerAuctionRoutes(api *gin.RouterGroup, db *gorm.DB) {
	protected := api.Group("")
	protected.Use(auth.RequireAuth())

	auctionRepository := auction.NewGormRepository(db)
	auctionService := auction.NewAuctionService(auctionRepository)
	auctionHandler := auction.NewHandler(auctionService)

	auction.RegisterAuctionRoutes(protected, auctionHandler)
}

func registerFrontendRoutes(router *gin.Engine) {
	router.StaticFile("/", "../frontend/index.html")
	router.StaticFile("/style.css", "../frontend/style.css")
	router.StaticFile("/app.js", "../frontend/app.js")
}
