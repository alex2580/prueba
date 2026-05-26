const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
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

/**
 * Uploads a file buffer to Supabase Storage and returns the public URL.
 * @param {Buffer} buffer
 * @param {string} bucket - e.g. 'espacios' | 'avatars'
 * @param {string} originalName - original filename (for extension detection)
 * @returns {Promise<string>} public URL
 */
async function uploadFile(buffer, bucket, originalName) {
  const ext = path.extname(originalName).toLowerCase() || '.jpg';
  const filename = `${uuidv4()}${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, buffer, {
      contentType: _mimeFromExt(ext),
      upsert: false,
    });

  if (error) throw new Error(`Supabase Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

function _mimeFromExt(ext) {
  const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
  return map[ext] || 'image/jpeg';
}

module.exports = { verifyToken, getUser, deleteUser, listUsers, uploadFile };
