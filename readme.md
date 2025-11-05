<p align="center">
  <img src="https://raw.githubusercontent.com/pkafr0911/ultimate-tool-web/main/public/banner.png" alt="Ultimate Tools & Utilities Banner" width="100%">
</p>

# 🧰 Ultimate Tools & Utilities

> A modern, all-in-one web platform that gathers **developer tools**, **playgrounds**, and **everyday utilities** — all beautifully designed and accessible from one place.

---

## 🌐 Live Demo

🔗 **[Visit Ultimate Tools & Utilities](https://pkafr0911.github.io/ultimate-tool-web/)**

![Preview Screenshot](https://user-images.githubusercontent.com/0000000/preview.png)

---

## ✨ Overview

**Ultimate Tools & Utilities** is your digital Swiss Army knife for web developers, designers, and creators.  
It centralizes commonly used tools — from converters and formatters to editors and playgrounds — with a sleek, fast, and mobile-friendly interface.

---

## 🚀 Features

### 🧪 Playground
Experiment, code, and create directly in your browser — no setup required.

### 🛠 Utility Tools
Quick conversions, encryption, randomization, and much more.

### 🖼 Image Converter
Convert, preview, and transform your images in seconds.

### 📝 Editors
Format JSON, edit Markdown READMEs, or tweak HTML instantly.

### 🎲 Randomizer
Spin the wheel, generate random numbers, or pick names for fun experiments.

### 🎮 Games
Take a break with built-in classics — Chess, Sudoku, Tic-Tac-Toe, Minesweeper, and more.

### 📚 Docs & Commands
Quick access to useful command references, emojis, and kaomoji sets.

---

## 🧩 Tech Stack

| Category | Technology |
|-----------|-------------|
| Framework | [UmiJS](https://umijs.org/) + [React 18](https://reactjs.org/) |
| UI Library | [Ant Design v5](https://ant.design/) + [Framer Motion](https://www.framer.com/motion/) |
| Styling | LESS + CSS Animations |
| Charts | [Highcharts](https://www.highcharts.com/) |
| Code Editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| Utilities | `dayjs`, `query-string`, `jszip`, `uuid`, `prettier` |
| Build Tools | `@umijs/max`, `cross-env`, `gh-pages` |

---

## 🏗️ Project Structure

src/
├── components/        # Shared UI components
├── constants/         # Page and tool definitions
├── hooks/             # Custom React hooks
├── pages/             # Main pages (Playground, Utilities, etc.)
├── styles/            # Global and page-specific styles
└── utils/             # Helper functions

````

---

## ⚙️ Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/pkafr0911/ultimate-tool-web.git
cd ultimate-tool-web
````

### 2️⃣ Install Dependencies

#### Using npm

```bash
npm install
```

#### Using yarn

```bash
yarn install
```

---

## 🧪 Development

### Run Development Server

#### npm

```bash
npm run dev
```

#### yarn

```bash
yarn dev
```

Visit 👉 **[http://localhost:8000](http://localhost:8000)**

---

## 🏗 Build for Production

#### npm

```bash
npm run build
```

#### yarn

```bash
yarn build
```

---

## 🔍 Preview Build Locally

#### npm

```bash
npm run preview
```

#### yarn

```bash
yarn preview
```

---

## 🚢 Deployment

### 🔧 GitHub Pages

The project includes a built-in deployment setup via **gh-pages**.

#### On macOS / Linux

```bash
npm run deploy
# or
yarn deploy
```

#### On Windows

```bash
npm run deploy-win
# or
yarn deploy-win
```

After deployment, your site will be automatically published to GitHub Pages.

---

## 🧰 Useful Commands

| Command                                    | Description                          |
| ------------------------------------------ | ------------------------------------ |
| `npm run dev` / `yarn dev`                 | Start development mode               |
| `npm run build` / `yarn build`             | Build production bundle              |
| `npm run preview` / `yarn preview`         | Preview local production build       |
| `npm run deploy` / `yarn deploy`           | Deploy to GitHub Pages (Linux/macOS) |
| `npm run deploy-win` / `yarn deploy-win`   | Deploy to GitHub Pages (Windows)     |
| `npm run lint` / `yarn lint`               | Run lint and formatting checks       |
| `npm run lint:fix` / `yarn lint:fix`       | Auto-fix lint errors                 |
| `npm run test` / `yarn test`               | Run Jest test suite                  |
| `npm run analyze` / `yarn analyze`         | Analyze bundle size                  |
| `npm run i18n-remove` / `yarn i18n-remove` | Clean up i18n locales                |

---

## 🧠 Development Notes

* Homepage dynamically lists categories from `src/constants/pages.ts`.
* Animations powered by **Framer Motion**.
* Fully responsive layout using Ant Design’s grid + `useIsMobile()` hook.
* Carousel auto-switches when tools exceed 4 items per category.
* Rotating tagline in hero section every 3 seconds using motion transitions.

---

## 🎨 Design Highlights

* Gradient hero titles and animated blob backgrounds.
* Smooth entrance and fade transitions with Framer Motion.
* Card-based feature layout with hover effects.
* Compact responsive design for mobile devices.

---

## 👨‍💻 Author

**Thanh Nguyen**
Creator & Developer of Ultimate Tools
🌐 [GitHub](https://github.com/pkafr0911)

> “All your essential tools, beautifully organized — like a digital Swiss Army knife, without the clutter.”

---

## 🪪 License

This project is licensed under the **MIT License** — you are free to fork, modify, and use it for personal or commercial purposes.

---

## 🌟 Support

If you find this project helpful, please give it a **⭐️ on GitHub** — it helps more developers discover it!
