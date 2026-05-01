import { useState, useEffect } from 'react';
import { getCategories, updateProduct } from '../services/api';
import { Producto } from '../types';
import './EditProductModal.css';

interface Category { id: number; name: string; slug: string | null }

interface Props {
  producto: Producto;
  token: string;
  onClose: () => void;
  onSaved: (updated: Producto) => void;
}

export default function EditProductModal({ producto, token, onClose, onSaved }: Props) {
  const [title, setTitle]           = useState(producto.title);
  const [description, setDescription] = useState(producto.description ?? '');
  const [price, setPrice]           = useState(String(producto.price));
  const [brand, setBrand]           = useState(producto.brand ?? '');
  const [size, setSize]             = useState(producto.size);
  const [condition, setCondition]   = useState(producto.condition);
  const [status, setStatus]         = useState(producto.status);
  const [imageUrl, setImageUrl]     = useState(producto.image_url ?? '');
  const [categoryId, setCategoryId] = useState(String(producto.category_id ?? ''));
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    getCategories().then(data => { if (data) setCategories(data); });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const updated = await updateProduct(producto.id, {
      title,
      description: description || null,
      price: parseFloat(price),
      brand,
      size,
      condition: condition as Producto['condition'],
      status: status as Producto['status'],
      category_id: parseInt(categoryId),
    }, token);

    setSaving(false);

    if (updated) {
      onSaved({ ...updated, image_url: imageUrl });
    } else {
      setError('No se pudo guardar. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-modal__header">
          <h2 className="edit-modal__title">Editar prenda</h2>
          <button className="edit-modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-modal__form">
          <input
            className="form-input span-2" type="text" placeholder="Título" required
            value={title} onChange={e => setTitle(e.target.value)}
          />

          <input
            className="form-input" type="text" placeholder="Marca" required
            value={brand} onChange={e => setBrand(e.target.value)}
          />

          <input
            className="form-input" type="number" step="0.01" placeholder="Precio (€)" required
            value={price} onChange={e => setPrice(e.target.value)}
          />

          <select className="form-input" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
            <option value="" disabled>Categoría...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select className="form-input" value={size} onChange={e => setSize(e.target.value)} required>
            <option value="" disabled>Talla...</option>
            {['XS','S','M','L','XL','XXL','Única'].map(s => (
              <option key={s} value={s === 'Única' ? 'Talla Única' : s}>{s === 'Única' ? 'Talla Única' : s}</option>
            ))}
          </select>

          <select className="form-input" value={condition} onChange={e => setCondition(e.target.value as Producto['condition'])} required>
            <option value="" disabled>Condición...</option>
            {['Sin usar','Usado','Buen estado','Excelente','Como nuevo'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select className="form-input" value={status} onChange={e => setStatus(e.target.value as Producto['status'])} required>
            <option value="Disponible">Disponible</option>
            <option value="Reservado">Reservado</option>
            <option value="Vendido">Vendido</option>
          </select>

          <input
            className="form-input span-2" type="url" placeholder="URL de la imagen"
            value={imageUrl} onChange={e => setImageUrl(e.target.value)}
          />

          <textarea
            className="form-input span-2" rows={3} placeholder="Descripción..."
            value={description} onChange={e => setDescription(e.target.value)}
          />

          {error && <p className="edit-modal__error span-2">{error}</p>}

          <div className="edit-modal__actions span-2">
            <button type="button" className="edit-modal__btn-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary edit-modal__btn-save" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
