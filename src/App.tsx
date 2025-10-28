import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import Login from './components/login';

function App() {
 
  const [isAuthenticated, setIsAuthenticated] = useState(false);
    console.log("isAuthenticated:", isAuthenticated);
  return (
    <BrowserRouter>
      {!isAuthenticated ? (
        <Login onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            
           
          </div>
        </CartProvider>
      )}
    </BrowserRouter>
    
  );
   
 

}

export default App;
