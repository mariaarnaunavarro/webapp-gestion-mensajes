const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const app = express();

// Puerto dinámico para Railway
const PORT = process.env.PORT || 3000;

// Conexión a MySQL usando variables de entorno de Railway
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  port: process.env.MYSQL_PORT || 3306
});

db.connect(err => {
  if (err) {
    console.error('Error al conectar con MySQL:', err.message);
    return;
  }

  console.log('Conectado a MySQL correctamente');

  // 1) Crear la base de datos si no existe
  db.query("CREATE DATABASE IF NOT EXISTS mensajesdb", err => {
    if (err) {
      console.error('Error creando la base de datos:', err.message);
      return;
    }

    // 2) Cambiar la conexión a la base de datos creada
    db.changeUser({ database: "mensajesdb" }, err => {
      if (err) {
        console.error('Error al seleccionar la base de datos:', err.message);
        return;
      }

      console.log('Base de datos "mensajesdb" seleccionada');

      // 3) Crear la tabla si no existe
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS mensajes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(50),
          mensaje TEXT,
          fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      db.query(createTableQuery, err => {
        if (err) console.error('Error creando tabla:', err.message);
        else console.log('Tabla "mensajes" lista.');
      });
    });
  });
});

// Middleware para formularios y archivos estáticos
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Insertar mensaje
app.post('/enviar', (req, res) => {
  const { nombre, mensaje } = req.body;
  if (!nombre || !mensaje) return res.status(400).send('Faltan campos obligatorios.');

  db.query('INSERT INTO mensajes (nombre, mensaje) VALUES (?, ?)', [nombre, mensaje], err => {
    if (err) {
      console.error('Error al insertar:', err);
      res.status(500).send('Error al guardar el mensaje.');
    } else {
      res.redirect('/mensajes.html');
    }
  });
});

// Mostrar mensajes
app.get('/mensajes', (req, res) => {
  db.query('SELECT * FROM mensajes ORDER BY fecha DESC', (err, results) => {
    if (err) {
      res.status(500).send('Error al recuperar mensajes.');
    } else {
      let html = '<h1>📬 Mensajes recibidos</h1>';
      html += '<a href="/">Volver</a><hr>';
      results.forEach(m => {
        html += `<p><b>${m.nombre}</b>: ${m.mensaje} <br><small>${m.fecha}</small></p><hr>`;
      });
      res.send(html);
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`));
