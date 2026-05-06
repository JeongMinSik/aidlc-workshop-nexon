package repository

import (
	"context"

	"table-order-backend/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TableRepo struct {
	pool *pgxpool.Pool
}

func NewTableRepo(pool *pgxpool.Pool) *TableRepo {
	return &TableRepo{pool: pool}
}

func (r *TableRepo) GetByNumber(ctx context.Context, tableNumber int) (*model.TableInfo, error) {
	var t model.TableInfo
	err := r.pool.QueryRow(ctx,
		"SELECT id, table_number, password_hash, session_id, session_started_at, created_at FROM table_info WHERE table_number = $1",
		tableNumber,
	).Scan(&t.ID, &t.TableNumber, &t.PasswordHash, &t.SessionID, &t.SessionStartedAt, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TableRepo) GetByID(ctx context.Context, id int) (*model.TableInfo, error) {
	var t model.TableInfo
	err := r.pool.QueryRow(ctx,
		"SELECT id, table_number, password_hash, session_id, session_started_at, created_at FROM table_info WHERE id = $1",
		id,
	).Scan(&t.ID, &t.TableNumber, &t.PasswordHash, &t.SessionID, &t.SessionStartedAt, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TableRepo) GetAll(ctx context.Context) ([]model.TableInfo, error) {
	rows, err := r.pool.Query(ctx,
		"SELECT id, table_number, password_hash, session_id, session_started_at, created_at FROM table_info ORDER BY table_number")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tables []model.TableInfo
	for rows.Next() {
		var t model.TableInfo
		err := rows.Scan(&t.ID, &t.TableNumber, &t.PasswordHash, &t.SessionID, &t.SessionStartedAt, &t.CreatedAt)
		if err != nil {
			return nil, err
		}
		tables = append(tables, t)
	}
	return tables, nil
}

func (r *TableRepo) Create(ctx context.Context, tableNumber int, passwordHash string) (*model.TableInfo, error) {
	var t model.TableInfo
	err := r.pool.QueryRow(ctx,
		`INSERT INTO table_info (table_number, password_hash)
		 VALUES ($1, $2)
		 RETURNING id, table_number, password_hash, session_id, session_started_at, created_at`,
		tableNumber, passwordHash,
	).Scan(&t.ID, &t.TableNumber, &t.PasswordHash, &t.SessionID, &t.SessionStartedAt, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *TableRepo) StartSession(ctx context.Context, tableID int, sessionID string) error {
	_, err := r.pool.Exec(ctx,
		"UPDATE table_info SET session_id = $2, session_started_at = NOW() WHERE id = $1",
		tableID, sessionID,
	)
	return err
}

func (r *TableRepo) ClearSession(ctx context.Context, tableID int) error {
	_, err := r.pool.Exec(ctx,
		"UPDATE table_info SET session_id = NULL, session_started_at = NULL WHERE id = $1",
		tableID,
	)
	return err
}
