/**
 * internationalStudents.js – FICTIONAL international students by country of
 * origin, keyed by the ISO 3166 numeric id used in world-atlas.
 * `city` ([longitude, latitude]) marks where the globe's flight arcs start.
 */
export const MELBOURNE = [144.9631, -37.8136];

export const studentsByCountry = new Map(Object.entries({
  156: { name: 'China', students: 4800, city: [116.4, 39.9] },
  356: { name: 'India', students: 5200, city: [77.2, 28.6] },
  524: { name: 'Nepal', students: 2100, city: [85.3, 27.7] },
  704: { name: 'Vietnam', students: 1500, city: [105.8, 21.0] },
  360: { name: 'Indonesia', students: 900, city: [106.8, -6.2] },
  458: { name: 'Malaysia', students: 1100, city: [101.7, 3.1] },
  144: { name: 'Sri Lanka', students: 850, city: [79.9, 6.9] },
  608: { name: 'Philippines', students: 650, city: [121.0, 14.6] },
  170: { name: 'Colombia', students: 380, city: [-74.1, 4.7] },
  404: { name: 'Kenya', students: 260, city: [36.8, -1.3] },
  682: { name: 'Saudi Arabia', students: 300, city: [46.7, 24.7] },
  840: { name: 'United States', students: 260, city: [-118.2, 34.1] },
  586: { name: 'Pakistan', students: 700 },
  '050': { name: 'Bangladesh', students: 520 },
  764: { name: 'Thailand', students: 430 },
  '076': { name: 'Brazil', students: 310 },
  566: { name: 'Nigeria', students: 240 },
  392: { name: 'Japan', students: 180 },
  410: { name: 'South Korea', students: 220 },
  364: { name: 'Iran', students: 210 },
  496: { name: 'Mongolia', students: 150 },
  116: { name: 'Cambodia', students: 170 },
  104: { name: 'Myanmar', students: 120 },
  152: { name: 'Chile', students: 140 },
  484: { name: 'Mexico', students: 90 },
  124: { name: 'Canada', students: 110 },
  826: { name: 'United Kingdom', students: 190 },
  276: { name: 'Germany', students: 130 },
  250: { name: 'France', students: 95 },
  380: { name: 'Italy', students: 60 },
  578: { name: 'Norway', students: 70 },
  752: { name: 'Sweden', students: 55 },
  818: { name: 'Egypt', students: 80 },
  288: { name: 'Ghana', students: 75 },
  604: { name: 'Peru', students: 65 },
  398: { name: 'Kazakhstan', students: 90 },
  792: { name: 'Turkey', students: 85 },
  554: { name: 'New Zealand', students: 140 },
  '064': { name: 'Bhutan', students: 160 },
  158: { name: 'Taiwan', students: 200 },
}));

/** The countries with a `city` – the origins of the arcs on the globe. */
export const origins = [...studentsByCountry.entries()]
  .filter(([, d]) => d.city)
  .map(([id, d]) => ({ id, ...d }));
