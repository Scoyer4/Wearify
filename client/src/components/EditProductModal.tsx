import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getCategories, updateProduct } from '../services/api';
import { Producto } from '../types';
import { CustomSelect } from './CustomSelect/CustomSelect';
import './EditProductModal.css';
import './CreateProductForm.css';

interface Category { id: number; name: string; slug: string | null }
interface Props { producto: Producto; token: string; onClose: () => void; onSaved: (updated: Producto) => void; }

const SHOE_KEYWORDS   = ['zapato', 'zapatilla', 'calzado', 'bota', 'sandalia', 'sneaker'];
const ACCESS_KEYWORDS = ['accesorio', 'bolso', 'bolsa', 'gorra', 'cinturón', 'cinturon',
                         'sombrero', 'joya', 'bisutería', 'bisuteria', 'complemento', 'gorro'];
const SUIT_KEYWORDS   = ['traje'];
const MAX_PHOTOS = 4;

function getSizeOptions(cat: Category | undefined): string[] {
  if (!cat) return [];
  const text = `${cat.name} ${cat.slug ?? ''}`.toLowerCase();
  if (SHOE_KEYWORDS.some(k => text.includes(k)))   return ['35','36','37','38','39','40','41','42','43','44','45','46'];
  if (ACCESS_KEYWORDS.some(k => text.includes(k))) return ['Única'];
  if (SUIT_KEYWORDS.some(k => text.includes(k)))   return ['36','38','40','42','44','46','48','50'];
  return ['XS','S','M','L','XL','XXL'];
}

type SlotItem =
  | { type: 'kept'; url: string; index: number }
  | { type: 'new';  preview: string; index: number };

