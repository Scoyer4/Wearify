import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createProduct, getCategories } from '../services/api';
// Importamos su propio archivo CSS
import './CreateProductForm.css';

interface Category {
  id: number;
  name: string;
  slug: string | null;
}

export const CreateProductForm = ({ onProductCreated }: { onProductCreated: () => void }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [size, setSize] = useState(''); 
  const [condition, setCondition] = useState('');
  const [status, setStatus] = useState('Disponible');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [estadoMensaje, setEstadoMensaje] = useState('');

  useEffect(() => {
    const cargarCategorias = async () => {
      const data = await getCategories();
      if (data) setCategories(data);
    };
    cargarCategorias();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEstadoMensaje('Subiendo producto...');

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) return setEstadoMensaje('Error: No estás autenticado.');

    const nuevoProducto = {
      title, description, price: parseFloat(price), brand, size, condition, status,
      image_url: imageUrl,
      category_id: parseInt(categoryId)
    };

    const resultado = await createProduct(nuevoProducto, token);

    if (resultado) {
      setEstadoMensaje('¡Producto subido con éxito!');
      setTitle(''); setDescription(''); setPrice(''); setBrand(''); 
      setSize(''); setCondition(''); setStatus('Disponible'); setImageUrl('');
      setCategoryId('');
      onProductCreated(); 
    } else {
      setEstadoMensaje('Hubo un error al subir el producto.');
    }
  };

  return (
    <div className="form-container">
      <h3 className="form-title">Subir nueva prenda</h3>
      
      <form onSubmit={handleSubmit} className="form-grid">
        <input 
          type="text" placeholder="Título (ej. Camiseta Nike Vintage)" required
          value={title} onChange={(e) => setTitle(e.target.value)}
          className="form-input span-2"
        />

        <input 
          type="text" placeholder="Marca (ej. Nike, Zara, Levis)" required
          value={brand} onChange={(e) => setBrand(e.target.value)}
          className="form-input"
        />

        <input 
          type="number" step="0.01" placeholder="Precio (€)" required
          value={price} onChange={(e) => setPrice(e.target.value)}
          className="form-input"
        />

        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="form-input">
          <option value="" disabled>Selecciona una categoría...</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        
        <select value={size} onChange={(e) => setSize(e.target.value)} required className="form-input">
          <option value="" disabled>Selecciona una talla...</option>
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="XXL">XXL</option>
          <option value="Única">Talla Única</option>
        </select>

        <select value={condition} onChange={(e) => setCondition(e.target.value)} required className="form-input">
          <option value="" disabled>Condición de la prenda...</option>
          <option value="Sin usar">Sin usar</option>
          <option value="Usado">Usado</option>
          <option value="Buen estado">Buen estado</option>
          <option value="Excelente">Excelente</option>
          <option value="Como nuevo">Como nuevo</option>
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)} required className="form-input">
          <option value="Disponible">Disponible</option>
          <option value="Reservado">Reservado</option>
          <option value="Vendido">Vendido</option>
        </select>

        <input 
          type="url" placeholder="URL de la imagen (ej. https://...)" required
          value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
          className="form-input"
        />

        <textarea 
          placeholder="Describe la prenda, posibles defectos, medidas..." required rows={4}
          value={description} onChange={(e) => setDescription(e.target.value)}
          className="form-input span-2"
        />

        <button type="submit" className="btn-primary span-2 submit-product-btn">
          Publicar Prenda
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