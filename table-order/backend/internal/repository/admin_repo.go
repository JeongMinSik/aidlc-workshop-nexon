package repository

import (
	"context"

	"table-order-backend/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminRepo struct {
	pool *pgxpool.Pool
}

func NewAdminRepo(pool *pgxpool.Pool) *AdminRepo {
	return &AdminRepo{pool: pool}
}

func (r *AdminRepo) GetByUsername(ctx context.Context, username string) (*model.Admin, error) {
	var admin model.Admin
	err := r.pool.QueryRow(ctx,
		"SELECT id, username, password_hash, created_at FROM admins WHERE username = $1",
		username,
	).Scan(&admin.ID, &admin.Username, &admin.PasswordHash, &admin.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &admin, nil
}
