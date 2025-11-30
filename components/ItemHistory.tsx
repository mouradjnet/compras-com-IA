import React, { useState, useEffect } from 'react';
import { ArrowLeft, History, Calendar, DollarSign, Package } from 'lucide-react';
import { db } from '../services/db';
import { Item } from '../types';

interface ItemHistoryProps {
  userId: string;
  onBack: () => void;
}

interface HistoryItem extends Item {
    listName: string;
    listDate: number;
}

const parseQuantity = (qtyStr?: string): number => {
    if (!qtyStr) return 1;
    const normalized = qtyStr.replace(',', '.');
    const match = normalized.match(/(\d+(\.\d+)?)/);
    const val = match ? parseFloat(match[0]) : 1;
    return isNaN(val) || val <= 0 ? 1 : val;
};

const ItemHistory: React.FC<ItemHistoryProps> = ({ userId, onBack }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const history = db.getPurchasedItemsHistory(userId);
    setItems(history);
  }, [userId]);

  // Group items by Month/Year
  const groupedItems = items.reduce((acc, item) => {
    const date = new Date(item.purchasedAt || item.listDate);
    const key = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    if (!acc[key]) {
        acc[key] = {
            items: [],
            total: 0
        };
    }
    
    const qty = parseQuantity(item.quantity);
    const price = item.estimatedPrice || 0;
    const totalItem = qty * price;

    acc[key].items.push(item);
    acc[key].total += totalItem;
    
    return acc;
  }, {} as Record<string, { items: HistoryItem[], total: number }>);

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
       {/* Header */}
       <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center space-x-4 sticky top-0 z-10 shadow-sm">
          <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
             <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
             <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                 <History className="w-5 h-5 text-blue-500" />
                 Histórico de Compras
             </h2>
             <p className="text-xs text-gray-400">Todos os itens marcados como comprados</p>
          </div>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {items.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                  <p>Nenhum item comprado registrado ainda.</p>
              </div>
          ) : (
             Object.entries(groupedItems).map(([period, data]: [string, { items: HistoryItem[], total: number }]) => (
                 <div key={period} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                     <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                         <span className="font-bold text-gray-700 capitalize flex items-center gap-2">
                             <Calendar className="w-4 h-4 text-gray-400" />
                             {period}
                         </span>
                         <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                             Total: R$ {data.total.toFixed(2)}
                         </span>
                     </div>
                     <div className="divide-y divide-gray-50">
                         {data.items.map((item) => {
                             const qty = parseQuantity(item.quantity);
                             const unitPrice = item.estimatedPrice || 0;
                             const totalItem = qty * unitPrice;
                             
                             return (
                                 <div key={item.id} className="p-4 hover:bg-blue-50/30 transition-colors">
                                     <div className="flex justify-between items-start">
                                         <div>
                                             <p className="font-medium text-gray-800">{item.name}</p>
                                             <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                                 <span className="bg-gray-100 px-1.5 rounded">{item.listName}</span>
                                                 <span>•</span>
                                                 <span>{new Date(item.purchasedAt || 0).toLocaleDateString('pt-BR')}</span>
                                             </div>
                                         </div>
                                         <div className="text-right">
                                             <p className="font-bold text-gray-700">R$ {totalItem.toFixed(2)}</p>
                                             {unitPrice > 0 && (
                                                <p className="text-[10px] text-gray-400">
                                                    {item.quantity ? item.quantity : '1'} x R$ {unitPrice.toFixed(2)}
                                                </p>
                                             )}
                                         </div>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             ))
          )}
       </div>
    </div>
  );
};

export default ItemHistory;