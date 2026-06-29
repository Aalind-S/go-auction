package common

import (
	"time"
)

func ParseTime(value string) (time.Time, error) {
	return time.Parse(time.RFC3339, value)
}
