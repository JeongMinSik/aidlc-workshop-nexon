package service

import (
	"context"

	"table-order-backend/internal/model"
	"table-order-backend/internal/repository"
)

type MenuService struct {
	menuRepo     *repository.MenuRepo
	categoryRepo *repository.CategoryRepo
}

func NewMenuService(menuRepo *repository.MenuRepo, categoryRepo *repository.CategoryRepo) *MenuService {
	return &MenuService{
		menuRepo:     menuRepo,
		categoryRepo: categoryRepo,
	}
}

func (s *MenuService) GetMenusWithCategories(ctx context.Context) ([]model.CategoryWithMenus, error) {
	return s.menuRepo.GetAllWithCategories(ctx)
}

func (s *MenuService) CreateMenu(ctx context.Context, req model.CreateMenuRequest) (*model.Menu, error) {
	return s.menuRepo.Create(ctx, req)
}

func (s *MenuService) UpdateMenu(ctx context.Context, id int, req model.UpdateMenuRequest) (*model.Menu, error) {
	return s.menuRepo.Update(ctx, id, req)
}

func (s *MenuService) DeleteMenu(ctx context.Context, id int) error {
	return s.menuRepo.Delete(ctx, id)
}

func (s *MenuService) UpdateMenuOrder(ctx context.Context, menuIDs []int) error {
	return s.menuRepo.UpdateOrder(ctx, menuIDs)
}
