const { app, Menu, Tray } = require('electron');
const path = require('path');
const dns = require('dns');
const fs = require('fs');

const wallpaper = require('wallpaper');
const request = require('request');

let collectionDefaultPath = path.join(__dirname, 'collection\\');

let inc = 0;
let interval = null;
const banWorld = 'unlikedByUser';

const iconPath = path.join(__dirname, 'icon.png');
let appIcon = null;

app.on('ready', function() {
  appIcon = new Tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Pobierz zdjęcie', type: 'normal', click: getWallpaper },
    { label: 'Losuj zdjęcie', type: 'normal', click: gamblePhoto },
    { label: 'Nie lubię tego zdjęcia', type: 'normal', click: unlikePhoto },
    { label: 'Zamknij aplikację', type: 'normal', click: quitApp },
  ]);

  appIcon.setToolTip('Tapetify');
  appIcon.setContextMenu(contextMenu);

  changeWallpaper();
});

const quitApp = function() {
  app.quit();
};

const unlikePhoto = async function() {
  const wall = await wallpaper.get();

  if (wall.includes(collectionDefaultPath)) {
    const wallName = wall.replace(collectionDefaultPath, '');

    const changedName = banWorld.concat(wallName);

    const changingFile = path.join(collectionDefaultPath, wallName);

    const changedFile = path.join(collectionDefaultPath, changedName);

    fs.renameSync(changingFile, changedFile, function(err) {});

    clearInterval(interval);

    changeWallpaper();
  }
};

const getWallpaper = async function() {
  await getPhoto();
  await changeWallpaper();
};

const getPhoto = async function() {
  dns.resolve('www.google.com', async function(err) {
    if (err) console.log('No internet');
    else {
      console.log('Connected');
      const date = new Date().toLocaleDateString();

      await download('https://source.unsplash.com/daily', 'resources/app/collection/photo_' + date + '.jpg', function() {});
    }
  });
};

const changeWallpaper = async function() {
  inc = 0;
  const dirname = collectionDefaultPath;
  const files = fs.readdirSync(dirname);
  const filteredCollection = [];
  const collectionPath = collectionDefaultPath;

  files.forEach(function(el) {
    if (!el.includes(banWorld)) filteredCollection.push(el);
  });

  const filesAmount = filteredCollection.length;

  if (filesAmount > 0) {
    interval = setInterval(async function() {
      await wallpaper.set(collectionPath + filteredCollection[inc]);

      (await (inc >= filesAmount - 1)) ? (inc = 0) : inc++;
    }, 3000);
  }
};

const writeFile = async (file) => {
  await fs.writeFile(__dirname + '/log', file, function(err) {
    if (err) {
      return console.log(err);
    }

    console.log('The file was saved!');
  });
};

var download = async function(uri, filename, callback) {
  request.head(uri, function(err, res, body) {
    request(uri)
      .pipe(fs.createWriteStream(filename))
      .on('close', callback);
  });
};

const gamblePhoto = async function() {
  // Zrob liste wszystkich plikow
  const files = fs.readdirSync(collectionDefaultPath);
  let filteredCollection = [];
  // Pobierz nazwe aktualnej tapety
  const wallpaperPath = await wallpaper.get();
  const wallpaperPhoto = wallpaperPath.replace(collectionDefaultPath, '');
  writeFile(wallpaperPath + '\n' + wallpaperPhoto);
  // Przemapuj wszystkie pliki wylaczajac aktualna tapete oraz te ktore sa unliked
  await files.forEach(function(el) {
    if (!el.includes(banWorld) && el !== wallpaperPhoto) filteredCollection.push(el);
  });

  if (filteredCollection.length > 0) {
    // Wylosuj zdjecie z nowej kolekcji i ustaw jako tapete
    const collectionLength = await filteredCollection.length;

    const rand = Math.floor(Math.random() * collectionLength);
    // for(let i = 0; i < 10; i++)  console.log(Math.floor(Math.random() * collectionLength));
    await wallpaper.set(collectionDefaultPath + '/' + filteredCollection[rand]);
  }

  clearInterval(interval);

  changeWallpaper();
};
