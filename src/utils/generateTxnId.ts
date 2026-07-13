export function generateTxnId(existingIds: string[]): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const prefix = `TXN-${year}${month}${day}-`;
  
  // Find all existing IDs for today to determine the next sequence number
  const todayIds = existingIds.filter(id => id.startsWith(prefix));
  
  let maxSeq = 0;
  for (const id of todayIds) {
    const seqStr = id.split('-')[2];
    if (seqStr) {
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }
  
  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `${prefix}${nextSeq}`;
}
