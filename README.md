# SPmwork

[![Next.js](https://img.shields.io/badge/Next.js-13-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

Профессиональная фриланс-платформа для Minecraft-сообщества. Безопасные сделки, проверенные исполнители и удобный процесс заказа.

[English version](README.en.md)

## 🚀 Возможности

### Для заказчиков

- 🔒 Безопасные сделки через эскроу-систему SPWorlds
- 👥 Проверенные исполнители с рейтингом и отзывами
- 💬 Встроенный чат для обсуждения деталей
- 📋 Удобное создание заказов с описанием и референсами
- ⭐ Система рейтинга и отзывов

### Для исполнителей

- 💼 Доступ к заказам от реальных клиентов
- 📊 Прозрачная система ставок и офферов
- 💰 Гарантированная оплата через эскроу
- 📈 Развитие профиля и портфолио
- 🏆 Рейтинговая система для роста репутации

## 🛠 Технологический стек

### Frontend

- **Framework:** Next.js 13 с App Router
- **Styling:** Tailwind CSS
- **State Management:** React Context + SWR
- **Forms:** React Hook Form
- **UI Components:** Собственная UI библиотека

### Backend

- **Database:** Supabase (PostgreSQL)
- **Authentication:** Discord OAuth
- **Real-time:** Supabase Realtime
- **Storage:** Supabase Storage
- **Payments:** SPWorlds API

### DevOps

- **Hosting:** Vercel
- **CI/CD:** GitHub Actions
- **Monitoring:** Vercel Analytics
- **Type Safety:** TypeScript

## 📦 Установка и запуск

1. **Клонирование репозитория**

   ```bash
   git clone https://github.com/slidrusforeal/spmwork.git
   cd spmwork
   ```

2. **Установка зависимостей**

   ```bash
   npm install
   ```

3. **Настройка переменных окружения**

   ```bash
   cp .env.example .env.local
   ```

   Заполните следующие переменные:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   SPWORLDS_API_KEY=your_spworlds_api_key
   ```

4. **Запуск проекта**
   ```bash
   npm run dev
   ```

## 🔄 Процесс работы

1. **Создание заказа**

   - Заказчик создаёт заказ с описанием и бюджетом
   - Указывает требования и прикрепляет референсы

2. **Получение офферов**

   - Исполнители отправляют свои предложения
   - Указывают стоимость и сроки выполнения

3. **Выбор исполнителя**

   - Заказчик выбирает подходящий оффер
   - Происходит резервирование средств

4. **Выполнение заказа**

   - Исполнитель работает над заказом
   - Общение через встроенный чат

5. **Завершение сделки**
   - Заказчик принимает работу
   - Средства переводятся исполнителю
   - Возможность оставить отзыв

## 👥 Команда

- **Frontend Developer:** [@slidrusforeal](https://github.com/slidrusforeal)
- **Backend Developer:** [@slidrusforeal](https://github.com/slidrusforeal)
- **UI/UX Designer:** [@slidrusforeal](https://github.com/slidrusforeal)

## 📄 Лицензия

Этот проект лицензирован под [MIT License](LICENSE)

## 🤝 Вклад в проект

Мы приветствуем вклад в развитие проекта! Пожалуйста, ознакомьтесь с [руководством по внесению изменений](CONTRIBUTING.md).

## 📞 Поддержка

Если у вас возникли вопросы или проблемы:

- 🌐 Сайт: https://spmwork.vercel.app
