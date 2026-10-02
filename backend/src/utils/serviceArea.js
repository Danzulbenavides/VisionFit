/*
 * Delivery service area: Dagupan City only.
 */

export const SERVICE_AREA = Object.freeze({
  city: "Dagupan City",
  province: "Pangasinan",
  country: "Philippines",
  postalCode: "2400",
});

export const DAGUPAN_BARANGAYS = Object.freeze([
  "Bacayao Norte",
  "Bacayao Sur",
  "Barangay I (T. Bugallon)",
  "Barangay II (Nueva)",
  "Barangay IV (Zamora)",
  "Bolosan",
  "Bonuan Binloc",
  "Bonuan Boquig",
  "Bonuan Gueset",
  "Calmay",
  "Carael",
  "Caranglaan",
  "Herrero-Perez",
  "Lasip Chico",
  "Lasip Grande",
  "Lomboy",
  "Lucao",
  "Malued",
  "Mamalingling",
  "Mangin",
  "Mayombo",
  "Pantal",
  "Poblacion Oeste",
  "Pogo Chico",
  "Pogo Grande",
  "Pugaro Suit",
  "Salapingao",
  "Salisay",
  "Tambac",
  "Tapuac",
  "Tebeng",
]);

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const CITY_ALIASES = new Set(["dagupan", "dagupan city", "city of dagupan"]);

export const isDagupanCity = (city) => CITY_ALIASES.has(normalize(city));

export const findBarangay = (input) => {
  const target = normalize(input);

  if (!target) return null;

  return DAGUPAN_BARANGAYS.find((name) => normalize(name) === target) || null;
};

export const isInServiceArea = (address) => {
  if (!address || !isDagupanCity(address.city)) return false;

  const province = normalize(address.province);

  return province === "" || province === "pangasinan";
};

export const OUTSIDE_SERVICE_AREA_MESSAGE =
  "We currently deliver only within Dagupan City. Please use a delivery address in Dagupan City.";