package metrics

import (
	"sync/atomic"
	"time"

	"table-order-backend/internal/broker"
)

type Collector struct {
	ordersPerSecond atomic.Int64
	totalOrders     atomic.Int64
	totalRevenue    atomic.Int64
	currentSecond   atomic.Int64
}

func NewCollector() *Collector {
	return &Collector{}
}

func (c *Collector) RecordOrder(amount int) {
	c.ordersPerSecond.Add(1)
	c.totalOrders.Add(1)
	c.totalRevenue.Add(int64(amount))
}

func (c *Collector) GetCurrentMetrics() map[string]int64 {
	return map[string]int64{
		"orders_per_second": c.currentSecond.Load(),
		"total_orders":      c.totalOrders.Load(),
		"total_revenue":     c.totalRevenue.Load(),
	}
}

func (c *Collector) StartBroadcast(eventBroker *broker.EventBroker) {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		// Snapshot and reset per-second counter
		ops := c.ordersPerSecond.Swap(0)
		c.currentSecond.Store(ops)

		eventBroker.Publish(broker.Event{
			Type: "metrics",
			Data: map[string]int64{
				"orders_per_second": ops,
				"total_orders":      c.totalOrders.Load(),
				"total_revenue":     c.totalRevenue.Load(),
			},
		})
	}
}
