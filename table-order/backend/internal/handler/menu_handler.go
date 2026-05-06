package handler

import (
	"net/http"
	"strconv"

	"table-order-backend/internal/model"
	"table-order-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type MenuHandler struct {
	menuService *service.MenuService
}

func NewMenuHandler(menuService *service.MenuService) *MenuHandler {
	return &MenuHandler{menuService: menuService}
}

func (h *MenuHandler) GetMenus(c *gin.Context) {
	menus, err := h.menuService.GetMenusWithCategories(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get menus"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"categories": menus})
}

func (h *MenuHandler) CreateMenu(c *gin.Context) {
	var req model.CreateMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	menu, err := h.menuService.CreateMenu(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create menu"})
		return
	}
	c.JSON(http.StatusCreated, menu)
}

func (h *MenuHandler) UpdateMenu(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req model.UpdateMenuRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	menu, err := h.menuService.UpdateMenu(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update menu"})
		return
	}
	c.JSON(http.StatusOK, menu)
}

func (h *MenuHandler) DeleteMenu(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.menuService.DeleteMenu(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete menu"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *MenuHandler) UpdateMenuOrder(c *gin.Context) {
	var req model.UpdateMenuOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if err := h.menuService.UpdateMenuOrder(c.Request.Context(), req.MenuIDs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update order"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}
