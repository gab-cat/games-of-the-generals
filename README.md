# 🎯 Games of the Generals

[![License](https://img.shields.io/badge/License-Custom-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19+-61dafb.svg)](https://reactjs.org/)
[![Convex](https://img.shields.io/badge/Convex-1.28+-black.svg)](https://convex.dev)
[![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)](https://web.dev/progressive-web-apps/)

> **A classic Filipino strategy board game brought to life online** - Battle of wits in real-time multiplayer matches against players worldwide or challenge AI opponents!

![Games of the Generals Gameplay](screenshots/wide-1200x630.png)

## 🎮 What is Games of the Generals?

Games of the Generals (also known as Salpakan) is a classic Filipino strategy board game similar to chess but with unique mechanics and pieces. Players command an army of 21 pieces including spies, privates, generals, and a flag that must be captured to win.

The game combines strategic planning, bluffing, and tactical combat in a battle of minds where every move counts!

### 🏆 Key Features

- **Real-time Multiplayer**: Play against players worldwide with live game updates
- **AI Opponents**: Challenge computer opponents with varying difficulty levels
- **Spectator Mode**: Watch live games and learn from experienced players
- **Tournaments**: Compete in organized tournaments and climb the leaderboards
- **Progressive Web App**: Install on your device for offline access
- **Cross-platform**: Play on desktop, tablet, or mobile browsers
- **Achievements**: Unlock achievements and track your progress
- **Global Chat**: Connect with the community in real-time chat
- **Match History**: Review your games and analyze your strategies
- **User Profiles**: Customize your avatar and track your statistics

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** (or **bun** for faster installs)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/games-of-generals.git
   cd games-of-generals
   ```

2. **Install dependencies**

   ```bash
   # Using npm
   npm install

   # Or using bun (recommended for faster installs)
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**

   ```bash
   # Using npm
   npm run dev

   # Or using bun
   bun run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to start playing!

## 🎯 How to Play

### Objective

Be the first to capture your opponent's flag or eliminate all their movable pieces!

### Game Pieces & Hierarchy

From highest to lowest rank:

- **5★ General** (1) - Supreme Commander
- **4★ General** (1) - Field Commander
- **3★ General** (1) - Division Commander
- **Colonel** (1) - Regiment Commander
- **Lieutenant Colonel** (1) - Battalion Commander
- **Major** (1) - Company Commander
- **Captain** (1) - Platoon Leader
- **1st Lieutenant** (1) - Squad Leader
- **2nd Lieutenant** (1) - Assistant Squad Leader
- **Sergeant** (1) - Squad Sergeant
- **Private** (6) - Basic Infantry
- **Spy** (2) - Special Forces (can eliminate any piece except privates)
- **Flag** (1) - Your objective!

### Basic Rules

1. **Setup Phase**: Arrange your 21 pieces on the first 3 rows of your side
2. **Movement**: Pieces move one square orthogonally (up, down, left, right)
3. **Combat**: Higher-ranked pieces eliminate lower-ranked pieces
4. **Special Rules**:
   - Spies can eliminate any piece but are eliminated by privates
   - Pieces of equal rank both get eliminated
   - The flag cannot move and loses to any piece that attacks it
   - Reaching the opponent's back rank with any piece also wins!

### Game Modes

- **Ranked Multiplayer**: Compete against players of similar skill
- **Casual Multiplayer**: Play for fun with no ranking impact
- **AI Training**: Practice against computer opponents
- **Private Lobbies**: Play with friends using lobby codes
- **Spectator Mode**: Watch and learn from live games

## 🏗️ Project Structure

```
games-of-generals/
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Route-based page components
│   ├── lib/               # Utilities and helpers
│   └── routes/            # TanStack Router configuration
├── convex/                # Backend functions and database
│   ├── _generated/        # Auto-generated Convex types
│   ├── auth.ts           # Authentication configuration
│   ├── schema.ts         # Database schema definition
│   └── *.ts              # Backend functions
├── public/                # Static assets
├── scripts/               # Build and utility scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── vite.config.ts         # Vite build configuration
└── package.json          # Dependencies and scripts
```

## 🛠️ Technology Stack

### Frontend

- **React 19** - Modern React with concurrent features
- **TypeScript** - Type-safe JavaScript
- **TanStack Router** - Powerful routing solution
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern component library
- **Framer Motion** - Smooth animations
- **Lucide Icons** - Beautiful icon set

### Backend

- **Convex** - Real-time backend-as-a-service
- **TypeScript** - Full-stack type safety
- **Real-time subscriptions** - Live game updates
- **File storage** - Avatar and asset management

### Development Tools

- **Vite** - Fast build tool and dev server
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Progressive Web App** - Offline-capable web app

## 📱 Progressive Web App

This game is a fully functional PWA that can be installed on your device:

1. Open the game in your browser
2. Click "Install" when prompted, or use the menu option
3. Play offline with the same features!

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run dev:backend      # Start only backend
npm run preview          # Preview production build

# Building
npm run build           # Production build
npm run build:analyze   # Build with bundle analysis

# Quality Assurance
npm run lint            # Run ESLint and TypeScript checks
npm run icons           # Generate PWA icons
npm run sitemap         # Generate sitemap
```

### Code Quality

The project uses strict code quality standards:

- **ESLint** for code linting
- **TypeScript** for type checking
- **Prettier** for code formatting
- Automated testing and validation

### Contributing

We welcome contributions! See our [Contributing Guide](CONTRIBUTING.md) for details.

## 🎨 UI/UX Design

The game features a modern, intuitive interface designed for both desktop and mobile:

- **Dark/Light Mode**: Automatic theme switching
- **Responsive Design**: Optimized for all screen sizes
- **Accessibility**: WCAG 2.1 AA compliant
- **Smooth Animations**: 60fps animations with Framer Motion
- **Intuitive Controls**: Touch-friendly mobile controls

## 🔒 Security & Privacy

- **End-to-end encryption** for all communications
- **Secure authentication** with Convex Auth
- **Data privacy** compliant with modern standards
- **Regular security audits** and updates

## 🌍 Community

Join our growing community of strategy enthusiasts:

- **Global Chat**: Connect with players worldwide
- **Tournaments**: Regular competitive events
- **Leaderboards**: Track your ranking
- **Spectator Mode**: Learn from watching games
- **Discord Community**: Join discussions and find opponents

## 📈 Roadmap

### Planned Features

- [ ] Tournament brackets and prize pools
- [ ] Advanced AI with multiple difficulty levels
- [ ] Mobile native apps (iOS/Android)
- [ ] Voice chat during games
- [ ] Custom game pieces and themes
- [ ] Historical game analysis
- [ ] Coaching and mentorship system

### Recent Updates

- Real-time multiplayer with presence indicators
- Comprehensive achievement system
- Enhanced spectator experience
- Improved mobile responsiveness
- Advanced game statistics and analytics

## 🤝 Contributing

We believe in the power of community-driven development. Whether you're fixing bugs, adding features, improving documentation, or helping with translations, your contributions are welcome!

### Ways to Contribute

- **Code**: Submit pull requests for bug fixes or new features
- **Design**: Help improve UI/UX or create new themes
- **Testing**: Report bugs or help test new features
- **Documentation**: Improve docs or create tutorials
- **Translation**: Help localize the game
- **Community**: Help moderate chat or organize tournaments

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under a custom license that allows personal and educational use, as well as contributions to the open-source project. Commercial use requires explicit permission from the project maintainer.

See [LICENSE](LICENSE) for full terms and conditions.

## 🙏 Acknowledgments

- **Filipino Game Heritage**: Honoring the rich tradition of Filipino strategy games
- **Open Source Community**: Built with amazing open-source tools and libraries
- **Beta Testers**: Early players who helped shape the game experience
- **Contributors**: Everyone who has contributed code, ideas, and feedback

## 📞 Support

Need help or have questions?

- **In-Game Support**: Use the support ticket system
- **Documentation**: Check our [Wiki](https://github.com/yourusername/games-of-generals/wiki)
- **Discussions**: Join [GitHub Discussions](https://github.com/yourusername/games-of-generals/discussions)
- **Issues**: Report bugs on [GitHub Issues](https://github.com/yourusername/games-of-generals/issues)

## 🔗 Links

- **Website**: [https://generalsonline.app](https://generalsonline.app)
- **Live Demo**: [Play Now](https://generalsonline.app)
- **Documentation**: [Wiki](https://github.com/yourusername/games-of-generals/wiki)
- **Discord**: [Join Community](https://discord.gg/generalsonline)

---

**Ready to battle?** 🏁 [Start Playing Now!](https://generalsonline.app)

_Games of the Generals is a modern digital adaptation of the classic Filipino board game, bringing strategic gameplay to players worldwide._

## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.

- If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
- Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
- Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.
