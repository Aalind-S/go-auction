package config

import (
	"os"

	godotenv "github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	APP_PORT    string
}

var AppConfig Config

func LoadEnv() {
	err := godotenv.Load()
	if err != nil {
		panic("Error loading .env file")
	}

	AppConfig = Config{
		DatabaseURL: os.Getenv("DB_URL"),
		APP_PORT:    os.Getenv("APP_PORT"),
	}

}
