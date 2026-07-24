# 🦊 Universal Quiz Engine Pro

> **Universal Cross-Platform Testing and Learning System based on Electron, HTML5, KaTeX, and Prism.js.**

![Electron](https://img.shields.io/badge/Electron-v28-47848F?style=flat-square&logo=electron&logoColor=white)
![JavaScript](https://img.shields.io/badge/Pure_JS-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![KaTeX](https://img.shields.io/badge/KaTeX-Supported-007ACC?style=flat-square)
![Prism.js](https://img.shields.io/badge/Prism.js-Syntax-2B2B2B?style=flat-square)
![Version](https://img.shields.io/badge/Version-v0.1.0--alpha-orange?style=flat-square)

---

## 📋 Table of Contents

1. [About the Project](#-about-the-project)
2. [Key Features](#-key-features)
3. [Project Architecture & Structure](#-project-architecture--structure)
4. [System Requirements & Dependencies](#-system-requirements--dependencies)
5. [Installation & Setup (Development)](#-installation--setup-development)
6. [Compilation & Production Build](#-compilation--production-build)
7. [Knowledge Base Format (Custom Questions)](#-knowledge-base-format-custom-questions)
8. [Electron Integration & Security Features](#-electron-integration--security-features)
9. [Version History](#-version-history)
10. [Author & Contact Information](#-author--contact-information)

---

## ℹ️ About the Project

**Universal Quiz Engine Pro** is a cross-platform desktop application designed for interactive testing, self-assessment, and exam preparation. The application natively supports complex scientific content (LaTeX formulas, syntax-highlighted code), detailed performance analytics categorized by topic, local statistics persistence, and adaptive dynamic localization.

The platform was engineered to deliver a comfortable, distraction-free, and effective learning environment. Its core goal is to empower students and professionals not merely to memorize correct choices, but to thoroughly review and analyze incorrect answers using a flexible system of explanations and topic-based performance breakdowns.

### 🏗️ Architectural Principle

The project is built on a modular design without heavy JavaScript framework overhead (**Pure JS / ES6+**). This approach guarantees instantaneous UI responsiveness, minimal RAM consumption, and near-zero startup initialization overhead inside the Electron container.

---

## ✨ Key Features

### 🌐 Multilingual Support (i18n)
* **Dynamic Language Switching:** Instant UI localization without needing to restart or reload the application.
* **3 Supported Languages:** Russian (`RU`), Italian (`IT`), and English (`EN`).

### ⚙️ Flexible Session Customization
* **Knowledge Base Selection:** Switch effortlessly between multiple academic subjects and test modules.
* **Custom Question Volume:** Select the exact number of questions per session via interactive stepper controls.
* **Time Management:** Configurable countdown timer (in minutes) or an unlimited untimed practice mode.
* **Exam Rules:** Enable or disable returning to previous questions, and toggle hints on or off.

### 🧪 Rich Scientific & Technical Content
* **Mathematics & Physics:** High-precision rendering of complex mathematical formulas, fractions, integrals, and scientific notation via **KaTeX**.
* **Programming & Code:** Real-time syntax highlighting for source code snippets (Python, JavaScript, C++, etc.) using **Prism.js**.

### 📊 Statistics & Performance Analytics
* **Attempt History:** Local storage tracking of attempt history, success rates, and question accuracy stored persistently in `LocalStorage`.
* **In-Test Context:** Live counter displaying total previous attempts directly on the active question screen.
* **Topic Diagnostics:** Automatic topic distribution providing clear insights into **Strengths** and **Areas for Improvement**.

### 🔍 Review Module (Error Analysis)
* **Slide-out Review Panel:** Built-in drawer containing a full list of completed session questions.
* **Detailed Option Explanations:** Suppressed during active testing (if hints are disabled), but providing comprehensive option-by-option breakdowns on the results screen.
* **Visual Status Indicators:** Color-coded status markers for correct, incorrect, and skipped questions.

### 🎨 UI/UX & Responsiveness
* **Focus Mode:** Automatic hiding of distraction elements (footer bar and version numbers) during active testing.
* **Smooth Transitions:** Fluid CSS hardware-accelerated screen transitions (`slide-in`, `fadeIn`).
* **Custom Controls:** Styled custom select dropdowns and numerical stepper controls.

---

## 📁 Project Architecture & Structure

```text
universal-quiz-engine/
├── assets/                  # Graphic assets and application icons
│   ├── icon.ico             # Application icon (Windows)
│   ├── icon.png             # App mascot (Fox) & general raster icon
│   └── icon.icns            # Application icon (macOS)
├── css/
│   └── style.css            # Primary stylesheet (Themes, Layouts, Animations)
├── js/
│   ├── algos.js             # Array shuffling and sample generation algorithms
│   ├── app.js               # Core application controller & quiz engine logic
│   ├── changelog.js         # Version history dataset for the built-in modal
│   ├── i18n.js              # Localization dictionary (RU, IT, EN)
│   └── storage.js           # LocalStorage state management and statistics handler
├── index.html               # Single-Page Application (SPA) HTML container
├── main.js                  # Main process entry point for Electron
└── package.json             # Node.js manifest, dependencies, and build scripts
```

### 🔑 Core Script Responsibilities

* **`main.js`**: Instantiates the primary `BrowserWindow`, sets minimum dimension bounds (`600x500`), hides the native menu bar (`autoHideMenuBar: true`), and intercepts external URL navigation via `shell.openExternal`.
* **`js/app.js`**: Controls view transitions, countdown timers, score calculations, review panel state, and distraction-free UI toggling.
* **`js/i18n.js`**: Stores the complete localization dictionary for UI elements, error messages, and dynamic labels across supported locales.
* **`js/storage.js`**: Safely manages reading and writing user progress and statistics in `LocalStorage`.

---

## 💻 System Requirements & Dependencies

### 1. Developer & Build Environment Requirements
* **Operating System:** Windows 10/11, macOS (10.15+), or Linux (Ubuntu 20.04+, Debian, Fedora).
* **Runtime Environment:** Node.js (`v16.x`, `v18.x`, or `v20.x` recommended).
* **Package Manager:** `npm` (v8+) or `yarn`.

### 2. Dependencies Overview

| Dependency | Type | Description / Purpose |
| :--- | :--- | :--- |
| **Electron** | `devDependency` | Desktop application framework wrapping Node.js and Chromium. |
| **KaTeX** | Frontend (CDN) | Fast math typesetting engine for LaTeX rendering. |
| **Prism.js** | Frontend (CDN) | Lightweight, extensible syntax highlighter (Python, JS, C++, etc.). |
| **electron-builder** | `devDependency` | Packaging tool to generate installers (`.exe`, `.dmg`, `.AppImage`). |

---

## 🚀 Installation & Setup (Development)

Follow these step-by-step instructions to run the project locally in a development environment:

### Step 1: Clone or Extract the Project
Open your preferred terminal (PowerShell, Command Prompt, or Terminal) and navigate to the project directory:
```bash
cd path/to/universal-quiz-engine
```

### Step 2: Install Node.js Dependencies
Execute the installation command to fetch all required development modules:
```bash
npm install
```

### Step 3: Launch Development Server
Start the application in Electron development mode:
```bash
npm start
```

---

## 📦 Compilation & Production Build

To compile standalone executable files for end-users, ensure that your `package.json` contains proper build configuration as shown below:

```json
{
  "name": "universal-quiz-engine",
  "version": "0.1.0",
  "description": "Universal Quiz Engine Pro",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.0"
  },
  "build": {
    "appId": "com.univ.quizengine",
    "productName": "Universal Quiz Engine Pro",
    "directories": {
      "output": "dist"
    },
    "files": [
      "**/*"
    ],
    "win": {
      "target": ["nsis", "portable"],
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": ["dmg"],
      "icon": "assets/icon.icns"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "assets/icon.png"
    }
  }
}
```

### 🛠️ Distribution Build Commands

* **Windows Build** (`.exe` / NSIS Installer / Portable):
  ```bash
  npm run build:win
  ```
* **macOS Build** (`.dmg` Package):
  ```bash
  npm run build:mac
  ```
* **Linux Build** (`.AppImage` / `.deb` Package):
  ```bash
  npm run build:linux
  ```

*Note: Compiled binaries will be output directly into the generated `dist/` directory.*

---

## 📖 Knowledge Base Format (Custom Questions)

Questions are structured as an array of JavaScript / JSON objects. You can easily extend existing modules or introduce brand-new subject knowledge bases.

### 📝 Question Object Schema

```json
{
  "id": "math_001",
  "topic": "Mathematical Analysis",
  "q": "What is the limit of $\lim_{x \to 0} \frac{\sin x}{x}$?",
  "options": [
    "0",
    "1",
    "\infty",
    "Does not exist"
  ],
  "ans": 1,
  "hint": "Use the first remarkable limit theorem.",
  "exp": "General summary explanation for the question.",
  "explanations": [
    "Incorrect. As x -> 0, both numerator and denominator approach 0.",
    "Correct! This is the fundamental first limit theorem.",
    "Incorrect. The limit is finite and well-defined.",
    "Incorrect. The limit exists and equals 1."
  ]
}
```

---

## 🔒 Electron Integration & Security Features

The application implements security and UI integration standards for Electron desktop environments:

### 🔗 External Link Interception
To prevent external links (such as the Ko-fi donation link) from loading inside the application window and breaking the layout, `main.js` implements `setWindowOpenHandler`:

```javascript
win.webContents.setWindowOpenHandler(({ url }) => {
  shell.openExternal(url); // Opens link in system default browser
  return { action: 'deny' }; // Prevents creating internal window
});
```

### 🖼️ Window Management & Isolation
Minimum window dimensions are enforced (`minWidth: 600`, `minHeight: 500`) to eliminate layout distortion upon extreme window shrinking. The native OS menu bar is hidden by default (`autoHideMenuBar: true`).

---

## 🔄 Version History

* **Current Version:** `v0.1.0-alpha`
* **Release Date:** 2026
* **Status:** Alpha Release (Active Development)

### 🚀 Changelog Summary

* ➕ **Slide-out Review Drawer:** Added a "Show Answers" / "Hide Answers" toggle button on the results screen that slides open a panel containing all session questions along with option-specific explanations.
* 👁️ **Focus Mode (Distraction-Free UI):** Automated auto-hiding of the bottom footer (`.app-footer`) and version tag (`.version-bar`) upon quiz initiation to prevent student distraction.
* 🔗 **System Browser Handlers:** Configured click interception for external web links (e.g., Ko-fi donation) using Electron's `shell.openExternal` API.
* 🌍 **Expanded Localization Dictionary:** Introduced new i18n keys for answer review controls across all supported locales (`RU`, `IT`, `EN`).
* 🧮 **Integrated KaTeX & Prism.js:** Enabled real-time client-side typesetting for mathematical equations and syntax highlighting for technical code snippets.

---

## 👨‍💻 Author & Contact Information

* **Author:** Vladimir Rukavishnikov
* **Matricola (Student ID):** 20063686
* **Institution:** UPO DISIT (*Università del Piemonte Orientale*)
* **Support / Donate:** [Donate on Ko-fi](https://ko-fi.com)
* **Copyright:** © 2026 Vladimir Rukavishnikov. All Rights Reserved.