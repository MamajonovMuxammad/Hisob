# Hisob.AI — ИИ-Бухгалтер для Узбекистана

Полноценный веб-сервис: **React + Vite** фронтенд, **Supabase** база данных, **Vercel** деплой.

---

## 🚀 Быстрый старт (локально)

### 1. Установить зависимости
```bash
npm install
```

### 2. Настроить переменные окружения
Отредактируй файл `.env.local`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
GEMINI_API_KEY=AIza...
```

### 3. Создать таблицы в Supabase
1. Откройте [supabase.com/dashboard](https://supabase.com/dashboard)
2. Перейдите: **SQL Editor** → **New Query**
3. Скопируйте и выполните содержимое файла `supabase_schema.sql`

### 4. Запустить проект
```bash
npm run dev
```
Откроется на http://localhost:5173

---

## 🗄️ Структура проекта

```
Hisob/
├── api/
│   └── gemini.js              ← Vercel serverless function (Gemini API proxy)
├── src/
│   ├── lib/
│   │   └── supabase.js        ← Supabase client
│   ├── components/
│   │   ├── Layout.jsx         ← Основной лейаут (sidebar + topbar)
│   │   └── Sidebar.jsx        ← Боковая навигация
│   ├── pages/
│   │   ├── ChatPage.jsx       ← 💬 ИИ-Бухгалтер (чат)
│   │   ├── DocumentsPage.jsx  ← 🧾 Документы
│   │   ├── IncomePage.jsx     ← 💰 Доходы и расходы
│   │   ├── TaxPage.jsx        ← 📊 Налоги
│   │   ├── EmployeesPage.jsx  ← 👥 Сотрудники
│   │   ├── CalendarPage.jsx   ← 📅 Календарь
│   │   └── SettingsPage.jsx   ← ⚙️ Настройки
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase_schema.sql        ← SQL для создания таблиц
├── vercel.json                ← Конфиг деплоя
├── .env.local                 ← Локальные env переменные (не в git)
└── .env.example               ← Шаблон env переменных
```

---

## 🌐 Деплой на Vercel

### Вариант A — через GitHub (рекомендуется)

1. Создай репозиторий на GitHub и запушь проект:
```bash
git init
git add .
git commit -m "init: hisob.ai"
git remote add origin https://github.com/ВАШ_ЛОГИН/hisob-ai.git
git push -u origin main
```

2. Открой [vercel.com/new](https://vercel.com/new)
3. Импортируй репозиторий
4. В разделе **Environment Variables** добавь:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
5. Нажми **Deploy** 🎉

### Вариант B — через Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 🗂️ База данных (Supabase)

| Таблица        | Назначение                    |
|----------------|-------------------------------|
| `documents`    | Все созданные документы       |
| `transactions` | Доходы и расходы              |
| `employees`    | Сотрудники                    |

---

## 🔑 Где получить ключи

| Сервис   | Ссылка                                         |
|----------|------------------------------------------------|
| Supabase | https://supabase.com/dashboard → Settings → API |
| Gemini   | https://aistudio.google.com/app/apikey          |
| Vercel   | https://vercel.com                              |

---

## 📋 Функциональность MVP

- [x] 💬 ИИ-Бухгалтер (чат с Gemini, Gemini ключ на сервере)
- [x] 🧾 Документы (счёт-фактура, акт, накладная, договор, расчётный лист) + Supabase
- [x] 💰 Доходы и расходы + Supabase + bar chart
- [x] 📊 Налоговые калькуляторы (УСН/ОСН + зарплата)
- [x] 👥 Сотрудники + расчётный лист через ИИ + Supabase
- [x] 📅 Календарь отчётности с дедлайнами
- [x] ⚙️ Настройки компании (localStorage)
- [ ] 🔐 Авторизация (добавим позже)
