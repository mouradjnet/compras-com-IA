import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingBag, LogOut, TrendingUp, ListChecks, DollarSign, Calendar, Archive, History, Clock } from 'lucide-react';
import { User, ShoppingList, Item } from '../types';
import { db } from '../services/db';

interface DashboardProps {
  user: User;
  onSelectList: (list: ShoppingList) => void;
  onLogout: () => void;
  onViewHistory: () => void;
}

// Helper duplicated from ShoppingList to ensure consistent calculations in dashboard stats
const parseQuantity = (qtyStr?: string): number => {
  if (!qtyStr) return 1;
  const normalized = qtyStr.replace(',', '.');
  const match = normalized.match(/(\d+(\.\d+)?)/);
  const val = match ? parseFloat(match[0]) : 1;
  return isNaN(val) || val <= 0 ? 1 : val;
};

const Dashboard: React.FC<DashboardProps> = ({ user, onSelectList, onLogout, onViewHistory }) => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  // Stats state
  const [stats, setStats] = useState({
    totalLists: 0,
    pendingItems: 0,
    totalEstimatedPending: 0
  });

  const refreshData = () => {
    const userLists = db.getLists(user.id);
    setLists(userLists);

    // Calculate stats (Global stats for active lists)
    let pendingCount = 0;
    let pendingCost = 0;

    userLists.filter(l => l.status !== 'archived').forEach(list => {
      const items = db.getItems(list.id);
      items.forEach(item => {
        if (!item.completed) {
          pendingCount++;
          const qty = parseQuantity(item.quantity);
          const price = item.estimatedPrice || 0;
          pendingCost += (qty * price);
        }
      });
    });

    setStats({
      totalLists: userLists.filter(l => l.status !== 'archived').length,
      pendingItems: pendingCount,
      totalEstimatedPending: pendingCost
    });
  };

  useEffect(() => {
    refreshData();
  }, [user.id]);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    db.createList(user.id, newListName);
    setNewListName('');
    setIsCreating(false);
    refreshData();
  };

  const handleDeleteList = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir esta lista?')) {
      db.deleteList(id);
      refreshData();
    }
  };

  const filteredLists = lists.filter(l => 
    activeTab === 'active' ? l.status !== 'archived' : l.status === 'archived'
  );

  return (
    <div className="h-full flex flex-col bg-gray-50/50">
      {/* Top Navigation */}
      <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3">
           <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
             {user.name.charAt(0)}
           </div>
           <div>
              <p className="text-xs text-gray-400 font-medium">Bem-vindo,</p>
              <h2 className="text-sm font-bold text-gray-800 leading-tight">{user.name}</h2>
           </div>
        </div>
        <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-xl hover:bg-red-50">
           <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
        
        {/* Statistics Cards - Only show on Active tab */}
        {activeTab === 'active' && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-200">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <span className="bg-blue-800/40 text-[10px] font-bold px-2 py-1 rounded-full border border-white/10">PENDENTE</span>
                    </div>
                    <div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Total Estimado</p>
                        <h3 className="text-3xl font-bold tracking-tight">R$ {stats.totalEstimatedPending.toFixed(2)}</h3>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-500">
                            <ShoppingBag className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm font-medium">Itens a comprar</p>
                        <h3 className="text-2xl font-bold text-gray-800">{stats.pendingItems} <span className="text-sm font-normal text-gray-400">itens</span></h3>
                    </div>
                </div>

                <div 
                    onClick={onViewHistory}
                    className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between cursor-pointer hover:bg-blue-50 transition-colors group"
                >
                    <div className="flex items-start justify-between mb-2">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            <History className="w-6 h-6" />
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm font-medium group-hover:text-blue-500">Histórico Geral</p>
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">Ver Itens Comprados</h3>
                    </div>
                </div>
            </section>
        )}

        {/* Lists Section */}
        <section>
            <div className="flex items-center justify-between mb-4">
                <div className="flex space-x-1 bg-gray-200 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Listas Ativas
                    </button>
                    <button 
                        onClick={() => setActiveTab('archived')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'archived' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Archive className="w-4 h-4" />
                        Histórico
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Create New List Button - Only in Active Tab */}
                {activeTab === 'active' && (
                    <div 
                        onClick={() => setIsCreating(true)}
                        className={`
                            relative overflow-hidden rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 
                            flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-all duration-300
                            ${isCreating ? 'p-4' : 'p-6 min-h-[160px]'}
                        `}
                    >
                        {!isCreating ? (
                            <>
                                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 text-blue-500 group-hover:scale-110 transition-transform">
                                    <Plus className="w-7 h-7" />
                                </div>
                                <span className="font-semibold text-blue-700">Criar Nova Lista</span>
                            </>
                        ) : (
                            <form onSubmit={handleCreateList} className="w-full z-10" onClick={(e) => e.stopPropagation()}>
                                <label className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2 block">Nome da Lista</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={newListName}
                                    onChange={(e) => setNewListName(e.target.value)}
                                    placeholder="Ex: Churrasco, Mês..."
                                    className="w-full px-4 py-3 rounded-xl border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none mb-3 text-center font-medium placeholder-blue-200/50"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setIsCreating(false)} className="bg-white text-gray-500 py-2 rounded-lg text-sm font-bold hover:bg-gray-50">Cancelar</button>
                                    <button type="submit" className="bg-blue-600 text-white py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700">Criar</button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                {/* List Items */}
                {filteredLists.length === 0 && !isCreating && (
                    <div className="col-span-full py-10 text-center text-gray-400">
                        <p>{activeTab === 'active' ? 'Nenhuma lista ativa.' : 'Nenhuma lista arquivada.'}</p>
                    </div>
                )}

                {filteredLists.map(list => (
                    <div 
                        key={list.id} 
                        onClick={() => onSelectList(list)}
                        className={`p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between group min-h-[160px] relative overflow-hidden ${activeTab === 'archived' ? 'bg-gray-50' : 'bg-white'}`}
                    >
                        {/* Decorative background element */}
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-8 -mt-8 z-0 opacity-50 ${activeTab === 'archived' ? 'bg-gray-200' : 'bg-gradient-to-br from-blue-50 to-blue-100'}`}></div>

                        <div className="flex items-start justify-between relative z-10">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'archived' ? 'bg-gray-200 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
                                {activeTab === 'archived' ? <Archive className="w-5 h-5" /> : <ListChecks className="w-5 h-5" />}
                            </div>
                            <button 
                                onClick={(e) => handleDeleteList(e, list.id)} 
                                className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <div className="relative z-10 mt-4">
                            <h3 className={`font-bold text-lg leading-snug mb-1 group-hover:text-blue-600 transition-colors ${activeTab === 'archived' ? 'text-gray-500' : 'text-gray-800'}`}>{list.name}</h3>
                            <div className="flex flex-col text-xs text-gray-400 font-medium space-y-1">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Criada: {new Date(list.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                                {list.completedAt && (
                                    <span className="flex items-center gap-1 text-green-600">
                                        <Clock className="w-3 h-3" />
                                        Finalizada: {new Date(list.completedAt).toLocaleDateString('pt-BR')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;