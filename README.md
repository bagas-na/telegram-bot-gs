# Sales Funnel Telegram Bot

A Telegram bot designed to help the marketing department keep track of the sales funnel for various accounts. This bot simplifies administrative tasks and ensures that the team can efficiently monitor and update the status of sales activities.

## Features

- **Sales Funnel Tracking:** Keeps track of the current state of various sales accounts.
- **Cloudflare Workers:** Runs on Cloudflare Workers, ensuring a lightweight and highly available deployment.
- **Cloudflare D1 Database:** Utilizes Cloudflare's D1 database for storage.
- **No Dependencies:** The bot is built without any dependencies, focusing on simplicity and performance.
- **TypeScript:** Written in TypeScript for a robust and maintainable codebase.

## Tech Stack

- **TypeScript**
- **Cloudflare Workers**
- **Cloudflare D1 Database**

## DevDependencies

- `@cloudflare/vitest-pool-workers`
- `@cloudflare/workers-types`
- `typescript`
- `vitest`
- `wrangler`

## How to Use This Repository

### Prerequisites

- Node.js installed on your machine.
- Cloudflare account with Workers and D1 database access.
- A Telegram bot token (you can create a bot using the [BotFather](https://core.telegram.org/bots#botfather)). Refer to this part of the [Guide](https://core.telegram.org/bots/tutorial#obtain-your-bot-token)

### Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourusername/sales-funnel-telegram-bot.git
   cd sales-funnel-telegram-bot
   ```
2. Install Wrangler: If you haven't already, install the Cloudflare Wrangler CLI: 
    ```bash
    npm install -g wrangler
    ```
3. Configure the Environment:
  - Add your Telegram bot token to the secret variable BOT_TOKEN on Cloudflare's dashboard:
   ```bash
   wrangler secret put BOT_TOKEN
   ```
  - Set up your Cloudflare Worker with D1 database access, following the Cloudflare documentation.
4. Install DevDependenceies
   ```bash
   npm install
   ```
5. Run the Bot Locally: Use Wrangler to run the bot locally for testing:
  ```bash
     npm run start
  ```
6. Deploy to Cloudflare Workers: Deploy your bot to Cloudflare Workers:
  ```bash
    npm run deploy
  ```

## Usage
Once deployed, the bot will listen to messages on Telegram and assist in managing the sales funnel. The bot's commands and responses are designed to help keep the sales team updated on the status of various accounts.

License
This project is licensed under the MIT License. See the LICENSE file for details.
