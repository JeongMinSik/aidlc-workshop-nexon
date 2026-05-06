package service

import (
	"context"
	"errors"

	"table-order-backend/internal/broker"
	"table-order-backend/internal/metrics"
	"table-order-backend/internal/model"
	"table-order-backend/internal/repository"

	"github.com/google/uuid"
)

type OrderService struct {
	orderRepo   *repository.OrderRepo
	menuRepo    *repository.MenuRepo
	tableRepo   *repository.TableRepo
	eventBroker *broker.EventBroker
	metrics     *metrics.Collector
}

func NewOrderService(
	orderRepo *repository.OrderRepo,
	menuRepo *repository.MenuRepo,
	tableRepo *repository.TableRepo,
	eventBroker *broker.EventBroker,
	metrics *metrics.Collector,
) *OrderService {
	return &OrderService{
		orderRepo:   orderRepo,
		menuRepo:    menuRepo,
		tableRepo:   tableRepo,
		eventBroker: eventBroker,
		metrics:     metrics,
	}
}

func (s *OrderService) CreateOrder(ctx context.Context, tableID int, sessionID string, req model.CreateOrderRequest) (*model.Order, error) {
	// Validate menus and build menu map
	menus := make(map[int]*model.Menu)
	for _, item := range req.Items {
		menu, err := s.menuRepo.GetByID(ctx, item.MenuID)
		if err != nil {
			return nil, errors.New("invalid menu item")
		}
		if !menu.IsActive {
			return nil, errors.New("menu item is not available")
		}
		menus[item.MenuID] = menu
	}

	// If no active session, start one
	if sessionID == "" {
		sessionID = uuid.New().String()
		if err := s.tableRepo.StartSession(ctx, tableID, sessionID); err != nil {
			return nil, err
		}
	}

	// Create order
	order, err := s.orderRepo.Create(ctx, tableID, sessionID, req.Items, menus)
	if err != nil {
		return nil, err
	}

	// Get table number for event
	table, _ := s.tableRepo.GetByID(ctx, tableID)
	tableNumber := 0
	if table != nil {
		tableNumber = table.TableNumber
	}

	// Publish event
	s.eventBroker.Publish(broker.Event{
		Type: "new_order",
		Data: map[string]interface{}{
			"order_id":     order.ID,
			"order_number": order.OrderNumber,
			"table_id":     tableID,
			"table_number": tableNumber,
			"items":        order.Items,
			"total_amount": order.TotalAmount,
			"status":       order.Status,
			"created_at":   order.CreatedAt,
		},
	})

	// Record metrics
	s.metrics.RecordOrder(order.TotalAmount)

	return order, nil
}

func (s *OrderService) GetOrdersBySession(ctx context.Context, tableID int, sessionID string) ([]model.Order, error) {
	return s.orderRepo.GetBySession(ctx, tableID, sessionID)
}

func (s *OrderService) UpdateStatus(ctx context.Context, orderID int, status string) (*model.Order, error) {
	order, err := s.orderRepo.UpdateStatus(ctx, orderID, status)
	if err != nil {
		return nil, err
	}

	s.eventBroker.Publish(broker.Event{
		Type: "status_change",
		Data: map[string]interface{}{
			"order_id": order.ID,
			"status":   order.Status,
		},
	})

	return order, nil
}

func (s *OrderService) DeleteOrder(ctx context.Context, orderID int) error {
	err := s.orderRepo.Delete(ctx, orderID)
	if err != nil {
		return err
	}

	s.eventBroker.Publish(broker.Event{
		Type: "order_deleted",
		Data: map[string]interface{}{
			"order_id": orderID,
		},
	})

	return nil
}
