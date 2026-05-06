package handler

import (
	"net/http"
	"strconv"

	"table-order-backend/internal/model"
	"table-order-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type TableHandler struct {
	tableService *service.TableService
}

func NewTableHandler(tableService *service.TableService) *TableHandler {
	return &TableHandler{tableService: tableService}
}

func (h *TableHandler) GetTables(c *gin.Context) {
	tables, err := h.tableService.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get tables"})
		return
	}
	if tables == nil {
		tables = []model.TableInfo{}
	}
	c.JSON(http.StatusOK, gin.H{"tables": tables})
}

func (h *TableHandler) CreateTable(c *gin.Context) {
	var req model.CreateTableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	table, err := h.tableService.CreateTable(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create table"})
		return
	}
	c.JSON(http.StatusCreated, table)
}

func (h *TableHandler) CompleteTable(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.tableService.CompleteTable(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to complete table"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *TableHandler) GetTableHistory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	date := c.Query("date")
	var datePtr *string
	if date != "" {
		datePtr = &date
	}

	history, err := h.tableService.GetHistory(c.Request.Context(), id, datePtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get history"})
		return
	}
	if history == nil {
		history = []model.OrderHistory{}
	}
	c.JSON(http.StatusOK, gin.H{"history": history})
}
