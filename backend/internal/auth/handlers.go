package auth

import (
	"errors"
	"net/http"
	"strings"

	"github.com/Aalind-S/go-auction/config"
	"github.com/Aalind-S/go-auction/database"
	"github.com/Aalind-S/go-auction/internal/user"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	newUser := user.User{
		FirstName:     strings.TrimSpace(req.FirstName),
		LastName:      strings.TrimSpace(req.LastName),
		Username:      strings.TrimSpace(req.Username),
		Email:         strings.ToLower(strings.TrimSpace(req.Email)),
		Password_Hash: string(passwordHash),
	}

	err = database.DB.Create(&newUser).Error
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "user with this email or username already exists"})
		return
	}

	token, err := GenerateToken(newUser.ID, config.AppConfig.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create token"})
		return
	}

	c.JSON(http.StatusCreated, AuthResponse{
		Token: token,
		User:  toUserResponse(newUser),
	})
}

func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingUser user.User
	err := database.DB.Where("email = ?", strings.ToLower(strings.TrimSpace(req.Email))).First(&existingUser).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to find user"})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(existingUser.Password_Hash), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid email or password"})
		return
	}

	token, err := GenerateToken(existingUser.ID, config.AppConfig.JWTSecret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create token"})
		return
	}

	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
		User:  toUserResponse(existingUser),
	})
}

func Me(c *gin.Context) {
	currentUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	c.JSON(http.StatusOK, MeResponse{User: toUserResponse(currentUser.(user.User))})
}
