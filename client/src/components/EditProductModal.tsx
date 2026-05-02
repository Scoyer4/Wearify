import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getCategories, updateProduct } from '../services/api';
import { Producto } from '../types';
import './EditProductModal.css';

interface Category { id: number; name: string; slug: string | null }
interface Props { producto: Producto; token: string; onClose: () => void; onSaved: (updated: Producto) => void; }

export default function EditProductModal({ producto, token, onClose, onSaved }: Props) {
  const [title, setTitle]             = useState(producto.title);
  const [description, setDescription] = useState(producto.description ?? '');
  const [price, setPrice]             = useState(String(producto.price));
  const [brand, setBrand]             = useState(producto.brand ?? '');
  const [size, setSize]               = useState(producto.size);
  const [condition, setCondition]     = useState(producto.condition);
  const [status, setStatus]           = useState(producto.status);
  const [categoryId, setCategoryId]   = useState(String(producto.category_id ?? ''));
  const [categories, setCategories]   = useState<Category[]>([]);

  // Imágenes ya guardadas que queremos conservar
  const initialImages = producto.images?.length
    ? producto.images
    : producto.image_url ? [producto.image_url] : [];
  const [keptImages, setKeptImages]   = useState<string[]>(initialImages);

  // Nuevos archivos a subir
  const [newEntries, setNewEntries]   = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCategories().then(data => { if (data) setCategories(data); });
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    setNewEntries(prev => [...prev, ...valid.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]);
  };

  const removeKept = (index: number) => setKeptImages(prev => prev.filter((_, i) => i !== index));
  const removeNew  = (index: number) => setNewEntries(prev => {
    URL.revokeObjectURL(prev[index].preview);
    return prev.filter((_, i) => i !== index);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    let uploadedUrls: string[] = [];

    if (newEntries.length > 0) {
      setUploading(true);
      for (let i = 0; i < newEntries.length; i++) {
        const { file } = newEntries[i];
        const ext = file.name.split('.').pop();
        const path = `${producto.id}_${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('products').upload(path, file, { upsert: true });
        if (uploadError) {
          setError(`Error al subir imagen ${i + 1}: ${uploadError.message}`);
          setSaving(false); setUploading(false); return;
        }
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(path);
        uploadedUrls.push(`${urlData.publicUrl}?t=${Date.now()}`);
      }
      setUploading(false);
    }

    const finalUrls = [...keptImages, ...uploadedUrls];

    const updated = await updateProduct(producto.id, {
      title, description: description || null, price: parseFloat(price),
      brand, size, condition: condition as Producto['condition'],
      status: status as Producto['status'], category_id: parseInt(categoryId),
      image_urls: finalUrls,
    } as any, token);

    setSaving(false);
    if (updated) {
      onSaved({ ...updated, image_url: finalUrls[0] ?? null, images: finalUrls });
    } else {
      setError('No se pudo guardar. Inténtalo de nuevo.');
    }
  };

  const totalImages = keptImages.length + newEntries.length;

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-modal__header">
          <h2 className="edit-modal__title">Editar prenda</h2>
          <button className="edit-modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-modal__form">
          <input className="form-input span-2" type="text" placeholder="Título" required
            value={title} onChange={e => setTitle(e.target.value)} />

          <input className="form-input" type="text" placeholder="Marca" required
            value={brand} onChange={e => setBrand(e.target.value)} />

          <input className="form-input" type="number" step="0.01" placeholder="Precio (€)" required
            value={price} onChange={e => setPrice(e.target.value)} />

          <select className="form-input" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
            <option value="" disabled>Categoría...</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>

          <select className="form-input" value={size} onChange={e => setSize(e.target.value)} required>
            <option value="" disabled>Talla...</option>
            {['XS','S','M','L','XL','XXL'].map(s => <option key={s} value={s}>{s}</option>)}
            <option value="Talla Única">Talla Única</option>
          </select>

          <select className="form-input" value={condition} onChange={e => setCondition(e.target.value as Producto['condition'])} required>
            <option value="" disabled>Condición...</option>
            {['Sin usar','Usado','Buen estado','Excelente','Como nuevo'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select className="form-input" value={status} onChange={e => setStatus(e.target.value as Producto['status'])} required>
            <option value="Disponible">Disponible</option>
            <option value="Reservado">Reservado</option>
            <option value="Vendido">Vendido</option>
          </select>

          {/* Gestor de imágenes */}
          <div className="multi-image-picker span-2">
            {keptImages.map((url, i) => (
              <div key={`kept-${i}`} className="multi-image-thumb">
                <img src={url} alt={`Foto ${i + 1}`} />
                {i === 0 && <span className="multi-image-badge">Principal</span>}
                <button type="button" className="multi-image-remove" onClick={() => removeKept(i)} title="Eliminar">✕</button>
              </div>
            ))}
            {newEntries.map((entry, i) => (
              <div key={`new-${i}`} className="multi-image-thumb">
                <img src={entry.preview} alt={`Nueva ${i + 1}`} />
                <button type="button" className="multi-image-remove" onClick={() => removeNew(i)} title="Eliminar">✕</button>
              </div>
            ))}
            <button type="button" className="multi-image-add"
              onClick={() => inputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>{totalImages === 0 ? 'Añadir fotos' : '+ Más fotos'}</span>
            </button>
            <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
              onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
          </div>

          <textarea className="form-input span-2" rows={3} placeholder="Descripción..."
            value={description} onChange={e => setDescription(e.target.value)} />

          {error && <p className="edit-modal__error span-2">{error}</p>}

          <div className="edit-modal__actions span-2">
            <button type="button" className="edit-modal__btn-cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary edit-modal__btn-save" disabled={saving || uploading}>
              {uploading ? 'Subiendo imágenes...' : saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
