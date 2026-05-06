package service

import (
	"context"
	"errors"
	"time"

	"table-order-backend/internal/model"
	"table-order-backend/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	adminRepo *repository.AdminRepo
	tableRepo *repository.TableRepo
	jwtSecret string
}

func NewAuthService(adminRepo *repository.AdminRepo, tableRepo *repository.TableRepo, jwtSecret string) *AuthService {
	return &AuthService{
		adminRepo: adminRepo,
		tableRepo: tableRepo,
		jwtSecret: jwtSecret,
	}
}

func (s *AuthService) AdminLogin(ctx context.Context, req model.AdminLoginRequest) (*model.TokenResponse, error) {
	admin, err := s.adminRepo.GetByUsername(ctx, req.Username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(admin.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	expiresAt := time.Now().Add(16 * time.Hour)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"admin_id": admin.ID,
		"username": admin.Username,
		"role":     "admin",
		"exp":      expiresAt.Unix(),
	})

	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return nil, err
	}

	return &model.TokenResponse{
		Token:     tokenString,
		ExpiresAt: expiresAt.Unix(),
	}, nil
}

func (s *AuthService) TableLogin(ctx context.Context, req model.TableLoginRequest) (*model.TableTokenResponse, error) {
	table, err := s.tableRepo.GetByNumber(ctx, req.TableNumber)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(table.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	expiresAt := time.Now().Add(16 * time.Hour)

	claims := jwt.MapClaims{
		"table_id":     table.ID,
		"table_number": table.TableNumber,
		"role":         "table",
		"exp":          expiresAt.Unix(),
	}
	if table.SessionID != nil {
		claims["session_id"] = *table.SessionID
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return nil, err
	}

	return &model.TableTokenResponse{
		Token:       tokenString,
		TableID:     table.ID,
		TableNumber: table.TableNumber,
		SessionID:   table.SessionID,
		ExpiresAt:   expiresAt.Unix(),
	}, nil
}
