import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Check, Trash2, Archive, CheckCircle2 } from 'lucide-react';
import { ShoppingList as ListType, Item } from '../types';
import { db } from '../services/db';
import AddItemModal from './AddItemModal';

interface ShoppingListProps {
  list: ListType;
  onBack: () => void;
}

// Helper to extract numeric quantity from string (e.g. "2kg" -> 2, "4 un" -> 4)
const parseQuantity = (qtyStr?: string): number => {
  if (!qtyStr) return 1;
  // Replace comma with dot for international format parsing
  const normalized = qtyStr.replace(',', '.');
  // extract first numeric sequence (integer or decimal)
  const match = normalized.match(/(\d+(\.\d+)?)/);
  const val = match ? parseFloat(match[0]) : 1;
  // Default to 1 if no number found or number is 0
  return isNaN(val) || val <= 0 ? 1 : val;
};

const ShoppingList: React.FC<ShoppingListProps> = ({ list, onBack }) => {
  const [items, setItems] = useState<Item[]>([]);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isArchived, setIsArchived] = useState(list.status === 'archived');

  useEffect(() => {
    refreshItems();
  }, [list.id]);

  const refreshItems = () => {
    setItems(db.getItems(list.id));
  };

  const handleToggle = (id: string) => {
    if (isArchived) return; // Read only if archived
    db.toggleItem(id);
    refreshItems();
  };

  const handleDelete = (id: string) => {
    if (isArchived) return;
    if(confirm('Remover este item?')) {
        db.deleteItem(id);
        refreshItems();
    }
  };

  const handleArchiveList = () => {
      if (confirm('Deseja finalizar esta lista? Ela será movida para o histórico.')) {
          db.archiveList(list.id);
          setIsArchived(true);
          onBack(); // Go back to dashboard
      }
  };

  const handleUnarchiveList = () => {
      if (confirm('Reabrir esta lista? Ela voltará para a aba de ativas.')) {
          db.unarchiveList(list.id);
          setIsArchived(false);
          onBack();
      }
  };

  // Group items and calculate totals
  const { pending, completed, total, totalPending, totalCompleted } = useMemo(() => {
    const pending = items.filter(i => !i.completed);
    const completed = items.filter(i => i.completed);
    
    const getItemTotal = (item: Item) => {
        const qty = parseQuantity(item.quantity);
        const price = item.estimatedPrice || 0;
        return qty * price;
    };

    const calcSum = (itemList: Item[]) => itemList.reduce((acc, curr) => acc + getItemTotal(curr), 0);
    
    const totalPending = calcSum(pending);
    const totalCompleted = calcSum(completed);
    const total = totalPending + totalCompleted;

    return { pending, completed, total, totalPending, totalCompleted };
  }, [items]);

  const renderItem = (item: Item, isCompleted: boolean) => {
      const qty = parseQuantity(item.quantity);
      const unitPrice = item.estimatedPrice || 0;
      const totalItemPrice = unitPrice * qty;

      return (
        <div key={item.id} className={`p-3 rounded-xl border flex items-center group transition-all hover:shadow-md ${isCompleted ? 'bg-gray-100 border-gray-100' : 'bg-white border-gray-100 shadow-sm'}`}>
            <button 
                onClick={() => handleToggle(item.id)}
                disabled={isArchived}
                className={`w-6 h-6 rounded-full border-2 mr-3 flex-shrink-0 flex items-center justify-center transition-colors ${
                    isCompleted 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'border-gray-300 hover:border-blue-500'
                } ${isArchived ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isCompleted && <Check className="w-3.5 h-3.5" />}
            </button>
            
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <span className={`font-medium truncate pr-2 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                        {item.name}
                    </span>
                    
                    {unitPrice > 0 && (
                        <div className="flex flex-col items-end flex-shrink-0">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isCompleted ? 'text-gray-400 bg-gray-200' : 'text-green-700 bg-green-100'}`}>
                                R$ {totalItemPrice.toFixed(2)}
                            </span>
                        </div>
                    )}
                </div>
                
                <div className="flex justify-between items-end mt-1">
                    <div className="flex space-x-2 text-xs text-gray-500 overflow-hidden">
                        {item.quantity && <span className="bg-gray-100 px-2 py-0.5 rounded truncate max-w-[80px]">{item.quantity}</span>}
                        {item.category && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded truncate max-w-[100px]">{item.category}</span>}
                    </div>
                    
                    {/* Detailed price calculation view */}
                    {unitPrice > 0 && qty !== 1 && (
                        <span className="text-[10px] text-gray-400 ml-2">
                             {qty % 1 !== 0 ? qty.toFixed(2) : qty} x R$ {unitPrice.toFixed(2)}
                        </span>
                    )}
                </div>
            </div>

            {!isArchived && (
                <button 
                    onClick={() => handleDelete(item.id)}
                    className="ml-2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
      );
  };

  return (
    <div className="h-full flex flex-col bg-white sm:rounded-2xl shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className={`p-4 text-white flex items-center justify-between shadow-md z-10 shrink-0 ${isArchived ? 'bg-gray-600' : 'bg-blue-600'}`}>
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
                {list.name}
                {isArchived && <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-normal">Arquivada</span>}
            </h1>
            <p className="text-blue-100 text-xs opacity-80">
                {items.length} itens • {new Date(list.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {isArchived ? (
            <button onClick={handleUnarchiveList} className="p-2 hover:bg-white/10 rounded-full text-xs font-bold border border-white/30">
                Reabrir
            </button>
        ) : (
            <button onClick={handleArchiveList} className="p-2 hover:bg-white/10 rounded-full" title="Arquivar Lista">
                <Archive className="w-5 h-5" />
            </button>
        )}
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 pb-32">
        
        {/* Pending Items */}
        <div className="space-y-3">
           {pending.length === 0 && completed.length === 0 && (
               <div className="text-center py-20 text-gray-400">
                   <p>Sua lista está vazia.</p>
                   {!isArchived && <p className="text-sm">Adicione itens manualmente ou escaneie códigos.</p>}
               </div>
           )}
           
           {pending.map(item => renderItem(item, false))}
        </div>

        {/* Completed Items */}
        {completed.length > 0 && (
            <div>
                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Comprado</h3>
                <div className="space-y-2 opacity-80">
                    {completed.map(item => renderItem(item, true))}
                </div>
            </div>
        )}
      </div>

      {/* Footer Total */}
      <div className="absolute bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20">
        <div className={`flex justify-between items-end ${!isArchived ? 'mr-16' : ''}`}> 
            <div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Estimado</span>
                <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold text-blue-900">R$ {total.toFixed(2)}</span>
                </div>
            </div>
            
            {!isArchived ? (
                <div className="text-right text-sm">
                    <div className="text-gray-500">
                        Faltam: <span className="font-medium text-gray-800">R$ {totalPending.toFixed(2)}</span>
                    </div>
                    <div className="text-green-600 text-xs mt-1">
                        Carrinho: R$ {totalCompleted.toFixed(2)}
                    </div>
                </div>
            ) : (
                <div className="text-right">
                    <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                        Lista Finalizada
                    </span>
                </div>
            )}
        </div>
      </div>

      {/* Action Buttons */}
      {!isArchived && (
          <div className="absolute bottom-24 right-6 z-30 flex flex-col gap-3">
             <button
              onClick={handleArchiveList}
              className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg shadow-green-200 transition-transform active:scale-95 flex items-center justify-center w-12 h-12"
              title="Concluir Lista"
            >
              <CheckCircle2 className="w-6 h-6" />
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg shadow-blue-300 transition-transform active:scale-95 flex items-center justify-center w-14 h-14"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>
      )}

      <AddItemModal 
        listId={list.id} 
        isOpen={isAddModalOpen} 
        onClose={() => setAddModalOpen(false)}
        onItemAdded={refreshItems}
      />
    </div>
  );
};

export default ShoppingList;