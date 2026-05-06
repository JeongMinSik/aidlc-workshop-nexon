package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"table-order-backend/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type OrderRepo struct {
	pool *pgxpool.Pool
}

func NewOrderRepo(pool *pgxpool.Pool) *OrderRepo {
	return &OrderRepo{pool: pool}
}

func (r *OrderRepo) Create(ctx context.Context, tableID int, sessionID string, items []model.CreateOrderItem, menus map[int]*model.Menu) (*model.Order, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Generate order number
	today := time.Now().Format("20060102")
	var seq int
	err = tx.QueryRow(ctx,
		"SELECT COUNT(*) + 1 FROM orders WHERE created_at::date = CURRENT_DATE").Scan(&seq)
	if err != nil {
		return nil, err
	}
	orderNumber := fmt.Sprintf("ORD-%s-%03d", today, seq)

	// Calculate total
	totalAmount := 0
	for _, item := range items {
		menu := menus[item.MenuID]
		totalAmount += menu.Price * item.Quantity
	}

	// Insert order
	var order model.Order
	err = tx.QueryRow(ctx,
		`INSERT INTO orders (table_id, session_id, order_number, status, total_amount)
		 VALUES ($1, $2, $3, 'pending', $4)
		 RETURNING id, table_id, session_id, order_number, status, total_amount, created_at`,
		tableID, sessionID, orderNumber, totalAmount,
	).Scan(&order.ID, &order.TableID, &order.SessionID, &order.OrderNumber, &order.Status, &order.TotalAmount, &order.CreatedAt)
	if err != nil {
		return nil, err
	}

	// Insert order items
	for _, item := range items {
		menu := menus[item.MenuID]
		_, err = tx.Exec(ctx,
			`INSERT INTO order_items (order_id, menu_id, menu_name, quantity, unit_price)
			 VALUES ($1, $2, $3, $4, $5)`,
			order.ID, item.MenuID, menu.Name, item.Quantity, menu.Price,
		)
		if err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	// Load items for response
	order.Items, _ = r.getOrderItems(ctx, order.ID)
	return &order, nil
}

func (r *OrderRepo) GetBySession(ctx context.Context, tableID int, sessionID string) ([]model.Order, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT o.id, o.table_id, o.session_id, o.order_number, o.status, o.total_amount, o.created_at
		 FROM orders o WHERE o.table_id = $1 AND o.session_id = $2
		 ORDER BY o.created_at DESC`,
		tableID, sessionID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []model.Order
	for rows.Next() {
		var o model.Order
		err := rows.Scan(&o.ID, &o.TableID, &o.SessionID, &o.OrderNumber, &o.Status, &o.TotalAmount, &o.CreatedAt)
		if err != nil {
			return nil, err
		}
		o.Items, _ = r.getOrderItems(ctx, o.ID)
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *OrderRepo) GetAllActive(ctx context.Context) ([]model.Order, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT o.id, o.table_id, o.session_id, o.order_number, o.status, o.total_amount, o.created_at, t.table_number
		 FROM orders o JOIN table_info t ON o.table_id = t.id
		 ORDER BY o.created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []model.Order
	for rows.Next() {
		var o model.Order
		err := rows.Scan(&o.ID, &o.TableID, &o.SessionID, &o.OrderNumber, &o.Status, &o.TotalAmount, &o.CreatedAt, &o.TableNumber)
		if err != nil {
			return nil, err
		}
		o.Items, _ = r.getOrderItems(ctx, o.ID)
		orders = append(orders, o)
	}
	return orders, nil
}

func (r *OrderRepo) UpdateStatus(ctx context.Context, id int, status string) (*model.Order, error) {
	var o model.Order
	err := r.pool.QueryRow(ctx,
		`UPDATE orders SET status = $2 WHERE id = $1
		 RETURNING id, table_id, session_id, order_number, status, total_amount, created_at`,
		id, status,
	).Scan(&o.ID, &o.TableID, &o.SessionID, &o.OrderNumber, &o.Status, &o.TotalAmount, &o.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *OrderRepo) Delete(ctx context.Context, id int) error {
	_, err := r.pool.Exec(ctx, "DELETE FROM orders WHERE id = $1", id)
	return err
}

func (r *OrderRepo) MoveToHistory(ctx context.Context, tableID int, sessionID string) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Get all orders for this session
	rows, err := tx.Query(ctx,
		`SELECT o.id, o.table_id, o.session_id, o.order_number, o.status, o.total_amount, o.created_at
		 FROM orders o WHERE o.table_id = $1 AND o.session_id = $2`,
		tableID, sessionID,
	)
	if err != nil {
		return err
	}

	var orders []model.Order
	var totalAmount int
	for rows.Next() {
		var o model.Order
		err := rows.Scan(&o.ID, &o.TableID, &o.SessionID, &o.OrderNumber, &o.Status, &o.TotalAmount, &o.CreatedAt)
		if err != nil {
			rows.Close()
			return err
		}
		o.Items, _ = r.getOrderItems(ctx, o.ID)
		orders = append(orders, o)
		totalAmount += o.TotalAmount
	}
	rows.Close()

	if len(orders) == 0 {
		return tx.Commit(ctx)
	}

	// Save to history as JSON
	orderData, err := json.Marshal(orders)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx,
		`INSERT INTO order_history (table_id, session_id, order_data, total_amount)
		 VALUES ($1, $2, $3, $4)`,
		tableID, sessionID, string(orderData), totalAmount,
	)
	if err != nil {
		return err
	}

	// Delete orders and items
	_, err = tx.Exec(ctx,
		"DELETE FROM orders WHERE table_id = $1 AND session_id = $2",
		tableID, sessionID,
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (r *OrderRepo) GetHistory(ctx context.Context, tableID int, date *string) ([]model.OrderHistory, error) {
	query := "SELECT id, table_id, session_id, order_data, total_amount, completed_at FROM order_history WHERE table_id = $1"
	args := []interface{}{tableID}

	if date != nil && *date != "" {
		query += " AND completed_at::date = $2"
		args = append(args, *date)
	}
	query += " ORDER BY completed_at DESC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var history []model.OrderHistory
	for rows.Next() {
		var h model.OrderHistory
		err := rows.Scan(&h.ID, &h.TableID, &h.SessionID, &h.OrderData, &h.TotalAmount, &h.CompletedAt)
		if err != nil {
			return nil, err
		}
		history = append(history, h)
	}
	return history, nil
}

func (r *OrderRepo) getOrderItems(ctx context.Context, orderID int) ([]model.OrderItem, error) {
	rows, err := r.pool.Query(ctx,
		"SELECT id, order_id, menu_id, menu_name, quantity, unit_price FROM order_items WHERE order_id = $1",
		orderID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.OrderItem
	for rows.Next() {
		var item model.OrderItem
		err := rows.Scan(&item.ID, &item.OrderID, &item.MenuID, &item.MenuName, &item.Quantity, &item.UnitPrice)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}
