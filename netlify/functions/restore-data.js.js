// netlify/functions/restore-data.js
const { Pool } = require('pg');

exports.handler = async (event, context) => {
  // Configurar CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Manejar preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Solo permitir GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    // Crear pool de conexión a Neon
    const pool = new Pool({
      connectionString: process.env.NEON_DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Obtener el último respaldo
    const result = await pool.query(
      `SELECT backup_data, created_at, id 
       FROM antologia_backups 
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    // Cerrar conexión
    await pool.end();

    // Verificar si hay respaldos
    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'No se encontraron respaldos en la nube'
        })
      };
    }

    const backup = result.rows[0];
    
    // Respuesta exitosa
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Datos restaurados exitosamente',
        data: backup.backup_data,
        backupId: backup.id,
        createdAt: backup.created_at
      })
    };

  } catch (error) {
    console.error('Error en restore:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
        details: error.message
      })
    };
  }
};