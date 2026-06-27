package main

import (
	"log"

	"github.com/Aalind-S/go-auction/database"
	"github.com/gin-gonic/gin"
)

func main() {
	err := database.InitializeDatabase()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	r := gin.Default()
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "Hello, World!",
		})
	})
	r.Run(":8080")

}
