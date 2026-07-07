import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { CalendarNote, CalendarReminder, CalendarEvent } from '@/types';

const DEMO_SOURCE = 'demo';
const FAMILY_MEMBERS = ['Dad', 'Mom', 'Shruti', 'Swasi'];

// Helper to get random item
const getRandom = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start: Date, end: Date) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

export type ProgressCallback = (message: string, progress: number, total: number) => void;

export const hasDemoData = () => {
  const { transactions } = useTransactionStore.getState();
  return transactions.some((t: any) => t.source === DEMO_SOURCE);
};

export const clearDemoData = async (onProgress?: ProgressCallback) => {
  const { transactions, archiveTransaction } = useTransactionStore.getState();
  const { accounts, deleteAccount } = useAccountStore.getState();
  const { categories, deleteCategory } = useCategoryStore.getState();
  const { budgets, deleteBudget } = useBudgetStore.getState();
  const { events, reminders, notes, deleteEvent, deleteReminder, deleteNote } = useCalendarStore.getState();

  if (onProgress) onProgress('Clearing Demo Transactions...', 0, 100);
  transactions.filter((t: any) => t.source === DEMO_SOURCE).forEach((t: any) => archiveTransaction(t.id));
  
  if (onProgress) onProgress('Clearing Demo Calendar Items...', 20, 100);
  events.filter((e: any) => e.source === DEMO_SOURCE).forEach((e: any) => deleteEvent(e.id));
  reminders.filter((r: any) => r.source === DEMO_SOURCE).forEach((r: any) => deleteReminder(r.id));
  notes.filter((n: any) => n.source === DEMO_SOURCE).forEach((n: any) => deleteNote(n.id));

  if (onProgress) onProgress('Clearing Demo Budgets...', 40, 100);
  budgets.filter((b: any) => b.source === DEMO_SOURCE).forEach((b: any) => deleteBudget(b.id));

  if (onProgress) onProgress('Clearing Demo Accounts...', 60, 100);
  accounts.filter((a: any) => a.source === DEMO_SOURCE).forEach((a: any) => deleteAccount(a.id));

  if (onProgress) onProgress('Clearing Demo Categories...', 80, 100);
  categories.filter((c: any) => c.source === DEMO_SOURCE).forEach((c: any) => deleteCategory(c.id));

  if (onProgress) onProgress('Demo data cleared.', 100, 100);
  
  // Wait a tick for UI to update
  await new Promise(resolve => setTimeout(resolve, 100));
};

