# 📚 Book Quest 2.0 — Registration & Management Bot

### Intelligent Reading Challenge Automation

**Book Quest 2.0** is an intellectual project that promotes reading and reflection.  
Participants read a selected book and later test their understanding through a special quiz.  
This Telegram bot fully automates **registration**, **user management**, and **admin control** for the event.

---

## 🚀 Key Features

### 👤 For Participants
- Register via `/start` command  
- Unique identification by full name and Telegram ID  
- Prevents duplicate or spam registrations  
- Displays project rules and terms after registration  
- Smooth access to next stages (quiz, results, announcements)

### 🧠 For Admins
- View and manage registered users  
- Broadcast messages to all participants  
- Manually or automatically close registration  
- Monitor activity and participation stats  
- Secure Supabase database integration

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Bot Framework** | [Telegraf.js](https://telegraf.js.org) |
| **Runtime** | Node.js (ESM) |
| **Database** | [Supabase](https://supabase.com) |
| **Optional Hosting** | Render / Railway / Vercel (Node runtime) |

---

## ⚙️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/book-quest-bot.git
cd book-quest-bot
