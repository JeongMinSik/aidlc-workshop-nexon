package service

import (
	"context"

	"table-order-backend/internal/broker"
	"table-order-backend/internal/model"
	"table-order-backend/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

type TableService struct {
	tableRepo   *repository.TableRepo
	orderRepo   *repository.OrderRepo
	eventBroker *broker.EventBroker
}

func NewTableService(tableRepo *repository.TableRepo, orderRepo *repository.OrderRepo, eventBroker *broker.EventBroker) *TableService {
	return &TableService{
		tableRepo:   tableRepo,
		orderRepo:   orderRepo,
		eventBroker: eventBroker,
	}
}

func (s *TableService) GetAll(ctx context.Context) ([]model.TableInfo, error) {
	return s.tableRepo.GetAll(ctx)
}

func (s *TableService) CreateTable(ctx context.Context, req model.CreateTableRequest) (*model.TableInfo, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	return s.tableRepo.Create(ctx, req.TableNumber, string(hash))
}

func (s *TableService) CompleteTable(ctx context.Context, tableID int) error {
	table, err := s.tableRepo.GetByID(ctx, tableID)
	if err != nil {
		return err
	}

	if table.SessionID == nil {
		return nil // No active session
	}

	// Move orders to history
	if err := s.orderRepo.MoveToHistory(ctx, tableID, *table.SessionID); err != nil {
		return err
	}

	// Clear session
	if err := s.tableRepo.ClearSession(ctx, tableID); err != nil {
		return err
	}

	// Publish event
	s.eventBroker.Publish(broker.Event{
		Type: "table_reset",
		Data: map[string]interface{}{
			"table_id":     tableID,
			"table_number": table.TableNumber,
		},
	})

	return nil
}

func (s *TableService) GetHistory(ctx context.Context, tableID int, date *string) ([]model.OrderHistory, error) {
	return s.orderRepo.GetHistory(ctx, tableID, date)
}