export const generateDemoData = async (onProgress: ProgressCallback) => {
  console.log("generateDemoData() executing...");
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // 1. Accounts
  console.log("generateAccounts() executing...");
  onProgress('Generating Accounts...', 0, 9);
  const accountDefs = [
    { name: 'Cash Wallet', type: 'cash', openingBalance: 15000 },
    { name: 'SBI Bank', type: 'bank', openingBalance: 120000 },
    { name: 'HDFC Bank', type: 'bank', openingBalance: 85000 },
    { name: 'ICICI Bank', type: 'bank', openingBalance: 45000 },
    { name: 'Axis Bank', type: 'bank', openingBalance: 60000 },
    { name: 'GPay', type: 'wallet', openingBalance: 5000 },
    { name: 'PhonePe', type: 'wallet', openingBalance: 3000 },
    { name: 'Emergency Cash', type: 'cash', openingBalance: 50000 },
    { name: 'Credit Card', type: 'credit', openingBalance: -15000 }
  ];

  const generatedAccounts: any[] = [];
  for (let i = 0; i < accountDefs.length; i++) {
    const a = accountDefs[i];
    const demoName = `${a.name} (Demo)`;
    try {
      useAccountStore.getState().addAccount({
        name: demoName,
        type: a.type,
        openingBalance: a.openingBalance,
        openingBalanceDate: startOfYear.toISOString().split('T')[0],
        source: DEMO_SOURCE
      } as any);
    } catch {
      console.warn('Account already exists:', demoName);
    }
    const createdAcc = useAccountStore.getState().accounts.find(acc => acc.name === demoName);
    if (createdAcc) generatedAccounts.push({ ...a, id: createdAcc.id });
    onProgress(`Generating Accounts... (${i+1}/9)`, i+1, 9);
  }

  // 2. Categories
  console.log("generateCategories() executing...");
  onProgress('Generating Categories...', 0, 31);
  const incomeCats = ['Salary', 'Business', 'Freelancing', 'Interest', 'Bonus', 'Gift', 'Refund'];
  const expenseCats = ['Groceries', 'Vegetables', 'Fruits', 'Milk', 'Fuel', 'Shopping', 'Restaurant', 'Fast Food', 'Medical', 'Pharmacy', 'Electricity', 'Water Bill', 'Internet', 'Mobile Recharge', 'Travel', 'Education', 'School Fees', 'College Fees', 'EMI', 'Insurance', 'Entertainment', 'Donation', 'Maintenance', 'Miscellaneous'];
  
  const generatedCategories: any[] = [];
  let catIndex = 0;
  [...incomeCats.map(n => ({ n, t: 'income' })), ...expenseCats.map(n => ({ n, t: 'expense' }))].forEach((cat) => {
    catIndex++;
    const demoName = `${cat.n} (Demo)`;
    try {
      useCategoryStore.getState().addCategory({
        name: demoName,
        type: cat.t as 'income' | 'expense',
        source: DEMO_SOURCE
      } as any);
    } catch {
      console.warn('Category already exists:', demoName);
    }
    const createdCat = useCategoryStore.getState().categories.find(c => c.name === demoName);
    if (createdCat) generatedCategories.push({ ...cat, id: createdCat.id });
    onProgress(`Generating Categories... (${catIndex}/31)`, catIndex, 31);
  });

  // 3. Budgets (Generating for Current Month)
  console.log("generateBudgets() executing...");
  onProgress('Generating Budgets...', 0, 8);
  const budgetDefs = [
    { cat: 'Groceries', amount: 15000, util: 0.95 }, // 95% utilization
    { cat: 'Fuel', amount: 5000, util: 1.10 }, // 110% utilization (Exceeded)
    { cat: 'Shopping', amount: 10000, util: 0.40 }, // 40% utilization
    { cat: 'Entertainment', amount: 7000, util: 0.85 }, // 85% utilization
    { cat: 'Medical', amount: 4000, util: 0.60 }, // 60%
    { cat: 'Travel', amount: 8000, util: 0.99 }, // 99%
    { cat: 'Electricity', amount: 3000, util: 0.90 }, // 90%
    { cat: 'Internet', amount: 1500, util: 1.00 } // 100%
  ];

  const generatedBudgets: any[] = [];
  budgetDefs.forEach((b, i) => {
    const catId = generatedCategories.find(c => c.n === b.cat)?.id;
    if (catId) {
      const demoName = `${b.cat} Budget (Demo)`;
      try {
        useBudgetStore.getState().addBudget({
          name: demoName,
          categoryId: catId,
          amount: b.amount,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
          enabled: true,
          source: DEMO_SOURCE
        } as any);
      } catch {
        console.warn('Budget already exists:', demoName);
      }
      const createdBud = useBudgetStore.getState().budgets.find(bud => bud.name === demoName);
      if (createdBud) generatedBudgets.push({ ...b, id: createdBud.id, catId });
    }
    onProgress(`Generating Budgets... (${i+1}/${budgetDefs.length})`, i+1, budgetDefs.length);
  });

  // 4. Transactions
  console.log("generateTransactions() executing...");
  const numTransactions = getRandomInt(250, 350);
  onProgress(`Generating Transactions... (0/${numTransactions})`, 0, numTransactions);

  // We need to generate transactions that satisfy the budget utilizations for the current month
  const currentMonthTxns: any[] = [];
  generatedBudgets.forEach(b => {
    const targetSpent = Math.round(b.amount * b.util);
    let remainingToSpend = targetSpent;
    while(remainingToSpend > 0) {
      const spend = Math.min(remainingToSpend, getRandomInt(500, 3000));
      remainingToSpend -= spend;
      currentMonthTxns.push({
        amount: spend,
        categoryId: b.catId,
        date: getRandomDate(new Date(now.getFullYear(), now.getMonth(), 1), endOfCurrentMonth),
        type: 'expense'
      });
    }
  });

  await new Promise(resolve => setTimeout(resolve, 50));

  const familyPatterns = {
    Dad: {
      income: ['Salary', 'Business'],
      expense: ['Fuel', 'Insurance', 'Maintenance'],
      accounts: ['SBI Bank', 'Credit Card', 'Cash Wallet']
    },
    Mom: {
      income: ['Freelancing'],
      expense: ['Groceries', 'Vegetables', 'Shopping', 'Medical', 'Electricity'],
      accounts: ['HDFC Bank', 'Cash Wallet', 'GPay']
    },
    Shruti: {
      income: ['Gift'],
      expense: ['College Fees', 'Mobile Recharge', 'Restaurant', 'Entertainment'],
      accounts: ['PhonePe', 'Cash Wallet']
    },
    Swasi: {
      income: ['Gift'],
      expense: ['School Fees', 'Mobile Recharge', 'Fast Food', 'Shopping'],
      accounts: ['PhonePe', 'Cash Wallet']
    }
  };

  const getAccountByName = (name: string) => generatedAccounts.find(a => a.name === name)?.id;
  const getCategoryByName = (name: string) => generatedCategories.find(c => c.n === name)?.id;

  for (let i = 0; i < numTransactions; i++) {
    let tDate = getRandomDate(startOfYear, endOfCurrentMonth);
    let tType = Math.random() > 0.8 ? 'income' : 'expense';
    let tAmount = 0;
    let categoryId = '';
    let accountId = '';
    let notes = '';
    let addedBy = getRandom(FAMILY_MEMBERS);

    if (currentMonthTxns.length > 0 && Math.random() > 0.5) {
      const bTxn = currentMonthTxns.pop();
      tType = 'expense';
      tAmount = bTxn.amount;
      categoryId = bTxn.categoryId;
      tDate = bTxn.date;
      addedBy = ['Mom', 'Dad'][getRandomInt(0,1)];
      const catName = generatedCategories.find(c => c.id === categoryId)?.n;
      accountId = getAccountByName(getRandom(familyPatterns[addedBy as keyof typeof familyPatterns].accounts)) || generatedAccounts[0].id;
      notes = `${catName} expenses`;
    } else {
      const pattern = familyPatterns[addedBy as keyof typeof familyPatterns];
      const catName = getRandom(pattern[tType as 'income' | 'expense'] || pattern.expense);
      categoryId = getCategoryByName(catName) || generatedCategories[0].id;
      accountId = getAccountByName(getRandom(pattern.accounts)) || generatedAccounts[0].id;
      
      if (tType === 'income') {
        tAmount = catName === 'Salary' ? getRandomInt(50000, 150000) : getRandomInt(1000, 20000);
        notes = `${catName} Received`;
      } else {
        tAmount = getRandomInt(100, 5000);
        notes = `Paid for ${catName}`;
      }
    }

    useTransactionStore.getState().addTransaction({
      type: tType as 'income' | 'expense',
      amount: tAmount,
      date: tDate.toISOString().replace('Z', ''),
      categoryId,
      accountId,
      notes,
      addedBy,
      source: DEMO_SOURCE
    } as any);

    if (i % 25 === 0) {
      onProgress(`Generating Transactions... (${i}/${numTransactions})`, i, numTransactions);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  // 5. Transfers
  const numTransfers = 50;
  onProgress(`Generating Transfers... (0/${numTransfers})`, 0, numTransfers);
  
  const transferRoutes = [
    { from: 'SBI Bank', to: 'Cash Wallet' },
    { from: 'Cash Wallet', to: 'GPay' },
    { from: 'HDFC Bank', to: 'PhonePe' },
    { from: 'ICICI Bank', to: 'Cash Wallet' },
    { from: 'Axis Bank', to: 'SBI Bank' }
  ];

  for(let i=0; i<numTransfers; i++) {
    const route = getRandom(transferRoutes);
    const fromAccountId = getAccountByName(route.from);
    const toAccountId = getAccountByName(route.to);
    const tDate = getRandomDate(startOfYear, endOfCurrentMonth);

    if (fromAccountId && toAccountId) {
      useTransactionStore.getState().addTransaction({
        type: 'transfer',
        amount: getRandomInt(1000, 10000),
        date: tDate.toISOString().replace('Z', ''),
        fromAccountId,
        toAccountId,
        notes: `Fund Transfer to ${route.to}`,
        addedBy: getRandom(FAMILY_MEMBERS),
        source: DEMO_SOURCE
      } as any);
    }

    if (i % 10 === 0) {
      onProgress(`Generating Transfers... (${i}/${numTransfers})`, i, numTransfers);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  // 6. Calendar Items
  console.log("generateCalendar() executing...");
  const numCalendarItems = 60;
  onProgress(`Generating Calendar... (0/${numCalendarItems})`, 0, numCalendarItems);
  
  const calendarEvents = [
    { type: 'event', title: 'Dad Birthday', recurrence: 'yearly' },
    { type: 'event', title: 'Mom Birthday', recurrence: 'yearly' },
    { type: 'event', title: 'Shruti Exam', recurrence: 'none' },
    { type: 'event', title: 'Swasi School Fees', recurrence: 'none' },
    { type: 'event', title: 'Family Function', recurrence: 'none' },
    { type: 'reminder', title: 'Electricity Due', priority: 'high', recurrence: 'monthly' },
    { type: 'reminder', title: 'Water Bill', priority: 'medium', recurrence: 'monthly' },
    { type: 'reminder', title: 'LIC Premium', priority: 'critical', recurrence: 'yearly' },
    { type: 'reminder', title: 'Credit Card Payment', priority: 'high', recurrence: 'monthly' },
    { type: 'note', title: 'Finance Goals 2026', isPinned: true },
    { type: 'note', title: 'Emergency Fund Plan', isPinned: false }
  ];

  for(let i=0; i<numCalendarItems; i++) {
    const template = getRandom(calendarEvents);
    const cDate = getRandomDate(startOfYear, endOfCurrentMonth);
    
    if (template.type === 'event') {
      useCalendarStore.getState().addEvent({
        id: `cal_demo_ev_${i}`,
        type: 'event',
        title: template.title,
        date: cDate.toISOString().split('T')[0],
        createdAt: now.toISOString(),
        addedBy: getRandom(FAMILY_MEMBERS),
        source: DEMO_SOURCE,
        recurrence: (template.recurrence as any) || 'none'
      } as CalendarEvent);
    } else if (template.type === 'reminder') {
      useCalendarStore.getState().addReminder({
        id: `cal_demo_rem_${i}`,
        type: 'reminder',
        title: template.title,
        date: cDate.toISOString().split('T')[0],
        createdAt: now.toISOString(),
        addedBy: getRandom(FAMILY_MEMBERS),
        source: DEMO_SOURCE,
        priority: (template.priority as any) || 'medium',
        status: 'pending',
        dueDate: cDate.toISOString().split('T')[0],
        notificationEnabled: true,
        recurrence: (template.recurrence as any) || 'none'
      } as CalendarReminder);
    } else if (template.type === 'note') {
      useCalendarStore.getState().addNote({
        id: `cal_demo_not_${i}`,
        type: 'note',
        title: template.title,
        date: cDate.toISOString().split('T')[0],
        createdAt: now.toISOString(),
        addedBy: getRandom(FAMILY_MEMBERS),
        source: DEMO_SOURCE,
        isPinned: !!template.isPinned,
        isFavorite: false
      } as CalendarNote);
    }

    if (i % 10 === 0) {
      onProgress(`Generating Calendar... (${i}/${numCalendarItems})`, i, numCalendarItems);
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  onProgress(`Uploading to Firestore...`, 100, 100);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay for "upload"

  return {
    accounts: accountDefs.length,
    categories: generatedCategories.length,
    budgets: budgetDefs.length,
    transactions: numTransactions,
    transfers: numTransfers,
    calendarItems: numCalendarItems,
    totalRecords: accountDefs.length + generatedCategories.length + budgetDefs.length + numTransactions + numTransfers + numCalendarItems,
  };
};

export const resetDemoData = async (onProgress: ProgressCallback) => {
  await clearDemoData(onProgress);
  return await generateDemoData(onProgress);
};
