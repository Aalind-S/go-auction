package user

import "github.com/Aalind-S/go-auction/internal/common"

type User struct {
	common.BaseModel
	Username      string `gorm:"type:varchar(255);not null;uniqueIndex"`
	Email         string `gorm:"type:varchar(255);not null;uniqueIndex"`
	Password_Hash string `gorm:"type:varchar(255);not null"`
}
