const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const { loadDbloker, findDbloker, addDbloker, cekDuplikat, cekDuplikatIP, deleteDbloker, updatedDblokers, updateControl } = require('./utils/contacts');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const axios = require('axios'); // Import modul axios
const port = 80;


// Gunakan ejs
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Konfigurasi flash
app.use(cookieParser('secret'));
app.use(
  session({
    cookie: { maxAge: 6000 },
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  })
);
app.use(flash());

// Middleware untuk menangani kesalahan global
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Terjadi kesalahan dalam server.');
});

// Middleware untuk async/await
const asyncMiddleware = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.get('/dbloker', asyncMiddleware(async (req, res) => {
  const dblokers = await loadDbloker();
  res.render('dbloker', {
    layout: 'layouts/main-layout',
    title: 'Halaman Daftar Jammer',
    dblokers,
    msg: req.flash('msg'),
  });
}));

app.get('/dbloker/add', (req, res) => {
  res.render('add-dbloker', {
    title: 'Form Tambah Data Jammer',
    layout: 'layouts/main-layout',
  });
});

app.post('/dbloker', [
  body('nama').custom(async (value) => {
    const duplikat = await cekDuplikat(value);
    if (duplikat) {
      throw new Error('ID Jammer sudah terdaftar!');
    } 
    return true;
  }),
  body('ipaddress').custom(async (value) => {
    const duplikat = await cekDuplikatIP(value);
    if (duplikat) {
      throw new Error('IP sudah terdaftar!');
    } 
    return true;
  }),
], asyncMiddleware(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.render('add-dbloker', {
      title: 'Form Tambah Data Jammer',
      layout: 'layouts/main-layout',
      errors: errors.array(),
    });
  } else {
    await addDbloker(req.body);
    req.flash('msg', 'Data Berhasil ditambahkan!');
    res.redirect('/dbloker');
  }
}));


app.get('/dblokers/delete/:nama', asyncMiddleware(async (req, res) => {
    const dbloker = await findDbloker(req.params.nama);
  
    if (!dbloker) {
      res.status(404);
      res.send('<h1>404</h1>');
    } else {
      await deleteDbloker(req.params.nama);
      req.flash('msg', 'Data Berhasil dihapus!');
      res.redirect('/dbloker');
    }
  }));
  
  app.get('/dbloker/edit/:nama', asyncMiddleware(async (req, res) => {
    const dbloker = await findDbloker(req.params.nama);
  
    res.render('edit-dbloker', {
      title: 'Form Ubah Data Jammer',
      layout: 'layouts/main-layout',
      dbloker
    });
  }));
  
  app.post('/dbloker/update', [
    body('nama').custom(async (value, { req }) => {
      const duplikat = await cekDuplikat(value);
      if (value !== req.body.oldNama && duplikat) {
        throw new Error('ID Jammer sudah terdaftar!');
      }
      return true;
    }),
    body('ipaddress').custom(async (value, { req }) => {
        const duplikat = await cekDuplikatIP(value);
        if (value !== req.body.oldIp && duplikat) {
          throw new Error('IP sudah terdaftar!');
        } 
        return true;
      }),
  ], asyncMiddleware(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render('edit-dbloker', {
        title: 'Form Ubah Data jammer',
        layout: 'layouts/main-layout',
        errors: errors.array(),
        dbloker: req.body
      });
    } else {
      await updatedDblokers(req.body);
      req.flash('msg', 'Data Berhasil diubah!');
      res.redirect('/dbloker');
    }
  }));
  
  app.post('/dbloker/update-control', 
  asyncMiddleware(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      await updateControl(req.body);
      const kontrolBaruJSON = req.body
      const options = {
        headers: {
          'Content-Type': 'application/json', // Set tipe konten sebagai JSON
        },
      };
    //   req.flash('msg', 'Data Berhasil diubah!');
    //   res.redirect('/dbloker');
      console.log(kontrolBaruJSON.ipaddress);
      axios.post(`http://${kontrolBaruJSON.ipaddress}:${port}/api/dbloker`, kontrolBaruJSON, options)
            .then(response => {
            console.log('Data JSON berhasil dikirimkan');
            // Redirect kembali ke halaman form setelah mengirim data
            req.flash('msg', 'Data Berhasil Dikirim!');
            res.redirect('/dbloker');
            })
            .catch(error => {
            console.error('Gagal mengirimkan data JSON:', error);
            // Tangani kesalahan dan mungkin beri tahu pengguna tentang kesalahan ini
            req.flash('msg', 'Data gagal dikirim!');
            res.redirect('/dbloker');
            });
    }
  }));
  
  app.get('/dbloker/delete/:nama', asyncMiddleware(async (req, res) => {
    const dbloker = await findDbloker(req.params.nama);
  
    if (!dbloker) {
      res.status(404);
      res.send('<h1>404</h1>');
    } else {
      await deleteDbloker(req.params.nama);
      req.flash('msg', 'Data Berhasil dihapus!');
      res.redirect('/dbloker');
    }
  }));
  
  app.get('/dbloker/:nama', asyncMiddleware(async (req, res) => {
    const dbloker = await findDbloker(req.params.nama);
    res.render('detail', {
      layout: 'layouts/main-layout',
      title: 'Halaman Detail Contact',
      dbloker,
    });
  }));
  
  app.use('/', (req, res) => {
    res.status(404);
    res.send('<h1>Page Not Found</h1>');
  });
  
const serverIp = '192.168.0.1';

app.listen(port, serverIp, () => {
  console.log(`Server berjalan di http://${serverIp}:${port}`);
});
  