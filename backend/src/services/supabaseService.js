const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
  { realtime: { transport: ws } }
);

/**
 * Verifica y decodifica un JWT de Supabase.
 * @param {string} token
 * @returns {Promise<{ id: string, email: string } | null>}
 */
async function verifyToken(token) {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email };
}

/**
 * Obtiene el usuario de Supabase por su ID.
 */
async function getUser(userId) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error) return null;
  return data?.user || null;
}

/**
 * Elimina un usuario de Supabase Auth (admin action).
 */
async function deleteUser(userId) {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;
  return true;
}

/**
 * Lista todos los usuarios de Supabase Auth.
 */
async function listUsers() {
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) throw error;
  return data?.users || [];
}

module.exports = { verifyToken, getUser, deleteUser, listUsers };
