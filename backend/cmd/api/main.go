package main

import (
	"log"

	"github.com/Aalind-S/go-auction/config"
	"github.com/Aalind-S/go-auction/database"
	"github.com/Aalind-S/go-auction/internal/app"
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

	router := app.NewRouter(database.DB)

	router.Run(":" + config.AppConfig.APP_PORT)
}
