package auth

import (
	"errors"
	"net/http"
	"strings"

	"github.com/Aalind-S/go-auction/config"
	"github.com/Aalind-S/go-auction/database"
	"github.com/Aalind-S/go-auction/internal/user"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "authorization header must use Bearer token"})
			return
		}

		claims, err := ParseToken(tokenString, config.AppConfig.JWTSecret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			return
		}

		var currentUser user.User
		err = database.DB.First(&currentUser, "id = ?", claims.UserID).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user no longer exists"})
			return
		}
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "failed to load user"})
			return
		}

		c.Set("user", currentUser)
		c.Set("userID", claims.UserID)
		c.Next()
	}
}
