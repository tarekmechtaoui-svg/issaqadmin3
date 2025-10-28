import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import Sidebar from "./Sidebar";
import Orders from "./Orders";
import Products from "./Products";
import Categories from "./Categories";
import DashboardHome from "./DashboardHome";
import Login from "../components/login";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  if (loading) {
    return <p>Checking Authentication...</p>;
  }

  if (!user) {
    return <Login onLogin={() => {
      setUser(true);
      setActiveTab("dashboard");
    }} />;
  }

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="dashboard">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} logout={logout} />
      <div className="dashboard-content">
        {activeTab === "dashboard" && <DashboardHome />}
        {activeTab === "orders" && <Orders />}
        {activeTab === "products" && <Products />}
        {activeTab === "categories" && <Categories />}
      </div>
    </div>
  );
}
