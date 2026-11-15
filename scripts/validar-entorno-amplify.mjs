// Valida que el frontend estático no se publique apuntando a localhost ni sin API.
// Las variables VITE_* quedan visibles en el bundle; nunca incluir secretos aquí.
const valor = process.env.VITE_API_URL?.trim();

if (!valor) {
  console.error('Falta VITE_API_URL en las variables de entorno de Amplify.');
  process.exit(1);
}

let api;
try {
  api = new URL(valor);
} catch {
  console.error('VITE_API_URL debe ser una URL HTTPS absoluta válida.');
  process.exit(1);
}

const host = api.hostname.toLowerCase();
const hostLocal = host === 'localhost'
  || host === '127.0.0.1'
  || host === '::1'
  || host.endsWith('.localhost');

if (api.protocol !== 'https:' || hostLocal || api.username || api.password
    || api.search || api.hash || api.pathname !== '/') {
  console.error('VITE_API_URL debe ser un origen HTTPS público, sin ruta, credenciales ni parámetros.');
  process.exit(1);
}

console.log('API pública HTTPS configurada para el build de Amplify.');
