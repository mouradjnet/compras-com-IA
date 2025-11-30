import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingBag, LogOut } from 'lucide-react';
import { User, ShoppingList } from '../types';
import { db } from '../services/db';

interface DashboardProps {
  user: User;
  onSelectList: (list: ShoppingList) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onSelectList, onLogout }) => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    setLists(db.getLists(user.id));
  }, [user.id]);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    db.createList(user.id, newListName);
    setLists(db.getLists(user.id));
    setNewListName('');
    setIsCreating(false);
  };

  const handleDeleteList = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta lista?')) {
      db.deleteList(id);
      setLists(db.getLists(user.id));
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 py-6 border-b border-gray-100 flex items-center justify-between">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Minhas Listas</h1>
           <p className="text-gray-500 text-sm">Olá, {user.name}</p>
        </div>
        <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-lg">
           <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Create New Card */}
          <div 
             onClick={() => setIsCreating(true)}
             className="bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-100 transition-colors min-h-[160px]"
          >
             {!isCreating ? (
                 <>
                    <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mb-3 text-blue-600">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-blue-800">Nova Lista</span>
                 </>
             ) : (
                 <form onSubmit={handleCreateList} className="w-full" onClick={(e) => e.stopPropagation()}>
                    <input 
                        autoFocus
                        type="text" 
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Nome da lista..."
                        className="w-full px-3 py-2 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-400 outline-none mb-2 text-center"
                    />
                    <div className="flex space-x-2">
                        <button type="submit" className="flex-1 bg-blue-600 text-white py-1 rounded-lg text-sm font-medium">Criar</button>
                        <button type="button" onClick={() => setIsCreating(false)} className="flex-1 bg-gray-200 text-gray-700 py-1 rounded-lg text-sm font-medium">Cancelar</button>
                    </div>
                 </form>
             )}
          </div>

          {/* List Cards */}
          {lists.map(list => (
            <div 
                key={list.id} 
                onClick={() => onSelectList(list)}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between group min-h-[160px]"
            >
                <div className="flex items-start justify-between">
                    <div className="bg-blue-100 p-3 rounded-xl text-blue-600 mb-4">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <button 
                        onClick={(e) => handleDeleteList(e, list.id)} 
                        className="text-gray-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
                
                <div>
                    <h3 className="font-bold text-lg text-gray-800 mb-1">{list.name}</h3>
                    <p className="text-xs text-gray-400">
                        Criada em {new Date(list.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;