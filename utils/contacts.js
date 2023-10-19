const { constants } = require('buffer');
const fs = require('fs').promises;

const dirPath = './data';

const initDirectory = async () => {
  try {
    if (!await fs.stat(dirPath)) {
      await fs.mkdir(dirPath);
    }

    const dataPath = './data/dblokers.json';

    if (!await fs.stat(dataPath)) {
      await fs.writeFile(dataPath, '[]', 'utf-8');
    }
  } catch (error) {
    console.error('Error initializing directory:', error);
  }
};

initDirectory();

// Ambil semua data di dblokers.json
const loadDbloker = async () => {
  try {
    const fileBuffer = await fs.readFile('data/dblokers.json', 'utf-8');
    const dblokers = JSON.parse(fileBuffer);
    return dblokers;
  } catch (error) {
    console.error('Error loading dbloker:', error);
    return [];
  }
};

// Cari dbloker berdasarkan nama
const findDbloker = async (nama) => {
  const dblokers = await loadDbloker();
  const dbloker = dblokers.find((dbloker) => dbloker.nama.toLowerCase() === nama.toLowerCase());
  return dbloker;
};

// Menulis file dblokers.json dengan data yang baru
const saveDblokers = async (dblokers) => {
  try {
    await fs.writeFile('data/dblokers.json', JSON.stringify(dblokers), 'utf-8');
  } catch (error) {
    console.error('Error saving dblokers:', error);
  }
};

// Menambahkan data dbloker baru
const addDbloker = async (dbloker) => {
  try {
    const dblokers = await loadDbloker();
    dblokers.push(dbloker);
    await saveDblokers(dblokers);
  } catch (error) {
    console.error('Error adding dbloker:', error);
  }
};

// Cek nama duplikat
const cekDuplikat = async (nama) => {
  const dblokers = await loadDbloker();
  return dblokers.find((dbloker) => dbloker.nama === nama);
};

//cekIP
const cekDuplikatIP = async (ipaddress) => {
  const dblokers = await loadDbloker();
  return dblokers.find((dbloker) => dbloker.ipaddress === ipaddress);
};

// Hapus dbloker
const deleteDbloker = async (nama) => {
  try {
    const dblokers = await loadDbloker();
    const filteredDblokers = dblokers.filter((dbloker) => dbloker.nama !== nama);
    await saveDblokers(filteredDblokers);
  } catch (error) {
    console.error('Error deleting dbloker:', error);
  }
};

// Mengubah dblokers
const updatedDblokers = async (dblokerBaru) => {
  try {
    const dblokers = await loadDbloker();
    // Hilangkan dbloker lama yang namanya sama dengan oldNama
    const filteredDblokers = dblokers.filter((dbloker) => dbloker.nama !== dblokerBaru.oldNama);
    delete dblokerBaru.oldNama;

    const ipfilteredDblokers = filteredDblokers.filter((filteredDblokers) => filteredDblokers.ipaddress !== dblokerBaru.oldIp);
    delete dblokerBaru.oldIp;
    
    ipfilteredDblokers.push(dblokerBaru);
    await saveDblokers(ipfilteredDblokers);
  } catch (error) {
    console.error('Error updating dbloker:', error);
  }
};

// Mengubah control
const updateControl = async (kontrolBaru) => {
  try {
    const dblokers = await loadDbloker();

    // Filter data JSON dengan nama yang tidak sama dengan kontrol baru
    const filteredDblokers = dblokers.filter((dbloker) => dbloker.nama !== kontrolBaru.nama);

    // Tambahkan kontrol baru ke dalam data yang telah diperbarui
    filteredDblokers.push(kontrolBaru);
    await saveDblokers(filteredDblokers);
    
    const kontrolBaruJSON = JSON.stringify(kontrolBaru);
    // console.log(kontrolBaruJSON);
    return kontrolBaruJSON;

  } catch (error) {
    console.error('Error updating control:', error);
  }
};

module.exports = { loadDbloker, findDbloker, addDbloker, cekDuplikat, cekDuplikatIP, deleteDbloker, updatedDblokers, updateControl };
