import React, { useState, useEffect } from 'react';
import { X, ScanBarcode, Sparkles, Loader2 } from 'lucide-react';
import { db } from '../services/db';
import { suggestCategory, lookupProductByBarcodeAI } from '../services/ai';
import Scanner from './Scanner';
import { Product } from '../types';

interface AddItemModalProps {
  listId: string;
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: () => void;
}

const AddItemModal: React.FC<AddItemModalProps> = ({ listId, isOpen, onClose, onItemAdded }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const [barcode, setBarcode] = useState('');
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setName('');
      setQuantity('');
      setCategory('');
      setEstimatedPrice('');
      setBarcode('');
      setSuggestions([]);
    }
  }, [isOpen]);

  // AI Suggest Category on name blur or debounce could go here
  const handleNameBlur = async () => {
    if (name && !category) {
        setIsLoadingAI(true);
        const suggested = await suggestCategory(name);
        if (suggested) setCategory(suggested);
        setIsLoadingAI(false);
    }
  };

  const handleAutocomplete = (prod: Product) => {
    setName(prod.name);
    setCategory(prod.category);
    setEstimatedPrice(prod.averagePrice.toString());
    setBarcode(prod.barcode);
    setSuggestions([]);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setName(val);
      if (val.length > 2) {
          const found = db.searchProducts(val);
          setSuggestions(found);
      } else {
          setSuggestions([]);
      }
  };

  const handleScan = async (code: string) => {
    setIsScannerOpen(false);
    setBarcode(code);
    setIsLoadingAI(true);
    
    // 1. Check Local DB
    const localProd = db.getProductByBarcode(code);
    if (localProd) {
        setName(localProd.name);
        setCategory(localProd.category);
        setEstimatedPrice(localProd.averagePrice.toString());
    } else {
        // 2. Check AI
        const aiProd = await lookupProductByBarcodeAI(code);
        if (aiProd) {
            setName(aiProd.name);
            setCategory(aiProd.category);
            setEstimatedPrice(aiProd.price.toString());
        }
    }
    setIsLoadingAI(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.addItem({
      listId,
      name,
      quantity,
      category: category || 'Geral',
      estimatedPrice: parseFloat(estimatedPrice) || 0,
      barcode
    });
    onItemAdded();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
      {isScannerOpen && <Scanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}
      
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-blue-50">
          <h2 className="text-lg font-bold text-blue-900">Novo Item</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Barcode Section */}
          <div className="flex items-center space-x-2 mb-2">
             <div className="relative flex-1">
                <input 
                    type="text" 
                    placeholder="Código de barras" 
                    value={barcode}
                    readOnly
                    className="w-full pl-3 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500"
                />
             </div>
             <button 
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
             >
                <ScanBarcode className="w-5 h-5 mr-1" />
                <span className="text-sm font-medium">Escanear</span>
             </button>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
            <input
              required
              type="text"
              value={name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              placeholder="Ex: Leite, Pão, Sabão..."
            />
            {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-100 rounded-xl shadow-lg mt-1 max-h-40 overflow-auto">
                    {suggestions.map(s => (
                        <li key={s.id} onClick={() => handleAutocomplete(s)} className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 flex justify-between">
                            <span>{s.name}</span>
                            <span className="text-gray-400 text-xs">{s.category}</span>
                        </li>
                    ))}
                </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <div className="relative">
                    <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="Sugestão IA"
                    />
                     {isLoadingAI && <div className="absolute right-3 top-3"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>}
                     {!isLoadingAI && category && <div className="absolute right-3 top-3 text-blue-400"><Sparkles className="w-4 h-4" /></div>}
                </div>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                <input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
                placeholder="Ex: 2 cx, 4kg"
                />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preço Unitário (R$)</label>
            <input
              type="number"
              step="0.01"
              value={estimatedPrice}
              onChange={(e) => setEstimatedPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
              placeholder="0.00"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-2"
          >
            Adicionar à Lista
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;