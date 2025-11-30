import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ShoppingList from './components/ShoppingList';
import { db } from './services/db';
import { User, ShoppingList as ShoppingListType, ViewState } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('LOGIN');
  const [selectedList, setSelectedList] = useState<ShoppingListType | null>(null);

  useEffect(() => {
    // Check for existing session
    const currentUser = db.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setCurrentView('DASHBOARD');
    }
  }, []);

  const handleLogin = () => {
    const newUser = db.login();
    setUser(newUser);
    setCurrentView('DASHBOARD');
  };

  const handleLogout = () => {
    db.logout();
    setUser(null);
    setCurrentView('LOGIN');
    setSelectedList(null);
  };

  const handleSelectList = (list: ShoppingListType) => {
    setSelectedList(list);
    setCurrentView('LIST_DETAIL');
  };

  const handleBackToDashboard = () => {
    setSelectedList(null);
    setCurrentView('DASHBOARD');
  };

  // Rendering logic based on state
  if (!user || currentView === 'LOGIN') {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-4xl bg-white shadow-xl min-h-screen sm:min-h-0 sm:h-[90vh] sm:my-[5vh] sm:rounded-3xl overflow-hidden relative">
        {currentView === 'DASHBOARD' && (
          <Dashboard 
            user={user} 
            onSelectList={handleSelectList}
            onLogout={handleLogout}
          />
        )}

        {currentView === 'LIST_DETAIL' && selectedList && (
          <ShoppingList 
            list={selectedList}
            onBack={handleBackToDashboard}
          />
        )}
      </div>
    </div>
  );
}

export default App;