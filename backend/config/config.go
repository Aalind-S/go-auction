package config

import (
	"os"

	godotenv "github.com/joho/godotenv"
)

type Config struct {
	DatabaseURL string
	APP_PORT    string
	JWTSecret   string
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
		JWTSecret:   os.Getenv("JWT_SECRET"),
	}

	if AppConfig.APP_PORT == "" {
		AppConfig.APP_PORT = "8000"
	}

	if AppConfig.JWTSecret == "" {
		panic("JWT_SECRET is not set")
	}

}
