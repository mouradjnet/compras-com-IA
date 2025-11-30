import { User, ShoppingList, Item, Product } from '../types';

// Initial Mock Data
const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Leite Integral', category: 'Laticínios', averagePrice: 4.50, barcode: '7891000100103' },
  { id: 'p2', name: 'Arroz Branco 5kg', category: 'Mercearia', averagePrice: 24.90, barcode: '7891000200201' },
  { id: 'p3', name: 'Detergente Neutro', category: 'Limpeza', averagePrice: 2.89, barcode: '7891000300308' },
];

class LocalDB {
  private get<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  private set(key: string, value: any): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // --- User ---
  login(): User {
    // Simulating Google Auth response
    const user: User = {
      id: 'u1',
      email: 'usuario@gmail.com',
      name: 'Usuário Demo',
      avatarUrl: 'https://picsum.photos/100/100'
    };
    this.set('currentUser', user);
    return user;
  }

  getCurrentUser(): User | null {
    return this.get<User>('currentUser');
  }

  logout(): void {
    localStorage.removeItem('currentUser');
  }

  // --- Lists ---
  getLists(userId: string): ShoppingList[] {
    const lists = this.get<ShoppingList[]>('lists') || [];
    // Ensure legacy lists have a status
    return lists
      .filter(l => l.userId === userId)
      .map(l => ({ ...l, status: l.status || 'active' }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  createList(userId: string, name: string): ShoppingList {
    const lists = this.get<ShoppingList[]>('lists') || [];
    const newList: ShoppingList = {
      id: crypto.randomUUID(),
      userId,
      name,
      createdAt: Date.now(),
      status: 'active'
    };
    lists.push(newList);
    this.set('lists', lists);
    return newList;
  }

  deleteList(listId: string): void {
    let lists = this.get<ShoppingList[]>('lists') || [];
    lists = lists.filter(l => l.id !== listId);
    this.set('lists', lists);
    
    // Cleanup items
    let items = this.get<Item[]>('items') || [];
    items = items.filter(i => i.listId !== listId);
    this.set('items', items);
  }

  archiveList(listId: string): void {
    const lists = this.get<ShoppingList[]>('lists') || [];
    const index = lists.findIndex(l => l.id === listId);
    if (index !== -1) {
      lists[index].status = 'archived';
      lists[index].completedAt = Date.now();
      this.set('lists', lists);
    }
  }

  unarchiveList(listId: string): void {
    const lists = this.get<ShoppingList[]>('lists') || [];
    const index = lists.findIndex(l => l.id === listId);
    if (index !== -1) {
      lists[index].status = 'active';
      this.set('lists', lists);
    }
  }

  // --- Items ---
  getItems(listId: string): Item[] {
    const items = this.get<Item[]>('items') || [];
    return items.filter(i => i.listId === listId);
  }

  addItem(item: Omit<Item, 'id' | 'completed'>): Item {
    const items = this.get<Item[]>('items') || [];
    const newItem: Item = {
      ...item,
      id: crypto.randomUUID(),
      completed: false
    };
    items.push(newItem);
    this.set('items', items);
    
    // Auto-save product if new barcode
    if (item.barcode && !this.getProductByBarcode(item.barcode)) {
        this.saveProduct({
            id: crypto.randomUUID(),
            name: item.name,
            category: item.category || 'Geral',
            averagePrice: item.estimatedPrice || 0,
            barcode: item.barcode
        });
    }

    return newItem;
  }

  toggleItem(itemId: string): void {
    const items = this.get<Item[]>('items') || [];
    const index = items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      items[index].completed = !items[index].completed;
      if (items[index].completed) {
          items[index].purchasedAt = Date.now();
      } else {
          delete items[index].purchasedAt;
      }
      this.set('items', items);
    }
  }

  deleteItem(itemId: string): void {
    let items = this.get<Item[]>('items') || [];
    items = items.filter(i => i.id !== itemId);
    this.set('items', items);
  }

  // --- History ---
  getPurchasedItemsHistory(userId: string): (Item & { listName: string, listDate: number })[] {
      const lists = this.getLists(userId);
      const listMap = new Map(lists.map(l => [l.id, l]));
      
      const allItems = this.get<Item[]>('items') || [];
      
      // Filter items that are completed AND belong to the user's lists
      const history = allItems
        .filter(i => i.completed && listMap.has(i.listId))
        .map(i => {
            const list = listMap.get(i.listId)!;
            return {
                ...i,
                listName: list.name,
                listDate: list.createdAt,
                // If purchasedAt exists use it, otherwise fallback to list creation date (migration)
                purchasedAt: i.purchasedAt || list.createdAt 
            };
        })
        .sort((a, b) => (b.purchasedAt || 0) - (a.purchasedAt || 0));

      return history;
  }

  // --- Products (Catalog) ---
  getProductByBarcode(barcode: string): Product | undefined {
    // Check local storage first, then mock data
    const storedProducts = this.get<Product[]>('products') || [];
    const found = storedProducts.find(p => p.barcode === barcode);
    if (found) return found;

    return MOCK_PRODUCTS.find(p => p.barcode === barcode);
  }

  searchProducts(query: string): Product[] {
    const stored = this.get<Product[]>('products') || [];
    const all = [...MOCK_PRODUCTS, ...stored];
    const lowerQ = query.toLowerCase();
    return all.filter(p => p.name.toLowerCase().includes(lowerQ)).slice(0, 5);
  }

  saveProduct(product: Product): void {
      const stored = this.get<Product[]>('products') || [];
      stored.push(product);
      this.set('products', stored);
  }
}

export const db = new LocalDB();