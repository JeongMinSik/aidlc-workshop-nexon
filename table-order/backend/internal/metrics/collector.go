package metrics

import (
	"math"
	"sort"
	"sync"
	"sync/atomic"
	"time"

	"table-order-backend/internal/broker"
)

type Collector struct {
	ordersPerSecond atomic.Int64
	totalOrders     atomic.Int64
	totalRevenue    atomic.Int64
	currentSecond   atomic.Int64
	errorCount      atomic.Int64
	activeVUs       atomic.Int64

	// Latency tracking (per second window)
	latencyMu      sync.Mutex
	latencies      []float64
	latencyP50     float64
	latencyP95     float64
	latencyP99     float64
	latencyAvg     float64
}

func NewCollector() *Collector {
	return &Collector{
		latencies: make([]float64, 0, 10000),
	}
}

func (c *Collector) RecordOrder(amount int) {
	c.ordersPerSecond.Add(1)
	c.totalOrders.Add(1)
	c.totalRevenue.Add(int64(amount))
}

func (c *Collector) RecordLatency(durationMs float64) {
	c.latencyMu.Lock()
	c.latencies = append(c.latencies, durationMs)
	c.latencyMu.Unlock()
}

func (c *Collector) RecordError() {
	c.errorCount.Add(1)
}

func (c *Collector) SetActiveVUs(n int64) {
	c.activeVUs.Store(n)
}

func (c *Collector) GetCurrentMetrics() map[string]interface{} {
	return map[string]interface{}{
		"orders_per_second": c.currentSecond.Load(),
		"total_orders":      c.totalOrders.Load(),
		"total_revenue":     c.totalRevenue.Load(),
		"error_count":       c.errorCount.Load(),
		"active_vus":        c.activeVUs.Load(),
		"latency_p50":       c.latencyP50,
		"latency_p95":       c.latencyP95,
		"latency_p99":       c.latencyP99,
		"latency_avg":       c.latencyAvg,
	}
}

func (c *Collector) StartBroadcast(metricsBroker *broker.MetricsBroker) {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		// Snapshot and reset per-second counter
		ops := c.ordersPerSecond.Swap(0)
		c.currentSecond.Store(ops)

		// Calculate latency percentiles
		c.latencyMu.Lock()
		latencies := make([]float64, len(c.latencies))
		copy(latencies, c.latencies)
		c.latencies = c.latencies[:0]
		c.latencyMu.Unlock()

		if len(latencies) > 0 {
			sort.Float64s(latencies)
			c.latencyP50 = percentile(latencies, 50)
			c.latencyP95 = percentile(latencies, 95)
			c.latencyP99 = percentile(latencies, 99)

			var sum float64
			for _, l := range latencies {
				sum += l
			}
			c.latencyAvg = math.Round(sum/float64(len(latencies))*100) / 100
		} else if ops == 0 {
			// No traffic, reset latencies
			c.latencyP50 = 0
			c.latencyP95 = 0
			c.latencyP99 = 0
			c.latencyAvg = 0
		}

		totalOps := c.totalOrders.Load()
		errCount := c.errorCount.Load()
		var errorRate float64
		if totalOps > 0 {
			errorRate = math.Round(float64(errCount)/float64(totalOps+errCount)*10000) / 100
		}

		metricsBroker.Publish(broker.Event{
			Type: "metrics",
			Data: map[string]interface{}{
				"orders_per_second": ops,
				"total_orders":      c.totalOrders.Load(),
				"total_revenue":     c.totalRevenue.Load(),
				"error_count":       errCount,
				"error_rate":        errorRate,
				"active_vus":        c.activeVUs.Load(),
				"latency_p50":       c.latencyP50,
				"latency_p95":       c.latencyP95,
				"latency_p99":       c.latencyP99,
				"latency_avg":       c.latencyAvg,
			},
		})
	}
}

func percentile(sorted []float64, p float64) float64 {
	if len(sorted) == 0 {
		return 0
	}
	idx := (p / 100) * float64(len(sorted)-1)
	lower := int(math.Floor(idx))
	upper := int(math.Ceil(idx))
	if lower == upper {
		return math.Round(sorted[lower]*100) / 100
	}
	weight := idx - float64(lower)
	return math.Round((sorted[lower]*(1-weight)+sorted[upper]*weight)*100) / 100
}
