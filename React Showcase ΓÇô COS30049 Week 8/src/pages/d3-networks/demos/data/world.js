/**
 * world.js – country shapes for the maps, from the world-atlas package.
 *
 * world-atlas ships TopoJSON: a compact format where neighbouring countries
 * SHARE their border lines. topojson-client converts it to the GeoJSON that
 * d3-geo understands:
 *   feature(topology, object) → GeoJSON features (one per country)
 *   mesh(topology, object, filter) → one line geometry (here: internal borders only)
 */
import { feature, mesh } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';

export const countries = feature(world, world.objects.countries).features; // 177 countries, id = ISO 3166 numeric
export const land = feature(world, world.objects.land);
export const borders = mesh(world, world.objects.countries, (a, b) => a !== b); // a !== b → shared borders, no coastlines
