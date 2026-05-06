package repository

import (
	"context"

	"table-order-backend/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type MenuRepo struct {
	pool *pgxpool.Pool
}

func NewMenuRepo(pool *pgxpool.Pool) *MenuRepo {
	return &MenuRepo{pool: pool}
}

func (r *MenuRepo) GetAllWithCategories(ctx context.Context) ([]model.CategoryWithMenus, error) {
	categories, err := r.getCategories(ctx)
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx,
		"SELECT id, category_id, name, price, description, image_url, display_order, is_active, created_at FROM menus WHERE is_active = true ORDER BY display_order, id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	menuMap := make(map[int][]model.Menu)
	for rows.Next() {
		var m model.Menu
		err := rows.Scan(&m.ID, &m.CategoryID, &m.Name, &m.Price, &m.Description, &m.ImageURL, &m.DisplayOrder, &m.IsActive, &m.CreatedAt)
		if err != nil {
			return nil, err
		}
		menuMap[m.CategoryID] = append(menuMap[m.CategoryID], m)
	}

	var result []model.CategoryWithMenus
	for _, cat := range categories {
		cwm := model.CategoryWithMenus{
			Category: cat,
			Menus:    menuMap[cat.ID],
		}
		if cwm.Menus == nil {
			cwm.Menus = []model.Menu{}
		}
		result = append(result, cwm)
	}
	return result, nil
}

func (r *MenuRepo) getCategories(ctx context.Context) ([]model.Category, error) {
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

func (r *MenuRepo) GetByID(ctx context.Context, id int) (*model.Menu, error) {
	var m model.Menu
	err := r.pool.QueryRow(ctx,
		"SELECT id, category_id, name, price, description, image_url, display_order, is_active, created_at FROM menus WHERE id = $1",
		id,
	).Scan(&m.ID, &m.CategoryID, &m.Name, &m.Price, &m.Description, &m.ImageURL, &m.DisplayOrder, &m.IsActive, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MenuRepo) Create(ctx context.Context, req model.CreateMenuRequest) (*model.Menu, error) {
	var m model.Menu
	err := r.pool.QueryRow(ctx,
		`INSERT INTO menus (category_id, name, price, description, image_url, display_order)
		 VALUES ($1, $2, $3, $4, $5, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM menus WHERE category_id = $1))
		 RETURNING id, category_id, name, price, description, image_url, display_order, is_active, created_at`,
		req.CategoryID, req.Name, req.Price, req.Description, req.ImageURL,
	).Scan(&m.ID, &m.CategoryID, &m.Name, &m.Price, &m.Description, &m.ImageURL, &m.DisplayOrder, &m.IsActive, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MenuRepo) Update(ctx context.Context, id int, req model.UpdateMenuRequest) (*model.Menu, error) {
	var m model.Menu
	err := r.pool.QueryRow(ctx,
		`UPDATE menus SET
			category_id = COALESCE($2, category_id),
			name = COALESCE($3, name),
			price = COALESCE($4, price),
			description = COALESCE($5, description),
			image_url = COALESCE($6, image_url)
		 WHERE id = $1
		 RETURNING id, category_id, name, price, description, image_url, display_order, is_active, created_at`,
		id, req.CategoryID, req.Name, req.Price, req.Description, req.ImageURL,
	).Scan(&m.ID, &m.CategoryID, &m.Name, &m.Price, &m.Description, &m.ImageURL, &m.DisplayOrder, &m.IsActive, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MenuRepo) Delete(ctx context.Context, id int) error {
	_, err := r.pool.Exec(ctx, "UPDATE menus SET is_active = false WHERE id = $1", id)
	return err
}

func (r *MenuRepo) UpdateOrder(ctx context.Context, menuIDs []int) error {
	for i, id := range menuIDs {
		_, err := r.pool.Exec(ctx, "UPDATE menus SET display_order = $1 WHERE id = $2", i+1, id)
		if err != nil {
			return err
		}
	}
	return nil
}
