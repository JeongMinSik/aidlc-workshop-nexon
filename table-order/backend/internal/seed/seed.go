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

	// Check if categories already exist — skip seeding if data is present
	var catCount int
	err = pool.QueryRow(ctx, "SELECT COUNT(*) FROM categories").Scan(&catCount)
	if err != nil {
		log.Printf("Seed category check error: %v", err)
		return
	}
	if catCount > 0 {
		log.Println("Seed data already exists, skipping menu/category seed")
		return
	}

	// Seed categories
	type catEntry struct {
		Name  string
		Order int
	}
	categories := []catEntry{
		{"인기 메뉴", 1},
		{"식사", 2},
		{"안주/사이드", 3},
		{"음료", 4},
	}

	catIDs := make(map[int]int) // index -> DB id
	for i, cat := range categories {
		var id int
		err := pool.QueryRow(ctx,
			"INSERT INTO categories (name, display_order) VALUES ($1, $2) RETURNING id",
			cat.Name, cat.Order).Scan(&id)
		if err != nil {
			log.Printf("Seed category '%s' error: %v", cat.Name, err)
			continue
		}
		catIDs[i] = id
	}

	// Seed menus with verified image URLs
	type menuEntry struct {
		CatIdx      int
		Name        string
		Price       int
		Description string
		ImageURL    string
		Order       int
	}
	menus := []menuEntry{
		// 인기 메뉴 (catIdx 0)
		{0, "숯불 삼겹살", 16000, "두툼한 국내산 삼겹살을 참숯에 구워 드립니다", "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop", 1},
		{0, "양념 치킨", 18000, "바삭한 후라이드에 달콤 매콤 양념 소스", "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400&h=400&fit=crop", 2},
		{0, "해물 라면", 9000, "싱싱한 해물이 듬뿍 들어간 얼큰 라면", "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop", 3},
		{0, "김치 볶음밥", 10000, "고소한 참기름과 계란 프라이를 올린 볶음밥", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=400&fit=crop", 4},
		{0, "불고기", 15000, "달콤한 간장 양념에 재운 소불고기", "https://images.unsplash.com/photo-1583187855209-de1e02854a08?w=400&h=400&fit=crop", 5},
		{0, "돈까스", 12000, "두툼한 등심을 바삭하게 튀긴 수제 돈까스", "https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=400&h=400&fit=crop", 6},
		{0, "찜닭", 22000, "매콤달콤 간장 양념의 안동 찜닭", "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&h=400&fit=crop", 7},
		{0, "갈비탕", 13000, "푹 고은 소갈비의 진한 국물", "https://images.unsplash.com/photo-1583224994076-0a3a3b8efa25?w=400&h=400&fit=crop", 8},

		// 식사 (catIdx 1)
		{1, "된장찌개 정식", 11000, "구수한 된장찌개와 밥, 반찬 세트", "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=400&h=400&fit=crop", 1},
		{1, "비빔밥", 12000, "신선한 나물과 고추장의 조화", "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&h=400&fit=crop", 2},
		{1, "제육덮밥", 11000, "매콤한 제육볶음을 밥 위에 듬뿍", "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&h=400&fit=crop", 3},
		{1, "우동", 9000, "진한 가쓰오부시 육수의 따뜻한 우동", "https://images.unsplash.com/photo-1618841557871-b4664fbf0cb3?w=400&h=400&fit=crop", 4},
		{1, "카레라이스", 9000, "진한 일본식 카레와 따뜻한 밥", "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&h=400&fit=crop", 5},
		{1, "참치김밥", 7000, "고소한 참치마요가 들어간 김밥", "https://images.unsplash.com/photo-1553163147-622ab57be1c7?w=400&h=400&fit=crop", 6},

		// 안주/사이드 (catIdx 2)
		{2, "감자튀김", 7000, "바삭한 감자튀김과 치즈 소스", "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop", 1},
		{2, "떡볶이", 8000, "쫄깃한 떡과 매콤한 고추장 소스", "https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=400&h=400&fit=crop", 2},
		{2, "군만두", 7000, "노릇하게 구운 고기만두 6개", "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=400&fit=crop", 3},
		{2, "치즈볼", 6000, "겉바속촉 모짜렐라 치즈볼 6개", "https://images.unsplash.com/photo-1452195100486-9cc805987862?w=400&h=400&fit=crop", 4},
		{2, "나초 플레이트", 8000, "바삭한 나초와 살사, 치즈 소스", "https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=400&fit=crop", 5},
		{2, "에다마메", 5000, "소금에 살짝 데친 풋콩", "https://images.unsplash.com/photo-1564894809611-1742fc40ed80?w=400&h=400&fit=crop", 6},
		{2, "오징어튀김", 8000, "바삭하게 튀긴 오징어링", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=400&fit=crop", 7},

		// 음료 (catIdx 3)
		{3, "생맥주 500ml", 5000, "시원하게 뽑은 생맥주 한 잔", "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=400&fit=crop", 1},
		{3, "소주", 5000, "참이슬 오리지널 360ml", "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=400&fit=crop", 2},
		{3, "콜라", 3000, "코카콜라 500ml", "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop", 3},
		{3, "아이스 아메리카노", 4500, "진한 에스프레소의 아이스 아메리카노", "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=400&fit=crop", 4},
		{3, "레몬에이드", 5500, "상큼한 레몬과 탄산수의 시원한 조합", "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=400&fit=crop", 5},
		{3, "하이볼", 7000, "위스키와 탄산수의 청량한 칵테일", "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=400&fit=crop", 6},
		{3, "녹차", 3500, "은은한 향의 따뜻한 녹차", "https://images.unsplash.com/photo-1556881286-fc6915169721?w=400&h=400&fit=crop", 7},
		{3, "망고 스무디", 6000, "신선한 망고로 만든 달콤한 스무디", "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=400&fit=crop", 8},
	}

	for _, m := range menus {
		catID, ok := catIDs[m.CatIdx]
		if !ok {
			continue
		}
		_, err := pool.Exec(ctx,
			`INSERT INTO menus (category_id, name, price, description, image_url, display_order)
			 VALUES ($1, $2, $3, $4, $5, $6)`,
			catID, m.Name, m.Price, m.Description, m.ImageURL, m.Order)
		if err != nil {
			log.Printf("Seed menu '%s' error: %v", m.Name, err)
		}
	}

	log.Println("Seed data initialized")
}
