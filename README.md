# Space Freighter Sim

A single-player in-browser space freighter simulation game built with Vue 3, TypeScript, and Canvas. Navigate your freighter through the Kestrel Reach star system, dock at stations, and manage your ship's systems.

## 🎮 Game Overview

You are the pilot of a space freighter navigating through a science fiction universe. The game features:

- **System Navigation**: Plot courses through star systems, manage heading and speed
- **Station Docking**: Dock and undock at various stations (trading hubs, mining outposts, fuel depots)
- **Sensor Management**: Track contacts, monitor your surroundings
- **Ship Systems**: Manage your freighter's systems and status

### Inspirations

- **UI Design**: Artemis Starship Simulator, Star Trek LCARS
- **Gameplay**: Freelancer, Privateer
- **Setting**: Star Trek, Battlestar Galactica

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm test` | Run unit tests in watch mode |
| `npm run test:run` | Run unit tests once |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:coverage` | Run tests with coverage |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Open Playwright UI |

## 📚 Documentation

- [Architecture Overview](ARCHITECTURE.md) - System design and technical decisions
- [Style Guide](STYLE_GUIDE.md) - Code conventions and UI design patterns
- [Architecture Decision Records](docs/adr/) - Key technical decisions

## 🛠️ Tech Stack

- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript
- **State Management**: Pinia
- **Build Tool**: Vite
- **Styling**: SCSS with LCARS-inspired design system
- **Rendering**: HTML5 Canvas for system map
- **Testing**: Vitest (unit), Playwright (E2E)

## 📁 Project Structure

```
src/
├── assets/styles/     # SCSS variables and global styles
├── components/        # Vue components
│   ├── map/          # System map canvas components
│   ├── panels/       # Control panel components
│   └── ui/           # Reusable LCARS UI components
├── core/             # Core game systems
│   ├── game-loop/    # Game tick and timing
│   └── physics/      # Movement and collision
├── data/             # Static game data
│   └── systems/      # Star system definitions
├── models/           # TypeScript interfaces and types
├── stores/           # Pinia state stores
├── test/             # Test utilities and setup
└── views/            # Page-level components
```

## 🎨 Design System

The UI uses an LCARS-inspired design with the following color palette:

- **Purple** (`#9966FF`) - Primary accent, headers
- **Gold** (`#FFCC00`) - Secondary accent, active states
- **White** (`#FFFFFF`) - Text, data displays
- **Black** (`#000000`) - Backgrounds

## 📄 License

This project is for educational and personal use.
