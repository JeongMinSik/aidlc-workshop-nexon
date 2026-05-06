package service

import (
	"context"
	"errors"

	"table-order-backend/internal/model"
	"table-order-backend/internal/repository"
)

type CategoryService struct {
	categoryRepo *repository.CategoryRepo
}

func NewCategoryService(categoryRepo *repository.CategoryRepo) *CategoryService {
	return &CategoryService{categoryRepo: categoryRepo}
}

func (s *CategoryService) GetAll(ctx context.Context) ([]model.Category, error) {
	return s.categoryRepo.GetAll(ctx)
}

func (s *CategoryService) Create(ctx context.Context, req model.CreateCategoryRequest) (*model.Category, error) {
	return s.categoryRepo.Create(ctx, req)
}

func (s *CategoryService) Update(ctx context.Context, id int, req model.UpdateCategoryRequest) (*model.Category, error) {
	return s.categoryRepo.Update(ctx, id, req)
}

func (s *CategoryService) Delete(ctx context.Context, id int) error {
	hasMenus, err := s.categoryRepo.HasActiveMenus(ctx, id)
	if err != nil {
		return err
	}
	if hasMenus {
		return errors.New("cannot delete category with active menus")
	}
	return s.categoryRepo.Delete(ctx, id)
}
