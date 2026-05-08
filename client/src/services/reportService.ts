const API = import.meta.env.VITE_API_URL;

export const REPORT_REASONS_PRODUCT = [
  'Ropa falsa o imitación',
  'Descripción engañosa',
  'Imágenes inapropiadas',
  'Contenido prohibido',
  'Spam o publicidad',
  'Otro',
];

export const REPORT_REASONS_USER = [
  'Comportamiento abusivo',
  'Spam o publicidad',
  'Suplantación de identidad',
  'Actividad fraudulenta',
  'Otro',
];

export const createReport = async (
  token: string,
  payload: { reason: string; details?: string; productId?: string; userId?: string },
): Promise<void> => {
  const res = await fetch(`${API}/reports`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? 'Error al enviar el reporte');
  }
};
