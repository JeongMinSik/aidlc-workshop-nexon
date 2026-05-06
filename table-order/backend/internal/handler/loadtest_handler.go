package handler

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"table-order-backend/internal/metrics"
	"table-order-backend/internal/model"
	"table-order-backend/internal/service"

	"github.com/gin-gonic/gin"
)

type LoadTestHandler struct {
	orderService *service.OrderService
	metrics      *metrics.Collector
	running      atomic.Bool
	stopCh       chan struct{}
	mu           sync.Mutex
	stats        loadTestStats
	sem          chan struct{}
	done         chan struct{} // signals that runLoadTest goroutine has fully exited
}

type loadTestStats struct {
	successCount atomic.Int64
	errorCount   atomic.Int64
}

func NewLoadTestHandler(orderService *service.OrderService, metricsCollector *metrics.Collector) *LoadTestHandler {
	return &LoadTestHandler{
		orderService: orderService,
		metrics:      metricsCollector,
		sem:          make(chan struct{}, 20), // limit concurrent DB operations
	}
}

func (h *LoadTestHandler) StartLoadTest(c *gin.Context) {
	h.mu.Lock()

	// If a previous goroutine is still cleaning up, wait for it
	if h.done != nil {
		done := h.done
		h.mu.Unlock()
		// Wait for previous run to fully exit (with timeout)
		select {
		case <-done:
		case <-time.After(3 * time.Second):
			c.JSON(http.StatusConflict, gin.H{"error": "load test already running"})
			return
		}
		h.mu.Lock()
	}

	if h.running.Load() {
		h.mu.Unlock()
		c.JSON(http.StatusConflict, gin.H{"error": "load test already running"})
		return
	}

	type StartRequest struct {
		VUs      int `json:"vus"`
		Duration int `json:"duration"`
	}

	var req StartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req = StartRequest{VUs: 30, Duration: 30}
	}

	// Clamp values
	if req.VUs < 1 {
		req.VUs = 1
	}
	if req.VUs > 200 {
		req.VUs = 200
	}
	if req.Duration < 5 {
		req.Duration = 5
	}
	if req.Duration > 300 {
		req.Duration = 300
	}

	h.stopCh = make(chan struct{})
	h.done = make(chan struct{})
	h.running.Store(true)
	h.stats.successCount.Store(0)
	h.stats.errorCount.Store(0)
	h.mu.Unlock()

	go h.runLoadTest(req.VUs, req.Duration)

	c.JSON(http.StatusOK, gin.H{
		"message":  "load test started",
		"vus":      req.VUs,
		"duration": req.Duration,
	})
}

func (h *LoadTestHandler) StopLoadTest(c *gin.Context) {
	h.mu.Lock()
	if !h.running.Load() {
		h.mu.Unlock()
		c.JSON(http.StatusOK, gin.H{"message": "no load test running"})
		return
	}

	close(h.stopCh)
	h.running.Store(false)
	h.metrics.SetActiveVUs(0)
	h.mu.Unlock()

	// Wait for goroutine to fully exit so next Start won't conflict
	if h.done != nil {
		select {
		case <-h.done:
		case <-time.After(5 * time.Second):
			log.Printf("[LoadTest] Warning: goroutine did not exit within timeout after stop")
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "load test stopped",
		"success": h.stats.successCount.Load(),
		"errors":  h.stats.errorCount.Load(),
	})
}

func (h *LoadTestHandler) GetStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"running": h.running.Load(),
		"success": h.stats.successCount.Load(),
		"errors":  h.stats.errorCount.Load(),
	})
}

func (h *LoadTestHandler) runLoadTest(vus int, durationSec int) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[LoadTest] Recovered from panic: %v", r)
		}
		h.running.Store(false)
		h.metrics.SetActiveVUs(0)
		log.Printf("[LoadTest] Completed - Success: %d, Errors: %d",
			h.stats.successCount.Load(), h.stats.errorCount.Load())
		// Signal that this goroutine has fully exited
		close(h.done)
	}()

	h.metrics.SetActiveVUs(int64(vus))

	ctx := context.Background()
	deadline := time.After(time.Duration(durationSec) * time.Second)

	var wg sync.WaitGroup

	for i := 0; i < vus; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			defer func() {
				if r := recover(); r != nil {
					log.Printf("[LoadTest] Worker %d recovered from panic: %v", workerID, r)
				}
			}()
			for {
				select {
				case <-h.stopCh:
					return
				case <-deadline:
					return
				default:
					start := time.Now()
					if err := h.createRandomOrder(ctx); err != nil {
						h.stats.errorCount.Add(1)
						h.metrics.RecordError()
					} else {
						h.stats.successCount.Add(1)
					}
					elapsed := time.Since(start)
					h.metrics.RecordLatency(float64(elapsed.Microseconds()) / 1000.0)

					// Jitter between 50-150ms per VU to avoid thundering herd
					time.Sleep(time.Duration(50+rand.Intn(100)) * time.Millisecond)
				}
			}
		}(i)
	}

	wg.Wait()
}

func (h *LoadTestHandler) createRandomOrder(ctx context.Context) error {
	// Acquire semaphore to limit concurrent DB access
	h.sem <- struct{}{}
	defer func() { <-h.sem }()

	// Tables 1-5 are seeded
	tableID := rand.Intn(5) + 1
	sessionID := fmt.Sprintf("00000000-0000-0000-0000-%012d", tableID)

	// Menus 1-16 are seeded
	numItems := rand.Intn(3) + 1
	items := make([]model.CreateOrderItem, numItems)
	usedMenus := make(map[int]bool)
	for i := range items {
		menuID := rand.Intn(16) + 1
		// Avoid duplicate menu items in same order
		for usedMenus[menuID] {
			menuID = rand.Intn(16) + 1
		}
		usedMenus[menuID] = true
		items[i] = model.CreateOrderItem{
			MenuID:   menuID,
			Quantity: rand.Intn(3) + 1,
		}
	}

	req := model.CreateOrderRequest{Items: items}
	_, err := h.orderService.CreateOrder(ctx, tableID, sessionID, req)
	return err
}
