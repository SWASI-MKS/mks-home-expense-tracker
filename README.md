# Expense Tracker - Premium Finance Dashboard

A premium, offline-first personal finance application to track expenses, manage budgets, and achieve your financial goals. Built with modern web technologies, prioritizing privacy and speed.

## 🚀 Features

- **Local-First Architecture:** All data is stored securely on your device using `localStorage`. No cloud syncing required, ensuring 100% privacy and offline capability.
- **Dynamic Dashboard:** A fully customizable, drag-and-drop dashboard powered by `@dnd-kit`. Visualize your net worth, cash flow, and spending habits with interactive charts.
- **Comprehensive Account Management:** Track cash, bank accounts, credit cards, and digital wallets. Each account maintains its own live running balance.
- **Transaction Engine:** Seamlessly add Incomes, Expenses, and Transfers. Includes soft-delete (archive) functionality and duplicate detection.
- **Budgeting & Calendar:** Set monthly category limits, track spending progress in real-time, and view daily cash flow on an interactive calendar.
- **Data Portability:** 
  - **Backup & Restore:** Generate complete JSON snapshots of your application state.
  - **Import:** Import massive datasets via CSV with automatic validation and preview.
  - **Export:** Export your transaction history to CSV, Excel (`.xlsx`), or professional PDF reports.
- **Premium UI/UX:** Built with a sophisticated Slate + Emerald color palette. Features smooth animations, light/dark mode, and responsive design across all devices.

## 🛠️ Technology Stack

- **Core:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, `clsx`, `tailwind-merge`
- **State Management:** Zustand (with `persist` middleware)
- **UI Components:** Radix UI (accessible primitives), Lucide React (icons)
- **Charts:** Recharts
- **Drag and Drop:** `@dnd-kit/core`, `@dnd-kit/sortable`
- **Data Export/Import:** `papaparse` (CSV), `xlsx` (Excel), `jspdf` (PDF)

## 📁 Folder Structure

```
src/
├── components/
│   ├── common/         # Reusable UI components (Buttons, Inputs, Cards, Dialogs)
│   ├── dashboard/      # Dashboard widgets and drag-and-drop container
│   ├── layout/         # App Layout, Sidebar, Topbar
├── constants/          # Default categories and account structures
├── hooks/              # Custom React hooks (e.g., useDashboardData)
├── pages/              # Page components (Dashboard, Transactions, Budgets, Settings)
├── stores/             # Zustand stores (useTransactionStore, useAccountStore, etc.)
├── types/              # TypeScript interfaces and type definitions
├── utils/              # Helper functions (ID generation, data management)
├── App.tsx             # Main application component and routing
└── main.tsx            # Application entry point
```

## 🔧 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd expense-tracker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

*Note: If building on Windows with strict AppLocker or Defender Application Control policies, `vite build` may fail if the native Rolldown binary (`rolldown-binding.win32-x64-msvc.node`) is blocked. This is an environment restriction, not an application code issue.*

## 📖 Usage Guide

### Managing Accounts
Navigate to the Settings or Accounts page (future expansion) to view your default accounts. Every transaction tied to an account will automatically update its balance.

### Adding Transactions
Click the "Add Transaction" button in the top navigation bar from anywhere in the app. Choose between Income, Expense, or Transfer. Transfers will safely move money between two accounts without artificially inflating your total income or expenses.

### Customizing the Dashboard
On the Dashboard page, click and hold the drag handle (six dots) on any widget to reorder it. You can collapse widgets using the chevron icon, or hide them completely using the eye icon. Restore hidden widgets via the "Restore Hidden" button at the top of the dashboard.

### Backup & Restore
Navigate to **Settings > Data Management**. Click "Generate Backup" to download a complete `.json` file of your application. To restore, upload the file and choose whether to merge the data or replace your current database completely.

---

*Designed and built for peak financial clarity.*
