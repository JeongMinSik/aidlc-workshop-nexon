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
		Events: make(chan string, 256),
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
	for _, client := range b.clients {
		select {
		case client.Events <- msg:
		default:
			// Skip slow consumers
		}
	}
}
