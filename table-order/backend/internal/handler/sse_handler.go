package handler

import (
	"fmt"
	"io"

	"table-order-backend/internal/broker"
	"table-order-backend/internal/metrics"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SSEHandler struct {
	eventBroker *broker.EventBroker
	metrics     *metrics.Collector
}

func NewSSEHandler(eventBroker *broker.EventBroker, metrics *metrics.Collector) *SSEHandler {
	return &SSEHandler{
		eventBroker: eventBroker,
		metrics:     metrics,
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

func (h *SSEHandler) MetricsStream(c *gin.Context) {
	clientID := "metrics-" + uuid.New().String()
	client := h.eventBroker.Subscribe(clientID)
	defer h.eventBroker.Unsubscribe(clientID)

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
