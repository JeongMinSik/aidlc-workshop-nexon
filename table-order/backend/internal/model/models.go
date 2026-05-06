package model

import "time"

type Admin struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type Category struct {
	ID           int       `json:"id"`
	Name         string    `json:"name"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
}

type Menu struct {
	ID           int       `json:"id"`
	CategoryID   int       `json:"category_id"`
	Name         string    `json:"name"`
	Price        int       `json:"price"`
	Description  string    `json:"description"`
	ImageURL     string    `json:"image_url"`
	DisplayOrder int       `json:"display_order"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}

type TableInfo struct {
	ID               int        `json:"id"`
	TableNumber      int        `json:"table_number"`
	PasswordHash     string     `json:"-"`
	SessionID        *string    `json:"session_id"`
	SessionStartedAt *time.Time `json:"session_started_at"`
	CreatedAt        time.Time  `json:"created_at"`
}

type Order struct {
	ID          int         `json:"id"`
	TableID     int         `json:"table_id"`
	SessionID   string      `json:"session_id"`
	OrderNumber string      `json:"order_number"`
	Status      string      `json:"status"`
	TotalAmount int         `json:"total_amount"`
	CreatedAt   time.Time   `json:"created_at"`
	Items       []OrderItem `json:"items,omitempty"`
	TableNumber int         `json:"table_number,omitempty"`
}

type OrderItem struct {
	ID        int    `json:"id"`
	OrderID   int    `json:"order_id"`
	MenuID    int    `json:"menu_id"`
	MenuName  string `json:"menu_name"`
	Quantity  int    `json:"quantity"`
	UnitPrice int    `json:"unit_price"`
}

type OrderHistory struct {
	ID          int       `json:"id"`
	TableID     int       `json:"table_id"`
	SessionID   string    `json:"session_id"`
	OrderData   string    `json:"order_data"`
	TotalAmount int       `json:"total_amount"`
	CompletedAt time.Time `json:"completed_at"`
}

// Request/Response types

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AdminLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type TableLoginRequest struct {
	TableNumber int    `json:"table_number" binding:"required"`
	Password    string `json:"password" binding:"required"`
}

type CreateOrderRequest struct {
	Items []CreateOrderItem `json:"items" binding:"required,min=1"`
}

type CreateOrderItem struct {
	MenuID   int `json:"menu_id" binding:"required"`
	Quantity int `json:"quantity" binding:"required,min=1"`
}

type UpdateStatusRequest struct {
	Status string `json:"status" binding:"required,oneof=pending preparing completed"`
}

type CreateMenuRequest struct {
	CategoryID  int    `json:"category_id" binding:"required"`
	Name        string `json:"name" binding:"required,max=200"`
	Price       int    `json:"price" binding:"required,min=0"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url"`
}

type UpdateMenuRequest struct {
	CategoryID  *int    `json:"category_id"`
	Name        *string `json:"name"`
	Price       *int    `json:"price"`
	Description *string `json:"description"`
	ImageURL    *string `json:"image_url"`
}

type UpdateMenuOrderRequest struct {
	MenuIDs []int `json:"menu_ids" binding:"required"`
}

type CreateTableRequest struct {
	TableNumber int    `json:"table_number" binding:"required"`
	Password    string `json:"password" binding:"required"`
}

type CreateCategoryRequest struct {
	Name         string `json:"name" binding:"required,max=100"`
	DisplayOrder int    `json:"display_order"`
}

type UpdateCategoryRequest struct {
	Name         *string `json:"name"`
	DisplayOrder *int    `json:"display_order"`
}

type CategoryWithMenus struct {
	Category
	Menus []Menu `json:"menus"`
}

type TokenResponse struct {
	Token     string `json:"token"`
	ExpiresAt int64  `json:"expires_at"`
}

type TableTokenResponse struct {
	Token       string  `json:"token"`
	TableID     int     `json:"table_id"`
	TableNumber int     `json:"table_number"`
	SessionID   *string `json:"session_id"`
	ExpiresAt   int64   `json:"expires_at"`
}
