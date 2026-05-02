import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { createProduct, getCategories } from '../services/api';
import './CreateProductForm.css';

interface Category { id: number; name: string; slug: string | null }

interface ImageEntry { file: File; preview: string }

export const CreateProductForm = ({ onProductCreated }: { onProductCreated: () => void }) => {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]           = useState('');
  const [brand, setBrand]           = useState('');
  const [size, setSize]             = useState('');
  const [condition, setCondition]   = useState('');
  const [status, setStatus]         = useState('Disponible');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages]         = useState<ImageEntry[]>([]);
  const [uploading, setUploading]   = useState(false);
  const [estadoMensaje, setEstadoMensaje] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getCategories().then(data => { if (data) setCategories(data); });
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    const entries: ImageEntry[] = valid.map(f => ({ file: f, preview: URL.createObjectURL(f) }));
    setImages(prev => [...prev, ...entries]);
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstadoMensaje('Subiendo producto...');
    setUploading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const userId = session?.user?.id;
    if (!token || !userId) { setEstadoMensaje('Error: No estás autenticado.'); setUploading(false); return; }

    const imageUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const { file } = images[i];
      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}_${i}.${ext}`;
      const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true });
      if (error) { setEstadoMensaje(`Error al subir imagen ${i + 1}: ${error.message}`); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from('products').getPublicUrl(path);
      imageUrls.push(urlData.publicUrl);
    }

    const resultado = await createProduct({
      title, description, price: parseFloat(price), brand, size, condition, status,
      image_urls: imageUrls,
      category_id: parseInt(categoryId),
    }, token);

    setUploading(false);

    if (resultado) {
      setEstadoMensaje('¡Producto subido con éxito!');
      setTitle(''); setDescription(''); setPrice(''); setBrand('');
      setSize(''); setCondition(''); setStatus('Disponible'); setCategoryId('');
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
      onProductCreated();
    } else {
      setEstadoMensaje('Hubo un error al subir el producto.');
    }
  };

  return (
    <div className="form-container">
      <h3 className="form-title">Subir nueva prenda</h3>

      <form onSubmit={handleSubmit} className="form-grid">
        <input type="text" placeholder="Título (ej. Camiseta Nike Vintage)" required
          value={title} onChange={e => setTitle(e.target.value)} className="form-input span-2" />

        <input type="text" placeholder="Marca (ej. Nike, Zara, Levis)" required
          value={brand} onChange={e => setBrand(e.target.value)} className="form-input" />

        <input type="number" step="0.01" placeholder="Precio (€)" required
          value={price} onChange={e => setPrice(e.target.value)} className="form-input" />

        <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required className="form-input">
          <option value="" disabled>Selecciona una categoría...</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>

        <select value={size} onChange={e => setSize(e.target.value)} required className="form-input">
          <option value="" disabled>Selecciona una talla...</option>
          {['XS','S','M','L','XL','XXL'].map(s => <option key={s} value={s}>{s}</option>)}
          <option value="Única">Talla Única</option>
        </select>

        <select value={condition} onChange={e => setCondition(e.target.value)} required className="form-input">
          <option value="" disabled>Condición de la prenda...</option>
          {['Sin usar','Usado','Buen estado','Excelente','Como nuevo'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={status} onChange={e => setStatus(e.target.value)} required className="form-input">
          <option value="Disponible">Disponible</option>
          <option value="Reservado">Reservado</option>
          <option value="Vendido">Vendido</option>
        </select>

        {/* Multi-image picker */}
        <div className="multi-image-picker span-2">
          {images.map((img, i) => (
            <div key={i} className="multi-image-thumb">
              <img src={img.preview} alt={`Imagen ${i + 1}`} />
              {i === 0 && <span className="multi-image-badge">Principal</span>}
              <button type="button" className="multi-image-remove" onClick={() => removeImage(i)} title="Eliminar">✕</button>
            </div>
          ))}
          <button
            type="button"
            className="multi-image-add"
            onClick={() => inputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span>{images.length === 0 ? 'Añadir fotos' : '+ Más fotos'}</span>
          </button>
          <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
            onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
        </div>

        <textarea placeholder="Describe la prenda, posibles defectos, medidas..." required rows={4}
          value={description} onChange={e => setDescription(e.target.value)} className="form-input span-2" />

        <button type="submit" className="btn-primary span-2 submit-product-btn" disabled={uploading}>
          {uploading ? 'Subiendo...' : 'Publicar Prenda'}
        </button>
      </form>

      {estadoMensaje && (
        <p className={`form-message ${estadoMensaje.includes('éxito') ? 'success' : 'error'}`}>
          {estadoMensaje}
        </p>
      )}
    </div>
  );
};
