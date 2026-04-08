/**
 * URL de base Strapi, sans slash final (ex. http://localhost:1337).
 * Laisser vide pour utiliser uniquement les données de démonstration (mock).
 */
export const CMS_API_BASE_URL = 'http://localhost:1337';

/**
 * Jeton API Strapi (lecture). À créer dans Strapi : Settings → API Tokens.
 * Requis si l’endpoint /api/products est protégé par authentification.
 */
export const CMS_API_READ_TOKEN = '04e2d309a991d69957ae1d65d3e55a0c2fc09267dc35a682d48cea37cfeb73979e8cb0bc2ed5e4b142fb92a8b7115ea510aec5919f70427b0751cab28e8fc9f9048c2aa5266ab4709b4b3b6290a7a7d700d028e77a92d32d01b6a3d51f6a1e2c12302df0dcb62743444ee7eea3ef3928a171050ab75c8501a52f9862675dd989';
