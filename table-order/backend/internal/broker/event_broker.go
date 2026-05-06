package broker

import (
	"encoding/json"
	"sync"
)

type Event struct {
	Type string      `json:"type"`
	Data interface{} `json:"data"`
}

type Client struct {
	ID     string
	Events chan string
}

type EventBroker struct {
	clients map[string]*Client
	mu      sync.RWMutex
}

func NewEventBroker() *EventBroker {
	return &EventBroker{
		clients: make(map[string]*Client),
	}
}

func (b *EventBroker) Subscribe(clientID string) *Client {
	b.mu.Lock()
	defer b.mu.Unlock()

	client := &Client{
		ID:     clientID,
		Events: make(chan string, 4096),
	}
	b.clients[clientID] = client
	return client
}

func (b *EventBroker) Unsubscribe(clientID string) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if client, ok := b.clients[clientID]; ok {
		close(client.Events)
		delete(b.clients, clientID)
	}
}

func (b *EventBroker) Publish(event Event) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	data, err := json.Marshal(event)
	if err != nil {
		return
	}

	msg := string(data)
	isHighPriority := event.Type == "metrics"

	for _, client := range b.clients {
		if isHighPriority {
			// For metrics events: drain old messages if channel is full to ensure delivery
			select {
			case client.Events <- msg:
			default:
				// Channel full - drain one old message and retry
				select {
				case <-client.Events:
				default:
				}
				select {
				case client.Events <- msg:
				default:
				}
			}
		} else {
			// For regular events: skip slow consumers
			select {
			case client.Events <- msg:
			default:
			}
		}
	}
}

// MetricsBroker is a dedicated broker for metrics events only.
// Separated from the main EventBroker to prevent order event floods
// from blocking metrics delivery during load tests.
type MetricsBroker struct {
	clients map[string]*Client
	mu      sync.RWMutex
}

func NewMetricsBroker() *MetricsBroker {
	return &MetricsBroker{
		clients: make(map[string]*Client),
	}
}

func (b *MetricsBroker) Subscribe(clientID string) *Client {
	b.mu.Lock()
	defer b.mu.Unlock()

	client := &Client{
		ID:     clientID,
		Events: make(chan string, 256),
	}
	b.clients[clientID] = client
	return client
}

func (b *MetricsBroker) Unsubscribe(clientID string) {
	b.mu.Lock()
	defer b.mu.Unlock()

	if client, ok := b.clients[clientID]; ok {
		close(client.Events)
		delete(b.clients, clientID)
	}
}

func (b *MetricsBroker) Publish(event Event) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	data, err := json.Marshal(event)
	if err != nil {
		return
	}

	msg := string(data)
	for _, client := range b.clients {
		select {
		case client.Events <- msg:
		default:
			// Drop old metrics for slow consumers (they'll get the next one)
		}
	}
}
