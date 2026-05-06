package handler

import (
	"fmt"
	"io"
	"time"

	"table-order-backend/internal/broker"
	"table-order-backend/internal/metrics"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SSEHandler struct {
	eventBroker  *broker.EventBroker
	metricsBroker *broker.MetricsBroker
	metrics      *metrics.Collector
}

func NewSSEHandler(eventBroker *broker.EventBroker, metricsBroker *broker.MetricsBroker, metrics *metrics.Collector) *SSEHandler {
	return &SSEHandler{
		eventBroker:  eventBroker,
		metricsBroker: metricsBroker,
		metrics:      metrics,
	}
}

func (h *SSEHandler) OrderEvents(c *gin.Context) {
	clientID := uuid.New().String()
	client := h.eventBroker.Subscribe(clientID)
	defer h.eventBroker.Unsubscribe(clientID)

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	// Use a ticker to batch-flush events every 100ms for smoother streaming
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	c.Stream(func(w io.Writer) bool {
		select {
		case msg, ok := <-client.Events:
			if !ok {
				return false
			}
			fmt.Fprintf(w, "data: %s\n\n", msg)
			// Drain any additional buffered events (up to 20 per flush)
			for i := 0; i < 20; i++ {
				select {
				case extra, ok := <-client.Events:
					if !ok {
						return false
					}
					fmt.Fprintf(w, "data: %s\n\n", extra)
				default:
					return true
				}
			}
			return true
		case <-ticker.C:
			// Keep-alive / flush opportunity
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}

func (h *SSEHandler) MetricsStream(c *gin.Context) {
	clientID := "metrics-" + uuid.New().String()
	client := h.metricsBroker.Subscribe(clientID)
	defer h.metricsBroker.Unsubscribe(clientID)

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	c.Stream(func(w io.Writer) bool {
		select {
		case msg, ok := <-client.Events:
			if !ok {
				return false
			}
			fmt.Fprintf(w, "data: %s\n\n", msg)
			return true
		case <-c.Request.Context().Done():
			return false
		}
	})
}
