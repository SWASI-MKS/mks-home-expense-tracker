export function isFirestoreSpecialType(obj: any): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  // Date
  if (obj instanceof Date) return true;
  
  // Blob / File / Uint8Array
  if (obj instanceof Blob || (typeof File !== 'undefined' && obj instanceof File) || obj instanceof Uint8Array) return true;
  
  // Firestore Timestamp
  if (obj.constructor?.name === 'Timestamp' || typeof obj.toDate === 'function') return true;
  
  // GeoPoint
  if (obj.constructor?.name === 'GeoPoint' || ('latitude' in obj && 'longitude' in obj && typeof obj.isEqual === 'function')) return true;
  
  // DocumentReference
  if (obj.constructor?.name === 'DocumentReference' || (typeof obj.withConverter === 'function' && 'path' in obj)) return true;
  
  return false;
}

export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (isFirestoreSpecialType(data)) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  
  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const val = data[key];
        if (val !== undefined) {
          cleaned[key] = sanitizeForFirestore(val);
        }
      }
    }
    return cleaned as T;
  }
  
  return data;
}

export function validateFirestoreData(collectionName: string, data: any): void {
  if (!data) {
    throw new Error('Data is empty or null');
  }

  if (collectionName === 'accounts') {
    if (!data.id) throw new Error('Account id is required');
    if (!data.name) throw new Error('Account name is required');
    if (!data.type && !data.accountType) throw new Error('Account type or accountType is required');
    if (data.openingBalance === undefined && data.balance === undefined) {
      throw new Error('Account openingBalance or balance is required');
    }
  } else if (collectionName === 'transactions') {
    if (!data.id) throw new Error('Transaction id is required');
    if (!data.type) throw new Error('Transaction type is required');
    if (data.amount === undefined) throw new Error('Transaction amount is required');
    if (!data.date) throw new Error('Transaction date is required');
  } else if (collectionName === 'categories') {
    if (!data.id) throw new Error('Category id is required');
    if (!data.name) throw new Error('Category name is required');
    if (!data.type) throw new Error('Category type is required');
  } else if (collectionName === 'budgets') {
    if (!data.id) throw new Error('Budget id is required');
    if (!data.name) throw new Error('Budget name is required');
    if (!data.categoryId) throw new Error('Budget categoryId is required');
    if (data.amount === undefined) throw new Error('Budget amount is required');
  } else if (collectionName === 'settings') {
    if (!data.id) throw new Error('Settings id is required');
  } else if (collectionName === 'notifications') {
    if (!data.id) throw new Error('Notification id is required');
    if (!data.title) throw new Error('Notification title is required');
    if (!data.message) throw new Error('Notification message is required');
    if (!data.category) throw new Error('Notification category is required');
    if (!data.severity) throw new Error('Notification severity is required');
    if (!data.timestamp) throw new Error('Notification timestamp is required');
  }
}
