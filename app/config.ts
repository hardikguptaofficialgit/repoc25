const isMobile =
  typeof globalThis === "undefined" ? false : globalThis.innerWidth < 640;

const config = {
  geoCodingApi: "https://nominatim.openstreetmap.org",
  routingApi: "https://router.project-osrm.org/route/v1",
  mapConfig: {
    center: [85.8193, 20.3547], // KIIT Campus 25, Bhubaneswar, India
    zoom: isMobile ? 17 : 18.5,
    bearing: 0,
    pitch: 45,
    maxBounds: [
      [85.815, 20.350], // Southwest corner
      [85.825, 20.360], // Northeast corner
    ],
  } as maplibregl.MapOptions,
  mapStyles: {
    light: "https://tiles.openfreemap.org/styles/bright",
    dark: "/styles/dark/style.json",
  },
};

export default config;
