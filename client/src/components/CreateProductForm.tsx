import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { createProduct, getCategories } from '../services/api';
import { toast } from '../lib/toast';
import './CreateProductForm.css';

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface Category   { id: number; name: string; slug: string | null }
interface ImageEntry { file: File; preview: string }

// ── Constantes ─────────────────────────────────────────────────────────────────
const SHOE_KEYWORDS   = ['zapato', 'zapatilla', 'calzado', 'bota', 'sandalia', 'sneaker'];
const ACCESS_KEYWORDS = ['accesorio', 'bolso', 'bolsa', 'gorra', 'cinturón', 'cinturon',
                         'sombrero', 'joya', 'bisutería', 'bisuteria', 'complemento', 'gorro'];
const SUIT_KEYWORDS   = ['traje'];
const MAX_PHOTOS = 4;

// ── Helpers ────────────────────────────────────────────────────────────────────
function getSizeOptions(cat: Category | undefined): string[] {
  if (!cat) return [];
  const text = `${cat.name} ${cat.slug ?? ''}`.toLowerCase();
  if (SHOE_KEYWORDS.some(k => text.includes(k)))   return ['35','36','37','38','39','40','41','42','43','44','45','46'];
  if (ACCESS_KEYWORDS.some(k => text.includes(k))) return ['Única'];
  if (SUIT_KEYWORDS.some(k => text.includes(k)))   return ['36','38','40','42','44','46','48','50'];
  return ['XS','S','M','L','XL','XXL'];
}

// ── Componente ─────────────────────────────────────────────────────────────────
export const CreateProductForm = ({ onProductCreated }: { onProductCreated: () => void }) => {
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]             = useState('');
  const [brand, setBrand]             = useState('');
  const [size, setSize]               = useState('');
  const [condition, setCondition]     = useState('');
  const [gender, setGender]           = useState('');
  const [categoryId, setCategoryId]   = useState('');
  const [categories, setCategories]   = useState<Category[]>([]);
  const [images, setImages]           = useState<ImageEntry[]>([]);
  const [uploading, setUploading]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCategories().then(data => { if (data) setCategories(data); });
  }, []);

  // ── Valores derivados ───────────────────────────────────────────────────────
  const selectedCategory = categories.find(c => c.id === parseInt(categoryId));
  const sizeOptions      = getSizeOptions(selectedCategory);

  // ── Manejadores ────────────────────────────────────────────────────────────
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryId(e.target.value);
    setSize('');
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    setImages(prev => {
      const remaining = MAX_PHOTOS - prev.length;
      if (remaining <= 0) return prev;
      const entries = valid.slice(0, remaining).map(f => ({ file: f, preview: URL.createObjectURL(f) }));
      return [...prev, ...entries];
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    const doPublish = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token  = session?.access_token;
      const userId = session?.user?.id;
      if (!token || !userId) throw new Error('No estás autenticado. Inicia sesión e inténtalo de nuevo.');

      const imageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const { file } = images[i];
        const ext  = file.name.split('.').pop();
        const path = `${userId}/${Date.now()}_${i}.${ext}`;
        const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true });
        if (error) throw new Error(`Error al subir imagen ${i + 1}: ${error.message}`);
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(path);
        imageUrls.push(urlData.publicUrl);
      }

      const resultado = await createProduct({
        title, description,
        price:       parseFloat(price),
        brand, size, condition,
        gender:      gender || null,
        status:      'Disponible',
        image_urls:  imageUrls,
        category_id: parseInt(categoryId),
      }, token);

      if (!resultado) throw new Error('Hubo un error al publicar la prenda. Inténtalo de nuevo.');
    };

    const p = doPublish();
    toast.promise(p, {
      loading: 'Publicando tu prenda…',
      success: '✓ Prenda publicada con éxito',
      error:   (err) => err instanceof Error ? err.message : 'Error al publicar la prenda',
    });

    try {
      await p;
      setTitle(''); setDescription(''); setPrice(''); setBrand('');
      setSize(''); setCondition(''); setGender(''); setCategoryId('');
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
      onProductCreated();
    } catch {
      // el error ya lo muestra toast.promise
    } finally {
      setUploading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="cpf-container">
      <h3 className="cpf-title">Subir nueva prenda</h3>

      <form onSubmit={handleSubmit} className="cpf-form">

        {/* ── Zona de fotos ─────────────────────────────── */}
        <div
          className="cpf-photo-zone"
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
        >
          <div className="cpf-photo-slots">
            {[0, 1, 2, 3].map(i => {
              const img = images[i];
              return img ? (
                <div key={i} className="cpf-slot cpf-slot--filled">
                  <img src={img.preview} alt={`Foto ${i + 1}`} />
                  {i === 0 && <span className="cpf-slot-badge">Principal</span>}
                  <button
                    type="button"
                    className="cpf-slot-remove"
                    onClick={e => { e.stopPropagation(); removeImage(i); }}
                    aria-label="Eliminar foto"
                  >✕</button>
                </div>
              ) : (
                <button
                  key={i}
                  type="button"
                  className="cpf-slot cpf-slot--empty"
                  onClick={() => inputRef.current?.click()}
                  disabled={images.length >= MAX_PHOTOS}
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

        {/* ── Título ──────────────────────────────────────── */}
        <input
          type="text"
          placeholder="Título (ej. Camiseta Nike Vintage)"
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="cpf-input"
        />

        {/* ── Marca | Precio ──────────────────────────────── */}
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

        {/* ── Categoría | Talla ───────────────────────────── */}
        <div className="cpf-row">
          <select value={categoryId} onChange={handleCategoryChange} required className="cpf-input">
            <option value="" disabled>Categoría...</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>

          <select
            value={size}
            onChange={e => setSize(e.target.value)}
            required
            disabled={!categoryId}
            className="cpf-input"
          >
            <option value="" disabled>
              {categoryId ? 'Talla...' : 'Selecciona primero una categoría'}
            </option>
            {sizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* ── Condición | Género ──────────────────────────── */}
        <div className="cpf-row">
          <select value={condition} onChange={e => setCondition(e.target.value)} required className="cpf-input">
            <option value="" disabled>Condición de la prenda...</option>
            {['Sin usar', 'Como nuevo', 'Excelente', 'Buen estado', 'Usado'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={gender} onChange={e => setGender(e.target.value)} required className="cpf-input">
            <option value="" disabled>Para quién es...</option>
            {['Mujer', 'Hombre', 'Niños', 'Unisex'].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* ── Descripción ─────────────────────────────────── */}
        <textarea
          placeholder="Describe la prenda, posibles defectos, medidas..."
          required
          rows={4}
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="cpf-input cpf-textarea"
        />

        {/* ── Publicar ────────────────────────────────────── */}
        <button type="submit" className="btn-primary cpf-submit" disabled={uploading}>
          {uploading ? 'Subiendo...' : 'Publicar Prenda'}
        </button>
      </form>

    </div>
  );
};
