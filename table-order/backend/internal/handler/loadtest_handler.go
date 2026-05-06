package handler

import (
	"context"
	"math/rand"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"table-order-backend/internal/service"

	"table-order-backend/internal/model"

	"github.com/gin-gonic/gin"
)

type LoadTestHandler struct {
	orderService *service.OrderService
	running      atomic.Bool
	stopCh       chan struct{}
	mu           sync.Mutex
}

func NewLoadTestHandler(orderService *service.OrderService) *LoadTestHandler {
	return &LoadTestHandler{}
}

func NewLoadTestHandlerWithService(orderService *service.OrderService) *LoadTestHandler {
	return &LoadTestHandler{
		orderService: orderService,
	}
}

func (h *LoadTestHandler) StartLoadTest(c *gin.Context) {
	if h.running.Load() {
		c.JSON(http.StatusConflict, gin.H{"error": "load test already running"})
		return
	}

	// Parse parameters
	type StartRequest struct {
		VUs      int `json:"vus" binding:"required,min=1,max=200"`
		Duration int `json:"duration" binding:"required,min=5,max=300"` // seconds
	}

	var req StartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Default values for quick demo
		req = StartRequest{VUs: 30, Duration: 30}
	}

	h.mu.Lock()
	h.stopCh = make(chan struct{})
	h.running.Store(true)
	h.mu.Unlock()

	go h.runLoadTest(req.VUs, req.Duration)

	c.JSON(http.StatusOK, gin.H{
		"message":  "load test started",
		"vus":      req.VUs,
		"duration": req.Duration,
	})
}

func (h *LoadTestHandler) StopLoadTest(c *gin.Context) {
	if !h.running.Load() {
		c.JSON(http.StatusOK, gin.H{"message": "no load test running"})
		return
	}

	h.mu.Lock()
	close(h.stopCh)
	h.running.Store(false)
	h.mu.Unlock()

	c.JSON(http.StatusOK, gin.H{"message": "load test stopped"})
}

func (h *LoadTestHandler) GetStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"running": h.running.Load()})
}

func (h *LoadTestHandler) runLoadTest(vus int, durationSec int) {
	defer h.running.Store(false)

	ctx := context.Background()
	deadline := time.After(time.Duration(durationSec) * time.Second)

	var wg sync.WaitGroup

	for i := 0; i < vus; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for {
				select {
				case <-h.stopCh:
					return
				case <-deadline:
					return
				default:
					h.createRandomOrder(ctx)
					// Small jitter to avoid thundering herd
					time.Sleep(time.Duration(50+rand.Intn(100)) * time.Millisecond)
				}
			}
		}()
	}

	wg.Wait()
}

func (h *LoadTestHandler) createRandomOrder(ctx context.Context) {
	tableID := rand.Intn(5) + 1
	sessionID := "loadtest-session"

	numItems := rand.Intn(3) + 1
	items := make([]model.CreateOrderItem, numItems)
	for i := range items {
		items[i] = model.CreateOrderItem{
			MenuID:   rand.Intn(12) + 1,
			Quantity: rand.Intn(3) + 1,
		}
	}

	req := model.CreateOrderRequest{Items: items}
	h.orderService.CreateOrder(ctx, tableID, sessionID, req)
}
