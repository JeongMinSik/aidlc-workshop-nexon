package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"table-order-backend/internal/broker"
	"table-order-backend/internal/config"
	"table-order-backend/internal/handler"
	"table-order-backend/internal/metrics"
	"table-order-backend/internal/middleware"
	"table-order-backend/internal/repository"
	"table-order-backend/internal/service"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	cfg := config.Load()

	// Database connection
	dbURL := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	pool, err := pgxpool.New(context.Background(), dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	// Wait for DB to be ready
	for i := 0; i < 30; i++ {
		if err := pool.Ping(context.Background()); err == nil {
			break
		}
		log.Println("Waiting for database...")
		time.Sleep(time.Second)
	}

	// Initialize components
	eventBroker := broker.NewEventBroker()
	metricsCollector := metrics.NewCollector()
	go metricsCollector.StartBroadcast(eventBroker)

	// Repositories
	adminRepo := repository.NewAdminRepo(pool)
	menuRepo := repository.NewMenuRepo(pool)
	orderRepo := repository.NewOrderRepo(pool)
	tableRepo := repository.NewTableRepo(pool)
	categoryRepo := repository.NewCategoryRepo(pool)

	// Services
	authService := service.NewAuthService(adminRepo, tableRepo, cfg.JWTSecret)
	menuService := service.NewMenuService(menuRepo, categoryRepo)
	orderService := service.NewOrderService(orderRepo, menuRepo, tableRepo, eventBroker, metricsCollector)
	tableService := service.NewTableService(tableRepo, orderRepo, eventBroker)
	categoryService := service.NewCategoryService(categoryRepo)

	// Handlers
	authHandler := handler.NewAuthHandler(authService)
	menuHandler := handler.NewMenuHandler(menuService)
	orderHandler := handler.NewOrderHandler(orderService)
	tableHandler := handler.NewTableHandler(tableService)
	categoryHandler := handler.NewCategoryHandler(categoryService)
	sseHandler := handler.NewSSEHandler(eventBroker, metricsCollector)

	// Router
	gin.SetMode(gin.ReleaseMode)
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:3001"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Public routes
	api := r.Group("/api")
	{
		api.POST("/table/login", authHandler.TableLogin)
		api.POST("/admin/login", authHandler.AdminLogin)
		api.GET("/menus", menuHandler.GetMenus)
		api.GET("/categories", categoryHandler.GetCategories)
	}

	// Customer routes (table token required)
	customer := api.Group("")
	customer.Use(middleware.AuthMiddleware(cfg.JWTSecret, "table"))
	{
		customer.POST("/orders", orderHandler.CreateOrder)
		customer.GET("/orders", orderHandler.GetOrders)
	}

	// Admin routes (admin token required)
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(cfg.JWTSecret, "admin"))
	{
		// Menu management
		admin.POST("/menus", menuHandler.CreateMenu)
		admin.PUT("/menus/:id", menuHandler.UpdateMenu)
		admin.DELETE("/menus/:id", menuHandler.DeleteMenu)
		admin.PUT("/menus/order", menuHandler.UpdateMenuOrder)

		// Category management
		admin.POST("/categories", categoryHandler.CreateCategory)
		admin.PUT("/categories/:id", categoryHandler.UpdateCategory)
		admin.DELETE("/categories/:id", categoryHandler.DeleteCategory)

		// Order management
		admin.PUT("/orders/:id/status", orderHandler.UpdateOrderStatus)
		admin.DELETE("/orders/:id", orderHandler.DeleteOrder)

		// Table management
		admin.GET("/tables", tableHandler.GetTables)
		admin.POST("/tables", tableHandler.CreateTable)
		admin.POST("/tables/:id/complete", tableHandler.CompleteTable)
		admin.GET("/tables/:id/history", tableHandler.GetTableHistory)

		// SSE streams
		admin.GET("/events", sseHandler.OrderEvents)
		admin.GET("/metrics/stream", sseHandler.MetricsStream)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Graceful shutdown
	port := cfg.ServerPort
	log.Printf("Server starting on :%s", port)

	go func() {
		if err := r.Run(":" + port); err != nil {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")
}
