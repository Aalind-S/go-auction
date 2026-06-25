package database

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB = os.Getenv("DB_URL")

func initializeDatabase() {

	db, err = gorm.Open(postgres.Open(DB), &gorm.Config{})

	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	// Database initialization logic goes here
}
