package seed

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func Run(pool *pgxpool.Pool) {
	ctx := context.Background()

	// Seed admin (password: admin123)
	adminHash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	_, err := pool.Exec(ctx,
		"INSERT INTO admins (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING",
		"admin", string(adminHash))
	if err != nil {
		log.Printf("Seed admin error: %v", err)
	}

	// Seed tables 1-5 (password: 1234)
	tableHash, _ := bcrypt.GenerateFromPassword([]byte("1234"), bcrypt.DefaultCost)
	for i := 1; i <= 5; i++ {
		_, err := pool.Exec(ctx,
			"INSERT INTO table_info (table_number, password_hash) VALUES ($1, $2) ON CONFLICT (table_number) DO NOTHING",
			i, string(tableHash))
		if err != nil {
			log.Printf("Seed table %d error: %v", i, err)
		}
	}

	// Seed categories
	categories := []struct {
		Name  string
		Order int
	}{
		{"메인 메뉴", 1},
		{"사이드", 2},
		{"음료", 3},
		{"디저트", 4},
	}
	for _, cat := range categories {
		pool.Exec(ctx,
			"INSERT INTO categories (name, display_order) VALUES ($1, $2) ON CONFLICT DO NOTHING",
			cat.Name, cat.Order)
	}

	// Seed menus
	menus := []struct {
		CatID       int
		Name        string
		Price       int
		Description string
		ImageURL    string
		Order       int
	}{
		{1, "불고기 정식", 15000, "부드러운 소고기 불고기와 밥, 반찬 세트", "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400", 1},
		{1, "김치찌개", 12000, "돼지고기와 묵은지로 끓인 깊은 맛의 김치찌개", "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400", 2},
		{1, "비빔밥", 13000, "신선한 야채와 고추장으로 비벼먹는 비빔밥", "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400", 3},
		{1, "돈까스", 14000, "바삭한 수제 돈까스와 특제 소스", "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400", 4},
		{2, "계란말이", 8000, "부드럽고 촉촉한 계란말이", "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400", 1},
		{2, "감자튀김", 6000, "바삭한 감자튀김과 케첩", "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400", 2},
		{2, "떡볶이", 7000, "매콤달콤한 떡볶이", "https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=400", 3},
		{3, "콜라", 3000, "시원한 코카콜라 500ml", "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400", 1},
		{3, "사이다", 3000, "청량한 칠성사이다 500ml", "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400", 2},
		{3, "맥주", 5000, "시원한 생맥주 500ml", "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400", 3},
		{4, "아이스크림", 4000, "바닐라 아이스크림 2스쿱", "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400", 1},
		{4, "케이크", 6000, "오늘의 수제 케이크 한 조각", "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400", 2},
	}
	for _, m := range menus {
		pool.Exec(ctx,
			`INSERT INTO menus (category_id, name, price, description, image_url, display_order)
			 VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
			m.CatID, m.Name, m.Price, m.Description, m.ImageURL, m.Order)
	}

	log.Println("Seed data initialized")
}
