cat << 'EOF' > README.md
# Camera Map Video API

Backend-сервис для загрузки и управления видео с привязкой к пользователю и геолокации.

---

## Стек технологий

- FastAPI
- PostgreSQL
- SQLAlchemy (async)
- Alembic (миграции)
- JWT (авторизация)
- Docker / Docker Compose

---

## Функционал

### Авторизация
- Регистрация пользователя
- Логин
- JWT (access + refresh токены)
- Logout
- Получение текущего пользователя (/auth/me)

### Видео
- Загрузка видео (метаданные)
- Получение списка видео пользователя
- Получение видео по ID
- Удаление видео

---

## Запуск проекта

### 1. Клонировать репозиторий
git clone <your-repo-url>
cd camera-map-video

### 2. Создать .env
POSTGRES_DB=app
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/app

JWT_SECRET_KEY=supersecret
JWT_REFRESH_SECRET_KEY=supersecret_refresh
JWT_ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

### 3. Запуск
docker compose up -d --build

### 4. Миграции
docker compose exec app alembic upgrade head

---

## API

http://localhost:8000/docs

---

## Эндпоинты

### Auth
POST /auth/register  
POST /auth/login  
POST /auth/refresh  
POST /auth/logout  
GET /auth/me  

### Videos
POST /videos/  
GET /videos/  
GET /videos/{video_id}  
DELETE /videos/{video_id}  

---

## Примечания

- Используется JWT авторизация
- Все защищённые эндпоинты требуют Bearer token
- Видео сохраняются как метаданные
- Пользователь видит только свои видео

---

## Статус

Проект реализует базовый функционал авторизации и работы с видео.  
Готов к демонстрации.
EOF