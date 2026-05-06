package handler

import (
	"net/http"
	"strconv"

	"table-order-backend/internal/model"
	"table-order-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	orderService *service.OrderService
}

func NewOrderHandler(orderService *service.OrderService) *OrderHandler {
	return &OrderHandler{orderService: orderService}
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

	order, err := h.orderService.CreateOrder(c.Request.Context(), tid, sid, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, order)
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