export default function EditProductModal({ producto, token, onClose, onSaved }: Props) {
  const [title,       setTitle]       = useState(producto.title);
  const [description, setDescription] = useState(producto.description ?? '');
  const [price,       setPrice]       = useState(String(producto.price));
  const [brand,       setBrand]       = useState(producto.brand ?? '');
  const [size,        setSize]        = useState(producto.size);
  const [condition,   setCondition]   = useState(producto.condition);
  const [gender,      setGender]      = useState(producto.gender ?? '');
  const [categoryId,  setCategoryId]  = useState(String(producto.category_id ?? ''));
  const [categories,  setCategories]  = useState<Category[]>([]);

  const initialImages = producto.images?.length
    ? producto.images
    : producto.image_url ? [producto.image_url] : [];
  const [keptImages, setKeptImages] = useState<string[]>(initialImages);
  const [newEntries, setNewEntries] = useState<{ file: File; preview: string }[]>([]);

  const [uploading, setUploading] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCategories().then(data => { if (data) setCategories(data); });
  }, []);

  const selectedCategory = categories.find(c => c.id === parseInt(categoryId));
  const sizeOptions      = getSizeOptions(selectedCategory);

  const handleCategoryChange = (value: string) => {
    setCategoryId(value);
    setSize('');
  };

  const totalImages = keptImages.length + newEntries.length;

  const allSlots: SlotItem[] = [
    ...keptImages.map((url, index) => ({ type: 'kept' as const, url, index })),
    ...newEntries.map((entry, index) => ({ type: 'new' as const, preview: entry.preview, index })),
  ];

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    setNewEntries(prev => {
      const remaining = MAX_PHOTOS - (keptImages.length + prev.length);
      if (remaining <= 0) return prev;
      const entries = valid.slice(0, remaining).map(f => ({ file: f, preview: URL.createObjectURL(f) }));
      return [...prev, ...entries];
    });
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

    const uploadedUrls: string[] = [];

    if (newEntries.length > 0) {
      setUploading(true);
      for (let i = 0; i < newEntries.length; i++) {
        const { file } = newEntries[i];
        const ext  = file.name.split('.').pop();
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
      brand, size, condition, gender: gender || null,
      category_id: parseInt(categoryId),
      image_urls: finalUrls,
    }, token);

    setSaving(false);
    if (updated) {
      onSaved({ ...updated, image_url: finalUrls[0] ?? null, images: finalUrls });
    } else {
      setError('No se pudo guardar. Inténtalo de nuevo.');
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="edit-modal">

        <div className="edit-modal__header">
          <h2 className="edit-modal__title">Editar prenda</h2>
          <button className="edit-modal__close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="edit-modal__body">
          <form onSubmit={handleSubmit} className="cpf-form">

            {/* ── Zona de fotos ─────────────────────── */}
            <div
              className="cpf-photo-zone"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            >
              <div className="cpf-photo-slots">
                {[0, 1, 2, 3].map(i => {
                  const slot = allSlots[i];
                  const imgSrc = slot ? (slot.type === 'kept' ? slot.url : slot.preview) : null;
                  return imgSrc ? (
                    <div key={i} className="cpf-slot cpf-slot--filled">
                      <img src={imgSrc} alt={`Foto ${i + 1}`} />
                      {i === 0 && <span className="cpf-slot-badge">Principal</span>}
                      <button
                        type="button"
                        className="cpf-slot-remove"
                        onClick={e => {
                          e.stopPropagation();
                          if (slot.type === 'kept') removeKept(slot.index);
                          else removeNew(slot.index);
                        }}
                        aria-label="Eliminar foto"
                      >✕</button>
                    </div>
                  ) : (
                    <button
                      key={i}
                      type="button"
                      className="cpf-slot cpf-slot--empty"
                      onClick={() => inputRef.current?.click()}
                      disabled={totalImages >= MAX_PHOTOS}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span className="cpf-slot-text">Añadir foto</span>
                      {i === 0 && <span className="cpf-slot-principal">Principal</span>}
                    </button>
                  );
                })}
              </div>
              <p className="cpf-photo-hint">Añade hasta 4 fotos · La primera será la foto principal</p>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
              />
            </div>

            {/* ── Título ───────────────────────────── */}
            <input
              type="text"
              placeholder="Título (ej. Camiseta Nike Vintage)"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="cpf-input"
            />

            {/* ── Marca | Precio ───────────────────── */}
            <div className="cpf-row">
              <input
                type="text"
                placeholder="Marca (ej. Nike, Zara, Levis)"
                required
                value={brand}
                onChange={e => setBrand(e.target.value)}
                className="cpf-input"
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Precio (€)"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="cpf-input"
              />
            </div>

            {/* ── Categoría | Talla ────────────────── */}
            <div className="cpf-row">
              <CustomSelect
                options={categories.map(cat => ({ value: String(cat.id), label: cat.name }))}
                value={categoryId}
                onChange={handleCategoryChange}
                placeholder="Categoría..."
              />
              <CustomSelect
                options={sizeOptions.map(s => ({ value: s, label: s }))}
                value={size ?? ''}
                onChange={setSize}
                placeholder={categoryId ? 'Talla...' : 'Selecciona primero una categoría'}
                disabled={!categoryId}
              />
            </div>

            {/* ── Condición | Género ───────────────── */}
            <div className="cpf-row">
              <CustomSelect
                options={['Sin usar', 'Como nuevo', 'Excelente', 'Buen estado', 'Usado'].map(c => ({ value: c, label: c }))}
                value={condition ?? ''}
                onChange={v => setCondition(v as Producto['condition'])}
                placeholder="Condición de la prenda..."
              />
              <CustomSelect
                options={['Mujer', 'Hombre', 'Niños', 'Unisex'].map(g => ({ value: g, label: g }))}
                value={gender}
                onChange={setGender}
                placeholder="Para quién es..."
              />
            </div>

            {/* ── Descripción ──────────────────────── */}
            <textarea
              placeholder="Describe la prenda, posibles defectos, medidas..."
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="cpf-input cpf-textarea"
            />

            {error && (
              <p className={`cpf-message cpf-message--err`}>{error}</p>
            )}

            {/* ── Acciones ─────────────────────────── */}
            <div className="edit-modal__actions">
              <button type="button" className="btn-secondary edit-modal__btn-save" onClick={onClose} disabled={saving || uploading}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary edit-modal__btn-save" disabled={saving || uploading}>
                {uploading ? 'Subiendo imágenes...' : saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
