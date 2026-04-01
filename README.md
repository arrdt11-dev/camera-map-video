# КАРТА С КАМЕРАМИ И ВИДЕО

Backend-сервис для отображения камер на карте, загрузки видео и привязки их к локациям.

---

## Стек технологий

- FastAPI
- PostgreSQL
- SQLAlchemy (async)
- Alembic
- Redis
- MinIO (S3)
- JWT (access + refresh)
- Docker / Docker Compose

---

## Функционал

### Авторизация
- Регистрация пользователя
- Логин
- JWT (access + refresh токены)
- Получение текущего пользователя (/auth/me)

### Видео
- Создание записи о видео
- Загрузка видео файла
- Получение списка видео
- Привязка видео к камере

### Камеры
- Хранение камер в базе данных
- Подготовка данных для карты (GeoJSON)
- Определение наличия видео у камеры (has_video)

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
REDIS_URL=redis://redis:6379/0  

MINIO_ENDPOINT=minio:9000  
MINIO_ACCESS_KEY=minioadmin  
MINIO_SECRET_KEY=minioadmin  
MINIO_BUCKET_VIDEOS=videos  
MINIO_BUCKET_PREVIEWS=previews  

JWT_SECRET_KEY=supersecret  
JWT_REFRESH_SECRET_KEY=supersecret_refresh  
JWT_ALGORITHM=HS256  

ACCESS_TOKEN_EXPIRE_MINUTES=30  
REFRESH_TOKEN_EXPIRE_DAYS=7  

---

### 3. Запуск

docker compose up -d --build

### 4. Миграции

docker compose exec api alembic upgrade head

---

## API

http://localhost:8000/docs

---

## Основные эндпоинты

### Auth
POST /auth/register  
POST /auth/login  
GET /auth/me  

### Videos
POST /videos/  
GET /videos/  
POST /videos/upload  

### Cameras
GET /cameras/  
GET /cameras/map  

---

## Важно

- Authorization: Bearer <token>
- Видео привязываются к камерам
- Камеры отображаются на карте

---

## Статус

Реализовано:
- авторизация
- пользователи
- видео
- docker окружение

В работе:
- GeoJSON
- Redis
- preview
- очередь обработки