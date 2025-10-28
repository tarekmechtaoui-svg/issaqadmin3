import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Filter, X } from 'lucide-react';
import '../styles/Table.css';

interface OrderItem {
  name?: string;
  title?: string;
  quantity?: number;
}

interface Order {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
  items: OrderItem[];
  shipping_address: {
    wilaya?: string;
    commune?: string;
    [key: string]: any;
  };
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedItems, setSelectedItems] = useState<OrderItem[] | null>(null);

  const [filters, setFilters] = useState({
    status: '',
    customer: '',
    dateFrom: '',
    dateTo: ''
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [orders, filters]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setOrders(data);
        setFilteredOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    if (filters.status) {
      filtered = filtered.filter(order =>
        order.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    if (filters.customer) {
      filtered = filtered.filter(order =>
        order.customer_name?.toLowerCase().includes(filters.customer.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(order =>
        new Date(order.created_at) >= fromDate
      );
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order =>
        new Date(order.created_at) <= toDate
      );
    }

    setFilteredOrders(filtered);
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      customer: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const getStatusClass = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'completed': return 'status-completed';
      case 'pending': return 'status-pending';
      case 'shipped': return 'status-shipped';
      case 'processing': return 'status-processing';
      default: return 'status-default';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getItemCount = (items: OrderItem[]): number => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  const handleDelete = async (orderId: string): Promise<void> => {
    if (confirm('Are you sure you want to delete this order?')) {
      try {
        const { error } = await supabase.from('orders').delete().eq('id', orderId);
        if (error) throw error;
        await fetchOrders();
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order');
      }
    }
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  if (loading) {
    return <div className="table-container"><p>Loading...</p></div>;
  }

  return (
    <div className="table-container">
      <div className="table-header">
        <h1>Orders Management</h1>
        <div className="header-actions">
          <button
            className={`btn-filter ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filters-grid">

            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="customer">Customer</label>
              <input
                type="text"
                id="customer"
                placeholder="Search by name"
                value={filters.customer}
                onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateFrom">From Date</label>
              <input
                type="date"
                id="dateFrom"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dateTo">To Date</label>
              <input
                type="date"
                id="dateTo"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button className="btn-clear-filters" onClick={clearFilters}>
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>
      )}

      <div className="table-info">
        <p>Showing {filteredOrders.length} of {orders.length} orders</p>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Wilaya</th>
            <th>Commune</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders.length === 0 ? (
            <tr><td colSpan={8}>No orders found</td></tr>
          ) : (
            filteredOrders.map((order: Order) => (
              <tr key={order.id}>
                <td>{order.customer_name}</td>

                <td
                  className="items-click"
                  onClick={() => setSelectedItems(order.items)}
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {getItemCount(order.items)}
                </td>

                <td>${parseFloat(order.total.toString()).toFixed(2)}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>

                <td>{order.shipping_address?.wilaya || 'N/A'}</td>
                <td>{order.shipping_address?.commune || 'N/A'}</td>

                <td>{formatDate(order.created_at)}</td>

                <td>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(order.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Popup Modal */}
      {selectedItems && (
        <div className="modal-overlay" onClick={() => setSelectedItems(null)}>
          <div className="modal-box" style={{ width: '300px' }} onClick={(e) => e.stopPropagation()}>
            <h3>Order Items</h3>
            <ul>
              {selectedItems.map((item, index) => (
                <li key={index}>
                  {item.title || item.name} x {item.quantity || 1}
                </li>
              ))}
            </ul>
            <button onClick={() => setSelectedItems(null)} className="btn-close">Close</button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
