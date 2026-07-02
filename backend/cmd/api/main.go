package main

import (
	"log"

	"github.com/Aalind-S/go-auction/config"
	"github.com/Aalind-S/go-auction/database"
	"github.com/Aalind-S/go-auction/internal/auction"
	"github.com/Aalind-S/go-auction/internal/auth"
	"github.com/gin-gonic/gin"
)

func main() {

	config.LoadEnv()

	err := database.RunMigrations(config.AppConfig.DatabaseURL, "file://migrations")
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	err = database.InitializeDatabase()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	router := gin.Default()

	api := router.Group("/api")
	api.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "ok",
		})
	})

	auth.RegisterPublicRoutes(api.Group("/auth"))

	protected := api.Group("")
	protected.Use(auth.RequireAuth())
	auth.RegisterProtectedRoutes(protected)
	auction.RegisterAuctionRoutes(protected)

	// Serve static frontend files
	router.StaticFile("/", "../frontend/index.html")
	router.StaticFile("/style.css", "../frontend/style.css")
	router.StaticFile("/app.js", "../frontend/app.js")

	router.Run(":" + config.AppConfig.APP_PORT)
}
