import { useState, useRef } from 'react';
import { Button } from '@/components/common/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/common/Dialog';
import { parseCSV } from '@/utils/dataManagement';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useAccountStore } from '@/stores/useAccountStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { FileUp, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateTxnId } from '@/utils/generateTxnId';

export function CSVImport() {
  const [isOpen, setIsOpen] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [openingBalanceStrategy, setOpeningBalanceStrategy] = useState<'keep' | 'replace'>('keep');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addTransaction, transactions } = useTransactionStore();
  const { accounts, addAccount, updateAccount } = useAccountStore();
  const { categories } = useCategoryStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseCSV(file);
      validateData(data);
      setParsedData(data);
      setIsOpen(true);
    } catch {
      toast.error('Failed to parse CSV');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateData = (data: any[]) => {
    const newErrors: string[] = [];
    
    if (data.length === 0) {
      newErrors.push("The CSV file is empty.");
      setErrors(newErrors);
      return;
    }

    // Basic validation of the first row headers/keys
    const firstRow = data[0];
    if (!('Amount' in firstRow) || !('Date' in firstRow) || !('Type' in firstRow)) {
      newErrors.push("Missing required columns: Amount, Date, Type. Ensure your CSV matches the export format.");
    }

    // Check mapping validity
    let invalidTypes = 0;
    let invalidDates = 0;

    data.forEach((row) => {
      // Ignore empty trailing rows
      if (!row.Amount && !row.Type && !row.Date) return;

      const type = (row.Type || '').toLowerCase();
      if (!['income', 'expense', 'transfer'].includes(type)) invalidTypes++;
      
      const date = new Date(row.Date);
      if (isNaN(date.getTime())) invalidDates++;
    });

    if (invalidTypes > 0) newErrors.push(`Found ${invalidTypes} rows with invalid Types.`);
    if (invalidDates > 0) newErrors.push(`Found ${invalidDates} rows with invalid Dates.`);

    setErrors(newErrors);
  };

  const handleImport = async () => {
    setIsImporting(true);
    
    try {
      // Small delay to let UI show loading state if massive
      await new Promise(r => setTimeout(r, 100));

      let importedCount = 0;
      let newAccountsCount = 0;
      const existingIds = transactions.map(t => t.id);

      // Process unique accounts first
      const accountMap = new Map(accounts.map(a => [a.name.toLowerCase(), a]));
      
      for (const row of parsedData) {
        const accNames = [];
        if (row.Account) accNames.push(row.Account);
        if (row['From Account']) accNames.push(row['From Account']);
        if (row['To Account']) accNames.push(row['To Account']);

        for (const name of accNames) {
          const lowerName = name.toLowerCase();
          const csvOpeningBalance = row['Account Opening Balance'] ? parseFloat(row['Account Opening Balance']) : 0;
          
          if (!accountMap.has(lowerName)) {
            // Create new account
const newAcc = {
              name,
              type: 'bank', // default legacy field for backward compatibility
              accountType: 'bank_account' as const,
              openingBalance: csvOpeningBalance,
              description: 'Imported from CSV'
            };

            // Note: addAccount handles the id generation
            const tempId = `acc-imported-${Date.now()}-${Math.random()}`;
            accountMap.set(lowerName, { ...newAcc, id: tempId, isDefault: false, createdAt: new Date().toISOString() } as any);
            addAccount(newAcc);
            newAccountsCount++;
          } else {
            // Existing account
            const existing = accountMap.get(lowerName)!;
            if (row['Account Opening Balance'] !== undefined && openingBalanceStrategy === 'replace') {
              if (existing.openingBalance !== csvOpeningBalance && !existing.id.startsWith('acc-imported')) {
                updateAccount(existing.id, { openingBalance: csvOpeningBalance });
                existing.openingBalance = csvOpeningBalance;
              }
            }
          }
        }
      }

      // Re-fetch accounts to get the actual generated IDs
      const updatedAccounts = useAccountStore.getState().accounts;

      for (const row of parsedData) {
        if (!row.Amount && !row.Type && !row.Date) continue; // skip empty

        const type = (row.Type || '').toLowerCase() as 'income' | 'expense' | 'transfer';
        if (!['income', 'expense', 'transfer'].includes(type)) continue;

        const account = updatedAccounts.find(a => a.name.toLowerCase() === (row.Account || '').toLowerCase());
        const category = categories.find(c => c.name.toLowerCase() === (row.Category || '').toLowerCase());
        
        const fromAccount = updatedAccounts.find(a => a.name.toLowerCase() === (row['From Account'] || '').toLowerCase());
        const toAccount = updatedAccounts.find(a => a.name.toLowerCase() === (row['To Account'] || '').toLowerCase());

        const txn: any = {
          type,
          amount: parseFloat(row.Amount) || 0,
          date: new Date(row.Date).toISOString(),
          notes: row.Notes || '',
        };

        if (type === 'transfer') {
          txn.fromAccountId = fromAccount?.id;
          txn.toAccountId = toAccount?.id;
        } else {
          txn.accountId = account?.id;
          txn.categoryId = category?.id;
        }

        txn.id = generateTxnId(existingIds);
        existingIds.push(txn.id);

        addTransaction(txn);
        importedCount++;
      }

      toast.success(`Imported ${importedCount} transactions and ${newAccountsCount} new accounts.`);
      setIsOpen(false);
      setParsedData([]);
    } catch {
      toast.error('An error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="p-4 rounded-lg border border-border bg-card flex flex-col gap-3">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <FileUp className="w-5 h-5" />
          <h5 className="font-semibold">Import CSV</h5>
        </div>
        <p className="text-sm text-muted-foreground">Import transactions from a CSV file. The format should match the CSV Export.</p>
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        <Button variant="outline" className="mt-auto w-full" onClick={() => fileInputRef.current?.click()}>
          Select CSV File
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            {errors.length > 0 ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 rounded-lg space-y-2">
                <div className="flex items-center gap-2 font-semibold mb-2">
                  <AlertCircle className="w-5 h-5" />
                  Validation Errors Found
                </div>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">File is valid and ready to import! Found {parsedData.length} rows.</span>
              </div>
            )}

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 truncate max-w-[100px]">{row.Date || '-'}</td>
                      <td className="px-4 py-2">{row.Type || '-'}</td>
                      <td className="px-4 py-2">{row.Amount || '-'}</td>
                      <td className="px-4 py-2 truncate max-w-[120px]">{row.Category || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 5 && (
                <div className="p-2 text-center text-xs text-muted-foreground bg-muted border-t border-border">
                  + {parsedData.length - 5} more rows
                </div>
              )}
            </div>

            {parsedData.some(row => row['Account Opening Balance'] !== undefined) && (
              <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-2">
                <h4 className="font-medium text-sm">Existing Accounts Opening Balance</h4>
                <p className="text-xs text-muted-foreground">The CSV contains Opening Balance values. If an account already exists, how should we handle it?</p>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="ob_strategy" 
                      value="keep" 
                      checked={openingBalanceStrategy === 'keep'} 
                      onChange={() => setOpeningBalanceStrategy('keep')} 
                      className="text-primary"
                    />
                    Keep Existing
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name="ob_strategy" 
                      value="replace" 
                      checked={openingBalanceStrategy === 'replace'} 
                      onChange={() => setOpeningBalanceStrategy('replace')} 
                      className="text-primary"
                    />
                    Replace with CSV
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isImporting}>Cancel</Button>
              <Button 
                onClick={handleImport} 
                disabled={errors.length > 0 || isImporting}
              >
                {isImporting ? 'Importing...' : 'Confirm Import'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
