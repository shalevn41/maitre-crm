# 🍽️ MAITRE — Restaurant CRM & Marketing Automation

> ### 🚧 Work in Progress — This project is actively being developed and is not yet final.

MAITRE is a full SaaS platform designed for restaurants and cafes to manage
customer relationships, automate marketing, and build loyalty — all in one place.
The core idea: turn waiters into acquisition agents using QR codes,
and automate everything that follows.

---

## ✨ Features

### 👥 Loyalty Club
- Customers join via QR code at the table
- Points system with automatic tracking
- Rewards and benefits for returning customers
- Birthday and anniversary automations

### 📱 Marketing Automation
- WhatsApp campaign builder with segmentation
- Message templates with personalization
- Scheduled and triggered campaigns
- Campaign performance tracking

### ⭐ Google Reviews Management
- Automated review requests after visits
- Smart timing based on visit data
- Dashboard to monitor review trends

### 📊 CRM & Customer Data
- Full customer history — visits, spend, preferences
- Customer segmentation by behavior
- Real-time activity feed per customer

### 💳 Payments & Monetization
- Credits-based system for customers
- Stripe integration for restaurant subscriptions
- Single pricing tier: ₪499/month per restaurant

### 👨‍💼 God Mode Admin
- Super-admin dashboard across all restaurants
- Real-time monitoring of all activity
- System-wide settings and overrides

### 🍽️ Waiter Incentives
- Waiters earn rewards for bringing new members
- QR code per waiter for tracking attribution
- Leaderboard and monthly goals

---

## 🛠️ Tech Stack

| Tool | Purpose |
|------|---------|
| Base44 | Full-stack no-code builder |
| React + Vite | Frontend framework |
| Tailwind CSS | Styling & UI |
| Supabase | Database & authentication |
| WhatsApp API | Marketing automation |
| Google Reviews API | Review management |
| Stripe | Payment processing |

---

## 🗂️ Project Structure

src/
├── pages/          # All app pages (Dashboard, CRM, Campaigns, etc.)
├── components/     # Reusable UI components
├── utils/          # Helper functions
base44/
├── entities/       # Data models (Customer, Restaurant, Waiter, etc.)
├── functions/      # Backend logic & automations

---

## 🚀 How It Works

1. Restaurant owner signs up → sets up their profile
2. Waiters get personal QR codes → hand them to customers
3. Customers scan QR → join loyalty club in one tap
4. System tracks every visit, purchase, and interaction
5. Manager builds WhatsApp campaigns → sends to segments
6. Google Reviews requests fire automatically after positive visits
7. God Mode admin monitors everything across all restaurants

---

## 💰 Business Model

- ₪499/month flat fee per restaurant
- Waiters as acquisition agents — zero ad spend needed
- Moat: the more waiters use it, the faster it grows
- Upsell potential: premium tiers, analytics add-ons

---

## 🗺️ Roadmap

- [ ] Complete Stripe integration
- [ ] Fix QR signup flow
- [ ] Add advanced campaign analytics
- [ ] Mobile app for waiters
- [ ] Multi-location restaurant support

---

Built by [Noam Shalev](https://github.com/shalevn41) — AI & No-Code Automation Specialist
