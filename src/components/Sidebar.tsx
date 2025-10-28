import React from 'react';
import { MenuItem } from '../types';
import { supabase } from '../lib/supabase';
import '../styles/Sidebar.css';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: 'dashboard' | 'orders' | 'products' | 'categories') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems: MenuItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'orders', label: 'Orders', icon: '📦' },
    { key: 'products', label: 'Products', icon: '🛍️' },
    { key: 'categories', label: 'Categories', icon: '📑' }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item: MenuItem) => (
          <button
            key={item.key}
            className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
            onClick={() => setActiveTab(item.key as any)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button
          onClick={handleLogout}
          className="logout-button"
        >
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;