package handler

import (
	"net/http"
	"strconv"
	"time"

	"table-order-backend/internal/model"
	"table-order-backend/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type OrderHandler struct {
	orderService *service.OrderService
	jwtSecret    string
}

func NewOrderHandler(orderService *service.OrderService, jwtSecret string) *OrderHandler {
	return &OrderHandler{orderService: orderService, jwtSecret: jwtSecret}
}

func (h *OrderHandler) CreateOrder(c *gin.Context) {
	var req model.CreateOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	tableID, _ := c.Get("table_id")
	sessionID, _ := c.Get("session_id")

	tid, ok := tableID.(int)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid table"})
		return
	}

	sid := ""
	if sessionID != nil {
		sid, _ = sessionID.(string)
	}

	hadNoSession := sid == ""

	order, err := h.orderService.CreateOrder(c.Request.Context(), tid, sid, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// If a new session was created, issue a refreshed token containing the session_id
	response := gin.H{
		"id":           order.ID,
		"table_id":     order.TableID,
		"session_id":   order.SessionID,
		"order_number": order.OrderNumber,
		"status":       order.Status,
		"total_amount": order.TotalAmount,
		"created_at":   order.CreatedAt,
		"items":        order.Items,
	}

	if hadNoSession && order.SessionID != "" {
		claims, _ := c.Get("claims")
		if mapClaims, ok := claims.(jwt.MapClaims); ok {
			newClaims := jwt.MapClaims{
				"table_id":     mapClaims["table_id"],
				"table_number": mapClaims["table_number"],
				"role":         mapClaims["role"],
				"session_id":   order.SessionID,
				"exp":          time.Now().Add(16 * time.Hour).Unix(),
			}
			token := jwt.NewWithClaims(jwt.SigningMethodHS256, newClaims)
			if tokenString, err := token.SignedString([]byte(h.jwtSecret)); err == nil {
				response["token"] = tokenString
			}
		}
	}

	c.JSON(http.StatusCreated, response)
}

func (h *OrderHandler) GetOrders(c *gin.Context) {
	tableID, _ := c.Get("table_id")
	sessionID, _ := c.Get("session_id")

	tid, ok := tableID.(int)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid table"})
		return
	}

	sid := ""
	if sessionID != nil {
		sid, _ = sessionID.(string)
	}

	if sid == "" {
		c.JSON(http.StatusOK, gin.H{"orders": []interface{}{}})
		return
	}

	orders, err := h.orderService.GetOrdersBySession(c.Request.Context(), tid, sid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get orders"})
		return
	}

	if orders == nil {
		orders = []model.Order{}
	}
	c.JSON(http.StatusOK, gin.H{"orders": orders})
}

func (h *OrderHandler) UpdateOrderStatus(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req model.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	order, err := h.orderService.UpdateStatus(c.Request.Context(), id, req.Status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update status"})
		return
	}
	c.JSON(http.StatusOK, order)
}

func (h *OrderHandler) DeleteOrder(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.orderService.DeleteOrder(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete order"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *OrderHandler) GetAllOrders(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "30"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	status := c.DefaultQuery("status", "all")

	if limit <= 0 || limit > 100 {
		limit = 30
	}
	if offset < 0 {
		offset = 0
	}

	orders, total, err := h.orderService.GetAllOrdersPaginated(c.Request.Context(), limit, offset, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get orders"})
		return
	}

	if orders == nil {
		orders = []model.Order{}
	}

	c.JSON(http.StatusOK, gin.H{
		"orders":  orders,
		"total":   total,
		"limit":   limit,
		"offset":  offset,
		"hasMore": offset+limit < total,
	})
}
