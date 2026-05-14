// seed.js — ejecutar con: node seed.js
// Crea productos de prueba distribuidos entre los usuarios existentes

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://iljywugodbjjxwiyxzzx.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlsanl3dWdvZGJqanh3aXl4enp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM1MzA5NywiZXhwIjoyMDgyOTI5MDk3fQ.9kVPRQ2MpvECeCUFG2Xm0cz7SszlQxxurFGBS1VmNUE';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// ── Datos de ejemplo ──────────────────────────────────────────────────────────

const PRODUCTS = [
  // Camisetas
  { title: 'Camiseta básica blanca', brand: 'Zara', price: 12, condition: 'Como nuevo', gender: 'Mujer', catSlug: 'camisetas', images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'] },
  { title: 'Camiseta oversized negra', brand: 'H&M', price: 9, condition: 'Buen estado', gender: 'Hombre', catSlug: 'camisetas', images: ['https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600'] },
  { title: 'Camiseta tie-dye', brand: 'Pull&Bear', price: 15, condition: 'Excelente', gender: 'Unisex', catSlug: 'camisetas', images: ['https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600'] },
  { title: 'Camiseta polo Ralph Lauren', brand: 'Ralph Lauren', price: 35, condition: 'Como nuevo', gender: 'Hombre', catSlug: 'camisetas', images: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600'] },
  { title: 'Camiseta estampada floral', brand: 'Mango', price: 11, condition: 'Buen estado', gender: 'Mujer', catSlug: 'camisetas', images: ['https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600'] },
  { title: 'Camiseta New Balance', brand: 'New Balance', price: 28, condition: 'Excelente', gender: 'Unisex', catSlug: 'camisetas', images: ['https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600'] },
  { title: 'Camiseta vintage NASA', brand: 'ASOS', price: 18, condition: 'Usado', gender: 'Unisex', catSlug: 'camisetas', images: ['https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=600'] },
  { title: 'Camiseta de rayas marineras', brand: 'Sfera', price: 8, condition: 'Buen estado', gender: 'Mujer', catSlug: 'camisetas', images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600'] },

  // Pantalones
  { title: 'Vaqueros slim fit azules', brand: "Levi's", price: 45, condition: 'Excelente', gender: 'Hombre', catSlug: 'pantalones', images: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=600'] },
  { title: 'Pantalón cargo verde', brand: 'Carhartt', price: 55, condition: 'Como nuevo', gender: 'Hombre', catSlug: 'pantalones', images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600'] },
  { title: 'Pantalón de vestir negro', brand: 'Mango', price: 30, condition: 'Excelente', gender: 'Mujer', catSlug: 'pantalones', images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600'] },
  { title: 'Joggers grises', brand: 'Nike', price: 40, condition: 'Como nuevo', gender: 'Unisex', catSlug: 'pantalones', images: ['https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=600'] },
  { title: 'Mom jeans blancos', brand: "Levi's", price: 38, condition: 'Buen estado', gender: 'Mujer', catSlug: 'pantalones', images: ['https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600'] },
  { title: 'Pantalón chino beige', brand: 'Zara', price: 22, condition: 'Buen estado', gender: 'Hombre', catSlug: 'pantalones', images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600'] },
  { title: 'Pantalón wide leg', brand: 'Stradivarius', price: 26, condition: 'Excelente', gender: 'Mujer', catSlug: 'pantalones', images: ['https://images.unsplash.com/photo-1594938298603-c8148c4b4d1e?w=600'] },

  // Sudaderas
  { title: 'Sudadera hoodie gris', brand: 'Champion', price: 42, condition: 'Como nuevo', gender: 'Unisex', catSlug: 'sudaderas', images: ['https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600'] },
  { title: 'Sudadera crewneck Nike', brand: 'Nike', price: 50, condition: 'Excelente', gender: 'Hombre', catSlug: 'sudaderas', images: ['https://images.unsplash.com/photo-1614495077470-bae3f4737f7c?w=600'] },
  { title: 'Sudadera oversize beige', brand: 'Zara', price: 28, condition: 'Buen estado', gender: 'Mujer', catSlug: 'sudaderas', images: ['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600'] },
  { title: 'Sudadera con bordado', brand: 'Tommy Hilfiger', price: 65, condition: 'Excelente', gender: 'Unisex', catSlug: 'sudaderas', images: ['https://images.unsplash.com/photo-1503341733017-1901578f9f1e?w=600'] },
  { title: 'Hoodie tie-dye morado', brand: 'H&M', price: 20, condition: 'Como nuevo', gender: 'Unisex', catSlug: 'sudaderas', images: ['https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?w=600'] },

  // Abrigos
  { title: 'Abrigo largo camel', brand: 'Massimo Dutti', price: 120, condition: 'Excelente', gender: 'Mujer', catSlug: 'abrigos', images: ['https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=600'] },
  { title: 'Chaqueta vaquera azul', brand: "Levi's", price: 55, condition: 'Buen estado', gender: 'Unisex', catSlug: 'abrigos', images: ['https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=600'] },
  { title: 'Puffer jacket negro', brand: 'The North Face', price: 150, condition: 'Como nuevo', gender: 'Hombre', catSlug: 'abrigos', images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600'] },
  { title: 'Blazer gris cuadros', brand: 'Zara', price: 60, condition: 'Excelente', gender: 'Hombre', catSlug: 'abrigos', images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600'] },
  { title: 'Trench coat beis', brand: 'Mango', price: 85, condition: 'Buen estado', gender: 'Mujer', catSlug: 'abrigos', images: ['https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=600'] },
  { title: 'Chaqueta de cuero negro', brand: 'AllSaints', price: 140, condition: 'Excelente', gender: 'Unisex', catSlug: 'abrigos', images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600'] },

  // Calzado
  { title: 'Sneakers blancos', brand: 'Adidas', price: 65, condition: 'Como nuevo', gender: 'Unisex', catSlug: 'calzado', images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600'] },
  { title: 'Nike Air Force 1', brand: 'Nike', price: 80, condition: 'Excelente', gender: 'Unisex', catSlug: 'calzado', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'] },
  { title: 'Botas Chelsea negras', brand: 'Zara', price: 55, condition: 'Buen estado', gender: 'Mujer', catSlug: 'calzado', images: ['https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=600'] },
  { title: 'Vans Old Skool', brand: 'Vans', price: 45, condition: 'Usado', gender: 'Unisex', catSlug: 'calzado', images: ['https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600'] },
  { title: 'Converse Chuck 70', brand: 'Converse', price: 50, condition: 'Como nuevo', gender: 'Unisex', catSlug: 'calzado', images: ['https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=600'] },
  { title: 'Zapato de tacón nude', brand: 'Mango', price: 35, condition: 'Excelente', gender: 'Mujer', catSlug: 'calzado', images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'] },
  { title: 'Botas militares marrón', brand: 'Dr. Martens', price: 110, condition: 'Buen estado', gender: 'Unisex', catSlug: 'calzado', images: ['https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600'] },
  { title: 'Sandalias planas', brand: 'Stradivarius', price: 18, condition: 'Como nuevo', gender: 'Mujer', catSlug: 'calzado', images: ['https://images.unsplash.com/photo-1603487742131-4160ec999306?w=600'] },

  // Accesorios
  { title: 'Bolso de mano marrón', brand: 'Zara', price: 40, condition: 'Excelente', gender: 'Mujer', catSlug: 'accesorios', images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600'] },
  { title: 'Gorra vintage negra', brand: 'New Era', price: 22, condition: 'Como nuevo', gender: 'Unisex', catSlug: 'accesorios', images: ['https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600'] },
  { title: 'Cinturón de piel negro', brand: 'Pull&Bear', price: 15, condition: 'Buen estado', gender: 'Unisex', catSlug: 'accesorios', images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'] },
  { title: 'Mochila urbana negra', brand: 'Eastpak', price: 48, condition: 'Excelente', gender: 'Unisex', catSlug: 'accesorios', images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a45?w=600'] },
  { title: 'Bolso bandolera camel', brand: 'Mango', price: 35, condition: 'Como nuevo', gender: 'Mujer', catSlug: 'accesorios', images: ['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600'] },

  // Trajes
  { title: 'Traje azul marino slim', brand: 'Massimo Dutti', price: 180, condition: 'Excelente', gender: 'Hombre', catSlug: 'trajes', images: ['https://images.unsplash.com/photo-1594938298603-c8148c4b4d1e?w=600'] },
  { title: 'Conjunto blazer + pantalón', brand: 'Zara', price: 95, condition: 'Como nuevo', gender: 'Mujer', catSlug: 'trajes', images: ['https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600'] },

  // Niños
  { title: 'Chándal infantil azul', brand: 'Nike', price: 30, condition: 'Buen estado', gender: 'Niños', catSlug: 'sudaderas', images: ['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600'] },
  { title: 'Camiseta niño estampada', brand: 'Zara', price: 8, condition: 'Como nuevo', gender: 'Niños', catSlug: 'camisetas', images: ['https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600'] },
  { title: 'Vaqueros niño', brand: 'H&M', price: 14, condition: 'Excelente', gender: 'Niños', catSlug: 'pantalones', images: ['https://images.unsplash.com/photo-1471286174890-9c112ffca5b4?w=600'] },

  // Extra variedad
  { title: 'Vestido floral verano', brand: 'Bershka', price: 22, condition: 'Como nuevo', gender: 'Mujer', catSlug: 'camisetas', images: ['https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600'] },
  { title: 'Top de punto beige', brand: 'Stradivarius', price: 16, condition: 'Excelente', gender: 'Mujer', catSlug: 'camisetas', images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600'] },
  { title: 'Chaqueta punto marrón', brand: 'Zara', price: 38, condition: 'Buen estado', gender: 'Mujer', catSlug: 'abrigos', images: ['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600'] },
  { title: 'Camisa Oxford blanca', brand: 'Tommy Hilfiger', price: 55, condition: 'Excelente', gender: 'Hombre', catSlug: 'camisetas', images: ['https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600'] },
  { title: 'Camisa de lino azul', brand: 'Massimo Dutti', price: 48, condition: 'Como nuevo', gender: 'Hombre', catSlug: 'camisetas', images: ['https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600'] },
  { title: 'Short vaquero', brand: "Levi's", price: 28, condition: 'Buen estado', gender: 'Mujer', catSlug: 'pantalones', images: ['https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=600'] },
  { title: 'Leggings deportivos', brand: 'Nike', price: 32, condition: 'Como nuevo', gender: 'Mujer', catSlug: 'pantalones', images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600'] },
  { title: 'Chaqueta bomber verde', brand: 'H&M', price: 45, condition: 'Excelente', gender: 'Unisex', catSlug: 'abrigos', images: ['https://images.unsplash.com/photo-1544441893-675973e31985?w=600'] },
  { title: 'Zapatillas running grises', brand: 'Adidas', price: 72, condition: 'Buen estado', gender: 'Hombre', catSlug: 'calzado', images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'] },
  { title: 'Bufanda de lana gris', brand: 'Zara', price: 14, condition: 'Excelente', gender: 'Unisex', catSlug: 'accesorios', images: ['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=600'] },
];

const SIZES_ROPA   = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SIZES_ZAPATO = ['36', '37', '38', '39', '40', '41', '42', '43', '44'];
const SIZES_UNICA  = ['Única'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function getSizes(catSlug) {
  if (catSlug === 'calzado') return SIZES_ZAPATO;
  if (catSlug === 'accesorios') return SIZES_UNICA;
  return SIZES_ROPA;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🔍 Obteniendo usuarios y categorías…');

  const { data: users, error: usersErr } = await supabase.from('users').select('id, username');
  if (usersErr) { console.error('Error al obtener usuarios:', usersErr.message); process.exit(1); }
  if (!users.length) { console.error('No hay usuarios en la base de datos.'); process.exit(1); }

  const { data: categories, error: catsErr } = await supabase.from('categories').select('id, slug, name');
  if (catsErr) { console.error('Error al obtener categorías:', catsErr.message); process.exit(1); }

  console.log(`✅ ${users.length} usuario(s) encontrado(s): ${users.map(u => u.username ?? u.id.slice(0,8)).join(', ')}`);
  console.log(`✅ ${categories.length} categoría(s) encontrada(s)`);

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const seller = users[i % users.length]; // reparte en round-robin

    // Buscar la categoría por slug o por nombre aproximado
    let cat = categories.find(c => c.slug === p.catSlug);
    if (!cat) cat = categories.find(c => c.name.toLowerCase().includes(p.catSlug));
    if (!cat) { console.warn(`⚠️  Categoría '${p.catSlug}' no encontrada, usando primera disponible`); cat = categories[0]; }

    const size = pick(getSizes(p.catSlug));

    // Insertar producto
    const { data: prod, error: prodErr } = await supabase
      .from('products')
      .insert({
        seller_id:   seller.id,
        category_id: cat.id,
        title:       p.title,
        description: `${p.title} en perfecto estado. ${p.condition === 'Sin usar' || p.condition === 'Como nuevo' ? 'Apenas usado.' : 'Con marcas normales de uso.'}`,
        price:       p.price,
        brand:       p.brand,
        size:        size,
        condition:   p.condition,
        gender:      p.gender,
        status:      'Disponible',
      })
      .select('id')
      .single();

    if (prodErr) {
      console.error(`❌ Error en "${p.title}":`, prodErr.message);
      skipped++;
      continue;
    }

    // Insertar imágenes
    if (p.images?.length) {
      const rows = p.images.map(url => ({ product_id: prod.id, image_url: url }));
      const { error: imgErr } = await supabase.from('productImages').insert(rows);
      if (imgErr) console.warn(`⚠️  Imagen de "${p.title}" falló:`, imgErr.message);
    }

    created++;
    console.log(`✅ [${String(created).padStart(2, '0')}] ${p.title} → @${seller.username ?? seller.id.slice(0, 8)}`);
  }

  console.log(`\n🎉 Hecho: ${created} productos creados, ${skipped} fallidos.`);
}

seed().catch(err => { console.error('Error inesperado:', err); process.exit(1); });
