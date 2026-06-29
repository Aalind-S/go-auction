package auth

import "github.com/gin-gonic/gin"

func RegisterPublicRoutes(router *gin.RouterGroup) {
	router.POST("/register", Register)
	router.POST("/login", Login)
}

func RegisterProtectedRoutes(router *gin.RouterGroup) {
	router.GET("/me", Me)
}
