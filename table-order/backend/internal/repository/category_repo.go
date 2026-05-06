package repository

import (
	"context"

	"table-order-backend/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CategoryRepo struct {
	pool *pgxpool.Pool
}

func NewCategoryRepo(pool *pgxpool.Pool) *CategoryRepo {
	return &CategoryRepo{pool: pool}
}

func (r *CategoryRepo) GetAll(ctx context.Context) ([]model.Category, error) {
	rows, err := r.pool.Query(ctx,
		"SELECT id, name, display_order, created_at FROM categories ORDER BY display_order, id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []model.Category
	for rows.Next() {
		var c model.Category
		err := rows.Scan(&c.ID, &c.Name, &c.DisplayOrder, &c.CreatedAt)
		if err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	return categories, nil
}

func (r *CategoryRepo) Create(ctx context.Context, req model.CreateCategoryRequest) (*model.Category, error) {
	var c model.Category
	err := r.pool.QueryRow(ctx,
		`INSERT INTO categories (name, display_order)
		 VALUES ($1, $2)
		 RETURNING id, name, display_order, created_at`,
		req.Name, req.DisplayOrder,
	).Scan(&c.ID, &c.Name, &c.DisplayOrder, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CategoryRepo) Update(ctx context.Context, id int, req model.UpdateCategoryRequest) (*model.Category, error) {
	var c model.Category
	err := r.pool.QueryRow(ctx,
		`UPDATE categories SET
			name = COALESCE($2, name),
			display_order = COALESCE($3, display_order)
		 WHERE id = $1
		 RETURNING id, name, display_order, created_at`,
		id, req.Name, req.DisplayOrder,
	).Scan(&c.ID, &c.Name, &c.DisplayOrder, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CategoryRepo) Delete(ctx context.Context, id int) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM categories WHERE id = $1", id)
	return err
}

func (r *CategoryRepo) HasActiveMenus(ctx context.Context, id int) (bool, error) {
	var count int
	err := r.pool.QueryRow(ctx,
		"SELECT COUNT(*) FROM menus WHERE category_id = $1 AND is_active = true", id,
	).Scan(&count)
	return count > 0, err
}
