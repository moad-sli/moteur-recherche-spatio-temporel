'use strict';

// prettier-ignore

const form = document.querySelectorAll('.form');
const inputType = document.querySelector('.form__input--type');
const volume = document.querySelector('.form__input--volume');
const poid = document.querySelector('.form__input--poid');
const longueur = document.querySelector('.form__input--longueur');
const largeur = document.querySelector('.form__input--largeur');
const dateDepMin = document.querySelector('.from__depart--min');
const dateDepMax = document.querySelector('.form__depart--max');
const dateArrMin = document.querySelector('.form__arrivée--min');
const dateArrMax = document.querySelector('.form__arrivée--max');
const botona = document.getElementById('botona');
/* average des ventes dans chaque depots*/
let average = [167, 135, 193, 170, 154, 113, 112, 103, 182, 157];
/*unscale coefficients*/
let unscaler = [
  1, 54, 50, 58, 52, 54, 40, 37, 40, 59, 51, 120, 115, 150, 131, 133, 87, 91,
  80, 145, 126, 80, 70, 94, 79, 80, 59, 61, 60, 104, 80, 55, 43, 66, 54, 54, 40,
  39, 34, 56, 51, 54, 50, 58, 52, 54, 40, 37, 40, 59, 51, 120, 115, 150, 131,
  133, 87, 91, 80, 145, 126, 80, 70, 94, 79, 80, 59, 61, 60, 104, 80, 55, 43,
  66, 54, 54, 40, 39, 34, 56, 51,
];
/*liste des coordonées des depots*/
let depot = [
  [34.031323498178125, -6.756592467427255],
  [34.32234649375019, -2.032471373677254],
  [33.95658763328517, -5.420653894543648],
  [31.899186550513217, -4.322021082043649],
  [28.919048474946564, -9.832763671875002],
  [30.598545160934517, -9.250488281250002],
  [33.64123728666899, -7.410278320312501],
  [35.66947551592857, -5.785400792956353],
  [30.327078386410086, -5.765625201165676],
  [31.606877330342904, -7.866210602223874],
];
/*definition d'arrya pour cree un tensor servit pour la prediction*/
var way = [];
var tensor = null;
var route = null;
/*load map*/
var map = L.map('map').setView([30.020882, -6.84165], 7);
var current = 0;
var numb = 1;
/*liste des marker start et end*/
var marker = [];
L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}
function remove_marker(i, marker, m) {
  for (let j = i; j < marker.length; j++) {
    m.removeLayer(marker[j]);
  }
  if (i > 0) {
    marker = marker.slice(0, i);
  } else {
    marker = [];
  }
  return marker;
}
/*choisir la position de depart et arrivée par click sur l'ecran*/
map.on('click', function (mapEvent) {
  if (numb === 3) {
    marker = remove_marker(0, marker, map);
    if (route != null) {
      map.removeControl(route);
    }
    /*map.removeControl(route_direct);*/
    numb = 1;
    /*affichage de la barre a remplir apres le choix des position*/
    for (let k = 0; k < form.length; k++) {
      form[k].classList.add('hidden');
    }
  }
  /*affichage des markers sur l'ecran*/
  const { lat, lng } = mapEvent.latlng;
  marker.push(
    L.marker([lat, lng])
      .addTo(map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        })
      )
      .setPopupContent(current === 0 ? 'start' : 'end')
      .openPopup()
  );
  numb++;
  current = current === 0 ? 1 : 0;
  /*show marker start/end et la barre des données*/
  if (marker.length === 2) {
    for (let k = 0; k < form.length; k++) {
      form[k].classList.remove('hidden');
    }

    volume.focus();
  }
});
var prediction = null;

/*==================PREDICTION DE ROUTE ET MARCHANDISES===========*/

botona.addEventListener('click', function (e) {
  if (route != null) {
    map.removeControl(route);
  }
  if (marker.length > 2) {
    marker = remove_marker(2, marker, map);
  }
  var date = new Date($('#start_min').val());
  var tensor_list = [
    0.51851852, 0.28, 0.4137931, 0.5, 0.27777778, 0.3, 0.40540541, 0.3,
    0.37288136, 0.50980392, 0.60833333, 0.40869565, 0.42, 0.48854962,
    0.39097744, 0.55172414, 0.48351648, 0.5625, 0.46896552, 0.43650794, 0.475,
    0.41428571, 0.60638298, 0.53164557, 0.5125, 0.45762712, 0.47540984, 0.25,
    0.47115385, 0.65, 0.50909091, 0.34883721, 0.39393939, 0.48148148,
    0.37037037, 0.425, 0.43589744, 0.38235294, 0.51785714, 0.33333333, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ];
  tensor_list[40 + date.getDay()] = 1;
  tensor_list[47 + date.getMonth()] = 1;
  tensor = tf.tensor(tensor_list, [1, 1, 59]);
  prediction = model.predict(tensor).data();
  var item_store = []; /*ventes des items dans chaque store*/
  var sales_store = []; /* ventes totales dans chaque store*/
  prediction.then(function (result) {
    item_store = result;
    /*unscale prediction result*/
    for (let i = 0; i < item_store.length; i++) {
      item_store[i] = item_store[i] * unscaler.slice(20, 60)[i];
    }

    for (let k = 0; k < 10; k++) {
      sales_store[k] = Math.floor(
        item_store[k] +
          item_store[k + 10] +
          item_store[k + 20] +
          item_store[k + 30]
      );

      /*choix des depots dont les ventes depassent l'average*/
      if (sales_store[k] > average[k] + 10) {
        marker.push(
          L.marker(depot[k])
            .addTo(map)
            .bindPopup(
              L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: 'running-popup',
              })
            )
            .setPopupContent(
              'item1:' +
                Math.floor(item_store[k]) +
                '\n' +
                'item2:' +
                Math.floor(item_store[k + 10]) +
                '\n' +
                'item3:' +
                Math.floor(item_store[k + 20]) +
                '\n' +
                'item4:' +
                Math.floor(item_store[k + 30])
            )
            .openPopup()
        );
      }
    }
    way = [];
    way.push(L.latLng(marker[0]._latlng['lat'], marker[0]._latlng['lng']));
    var mini = 0;
    var done = [];
    var dist = Infinity;
    if (marker.length >= 2) {
      for (let k = 2; k < marker.length; k++) {
        dist = Infinity;
        for (let c = 2; c < marker.length; c++) {
          if (done.includes(c) == false) {
            if (
              dist >
              getDistanceFromLatLonInKm(
                marker[c]._latlng['lat'],
                marker[c]._latlng['lng'],
                marker[mini]._latlng['lat'],
                marker[mini]._latlng['lng']
              )
            ) {
              dist = getDistanceFromLatLonInKm(
                marker[c]._latlng['lat'],
                marker[c]._latlng['lng'],
                marker[mini]._latlng['lat'],
                marker[mini]._latlng['lng']
              );
              mini = c;
            }
          }
        }
        done.push(mini);
        way.push(
          L.latLng(marker[mini]._latlng['lat'], marker[mini]._latlng['lng'])
        );
      }
    }
    way.push(L.latLng(marker[1]._latlng['lat'], marker[1]._latlng['lng']));
    console.log(marker);
    route = L.Routing.control({
      waypoints: way,
      show: false,
    }).addTo(map);
  });
});

/* =====================================LOAD MODEL============================*/
let model;
(async function () {
  model = await tf.loadLayersModel('tfjs-models/lstmC/model.json', false);
})();
