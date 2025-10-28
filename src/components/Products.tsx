import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Trash } from 'lucide-react';
import '../styles/products.css';

interface Product {
  id: string;
  title: string;
  category_id: string;
  price: number;
  stock_quantity: number;
  description?: string;
  images?: string[];
}

interface Category {
  id: string;
  name: string;
}

interface ProductFormData {
  title: string;
  category_id: string;
  price: string;
  stock_quantity: string;
  description: string;
  images: string[];
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    title: '',
    category_id: '',
    price: '',
    stock_quantity: '',
    description: '',
    images: []
  });
  const [errors, setErrors] = useState<Partial<ProductFormData>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const [p, c] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name')
    ]);
    if (p.data) setProducts(p.data);
    if (c.data) setCategories(c.data);
    setLoading(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProductFormData> = {};
    if (!formData.title.trim()) newErrors.title = 'Required';
    if (!formData.category_id) newErrors.category_id = 'Required';
    if (!formData.price || +formData.price <= 0) newErrors.price = 'Invalid';
    if (!formData.stock_quantity || +formData.stock_quantity < 0) newErrors.stock_quantity = 'Invalid';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        category_id: product.category_id,
        price: product.price.toString(),
        stock_quantity: product.stock_quantity.toString(),
        description: product.description || '',
        images: product.images || []
      });
    } else {
      setEditingProduct(null);
      setFormData({
        title: '',
        category_id: '',
        price: '',
        stock_quantity: '',
        description: '',
        images: []
      });
    }
    setShowModal(true);
  };

  const uploadImages = async (files: FileList): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of Array.from(files)) {
      const safeFileName = encodeURIComponent(`${Date.now()}-${file.name}`);
      const filePath = `products/${safeFileName}`;

      const { data, error } = await supabase.storage
        .from('issaqimages')
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.error('Upload error:', error.message);
        continue;
      }

      if (data) {
        const { data: publicUrlData } = supabase.storage
          .from('issaqimages')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }
    return uploadedUrls;
  };


  const handleImageRemove = (index: number) => {
    const updated = [...formData.images];
    updated.splice(index, 1);
    setFormData({ ...formData, images: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const productData = {
      title: formData.title.trim(),
      category_id: formData.category_id,
      price: +formData.price,
      stock_quantity: +formData.stock_quantity,
      description: formData.description.trim(),
      images: formData.images,
      slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };

    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id);
    } else {
      await supabase.from('products').insert([productData]);
    }

    fetchProducts();
    setShowModal(false);
  };

  if (loading)
    return <div className="table-container"><p>Loading...</p></div>;

  return (
    <div className="table-container">
      <div className="table-header">
        <h1>Products Management</h1>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          Add New Product
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Price (DZD)</th>
            <th>Stock</th>
            <th>Images</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr><td colSpan={6}>No products found</td></tr>
          ) : (
            products.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{categories.find(c => c.id === p.category_id)?.name}</td>
                <td>{p.price} DZD</td>
                <td>{p.stock_quantity}</td>
                <td>
                  {p.images?.slice(0, 1).map((img, i) => (
                    <img key={i} src={img} alt="" width="40" height="40" style={{ borderRadius: 6 }} />
                  ))}
                </td>
                <td>
                  <button className="btn-edit" onClick={() => handleOpenModal(p)}>
                    Edit
                  </button>
                  <button className="btn-delete" onClick={() => supabase.from('products').delete().eq('id', p.id).then(fetchProducts)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">

              {/* Title */}
              <label>Product Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />

              {/* Category */}
              <label>Category *</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                <option value="">Choose</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Price - Stock */}
              <div className="form-row">
                <div>
                  <label>Price *</label>
                  <input
                    type="number"
                    value={formData.price}
                    step="0.01"
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div>
                  <label>Stock *</label>
                  <input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <label>Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              ></textarea>

              {/* Image Upload */}
              <label>Product Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={async (e) => {
                  if (e.target.files) {
                    const urls = await uploadImages(e.target.files);
                    setFormData({ ...formData, images: [...formData.images, ...urls] });
                  }
                }}
              />

              {/* Thumbnails */}
              <div className="image-preview-area">
                {formData.images.map((img, i) => (
                  <div key={i} className="image-thumb">
                    <img src={img} alt="" />
                    <button type="button" onClick={() => handleImageRemove(i)}>
                      <Trash size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowModal(false)} type="button">Cancel</button>
                <button className="btn-primary" type="submit">{editingProduct ? "Update" : "Add"}</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Products;
