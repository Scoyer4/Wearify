import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

const categorias = {
  genero: ['Hombre', 'Mujer', 'Niños', 'Unisex'],
  tipo: ['Camisetas', 'Pantalones', 'Sudaderas', 'Chaquetas', 'Calzado', 'Accesorios'],
  descubrir: ['Tendencias', 'Ofertas', 'Recién subido', 'Más vendidos'],
  marcas: ['Nike', 'Adidas', 'Vans', 'Champion', "Levi's"],
};

export default function NavMenu() {
  const [abierto, setAbierto] = useState(false);
  const navigate = useNavigate();

  const handleCategoria = (filtro: string) => {
    navigate(`/?categoria=${encodeURIComponent(filtro)}`);
    setAbierto(false);
  };

  return (
    <div
      className="hamburger-wrapper"
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
    >
      <button className="menu-toggle">
        <span className="hamburger-bar" />
        <span className="hamburger-bar" />
        <span className="hamburger-bar" />
      </button>

      {abierto && (
        <div className="mega-menu">
          <div className="mega-menu-grid">

            <div className="menu-col">
              <h4 className="menu-col-title">Por género</h4>
              <ul className="menu-list">
                {categorias.genero.map(item => (
                  <li key={item} onClick={() => handleCategoria(item)}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="menu-col">
              <h4 className="menu-col-title">Categorías</h4>
              <ul className="menu-list">
                {categorias.tipo.map(item => (
                  <li key={item} onClick={() => handleCategoria(item)}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="menu-col">
              <h4 className="menu-col-title">Descubrir</h4>
              <ul className="menu-list">
                {categorias.descubrir.map(item => (
                  <li key={item} onClick={() => handleCategoria(item)}>{item}</li>
                ))}
              </ul>
            </div>

          </div>

          <div className="menu-footer">
            {categorias.marcas.map(marca => (
              <span
                key={marca}
                className="menu-tag"
                onClick={() => handleCategoria(marca)}
              >
                {marca}
              </span>
            ))}
            <span className="menu-tag menu-tag-more">
              Ver todas las marcas →
            </span>
          </div>
        </div>
      )}
    </div>
  );
}