# SPmwork

[![Next.js](https://img.shields.io/badge/Next.js-13-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

Professional freelance platform for the Minecraft community. Secure transactions, verified contractors, and a seamless ordering process.

[Русская версия](README.md)

## 🚀 Features

### For Clients

- 🔒 Secure transactions through SPWorlds escrow system
- 👥 Verified contractors with ratings and reviews
- 💬 Built-in chat for project discussions
- 📋 Easy order creation with descriptions and references
- ⭐ Rating and review system

### For Contractors

- 💼 Access to real client orders
- 📊 Transparent bidding and offer system
- 💰 Guaranteed payment through escrow
- 📈 Profile and portfolio development
- 🏆 Rating system for reputation growth

## 🛠 Tech Stack

### Frontend

- **Framework:** Next.js 13 with App Router
- **Styling:** Tailwind CSS
- **State Management:** React Context + SWR
- **Forms:** React Hook Form
- **UI Components:** Custom UI library

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

## 📦 Installation and Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/spmwork.git
   cd spmwork
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in the following variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   DISCORD_CLIENT_ID=your_discord_client_id
   DISCORD_CLIENT_SECRET=your_discord_client_secret
   SPWORLDS_API_KEY=your_spworlds_api_key
   ```

4. **Start the project**
   ```bash
   npm run dev
   ```

## 🔄 Workflow Process

1. **Order Creation**

   - Client creates an order with description and budget
   - Specifies requirements and attaches references

2. **Receiving Offers**

   - Contractors submit their proposals
   - Specify cost and completion timeframes

3. **Contractor Selection**

   - Client selects the suitable offer
   - Funds are reserved in escrow

4. **Order Execution**

   - Contractor works on the order
   - Communication through built-in chat

5. **Deal Completion**
   - Client accepts the work
   - Funds are transferred to the contractor
   - Option to leave a review

## 👥 Team

- **Frontend Developer:** [@slidrusforeal](https://github.com/slidrusforeal)
- **Backend Developer:** [@slidrusforeal](https://github.com/slidrusforeal)
- **UI/UX Designer:** [@slidrusforeal](https://github.com/slidrusforeal)

## 📄 License

This project is licensed under the [MIT License](LICENSE)

## 🤝 Contributing

We welcome contributions to the project! Please check out our [contribution guidelines](CONTRIBUTING.md).

## 📞 Support

If you have any questions or issues:

- 🌐 Website: https://spmwork.vercel.app
