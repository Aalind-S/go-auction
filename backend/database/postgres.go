package database

import (
	"errors"

	"github.com/Aalind-S/go-auction/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitializeDatabase() error {
	dsn := config.AppConfig.DatabaseURL
	if dsn == "" {
		return errors.New("DB_URL is not set")
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return err
	}

	DB = db
	return nil
}
