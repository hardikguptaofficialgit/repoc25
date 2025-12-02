import { CustomLayerInterface, Map } from "maplibre-gl";
import { IndoorFeature, IndoorMapGeoJSON } from "~/types/geojson";

export default class IndoorMapLayer implements CustomLayerInterface {
  id: string = "indoor-map";
  type = "custom" as const;
  private map: Map | null = null;
  private indoorMapData: IndoorMapGeoJSON;
  private theme;
  private hoveredRoomId: number | null = null;

  constructor(indoorMapData: IndoorMapGeoJSON, theme: string = "light") {
    this.indoorMapData = indoorMapData;
    this.theme = theme;
  }

  render = () => {
    // Rendering is handled by maplibre's internal renderer for geojson sources
  };

  setFloorLevel(level: number) {
    if (!this.map || !this.indoorMapData) return;

    const source = this.map.getSource("indoor-map") as maplibregl.GeoJSONSource;
    const filteredFeatures = this.indoorMapData.features.filter(
      (feature: IndoorFeature) =>
        feature.properties.level_id === level ||
        feature.properties.level_id === null,
    );

    source.setData({
      type: "FeatureCollection",
      features: filteredFeatures,
    });
  }

  async getAvailableFloors(): Promise<number[]> {
    const floors = new Set<number>();
    this.indoorMapData!.features.forEach((feature) => {
      if (feature.properties.level_id !== null) {
        floors.add(feature.properties.level_id);
      }
    });

    const uniqueFloors = [...floors];
    if (!uniqueFloors.includes(0)) {
      uniqueFloors.push(0);
    }
    return uniqueFloors;
  }

  async onAdd(map: Map): Promise<void> {
    this.map = map;

    const lightColor = {
      unit: "#f3f3f3",
      unit_hovered: "#e0e0e0",
      corridor: "#d6d5d1",
      outline: "#a6a5a2",
      washroom: "#e3f2fd",
      cafeteria: "#fff3e0",
      lab: "#f3e5f5",
      admin: "#e8f5e9",
      auditorium: "#fce4ec",
    };

    const darkColor = {
      unit: "#1f2937",
      unit_hovered: "#374151",
      corridor: "#030712",
      outline: "#1f2937",
      washroom: "#1a237e",
      cafeteria: "#e65100",
      lab: "#4a148c",
      admin: "#1b5e20",
      auditorium: "#880e4f",
    };

    const colors = this.theme === "dark" ? darkColor : lightColor;

    map.addSource("indoor-map", {
      type: "geojson",
      data: this.indoorMapData,
    });

    // Base fill layer for all polygons
    map.addLayer({
      id: "indoor-map-fill",
      type: "fill",
      source: "indoor-map",
      paint: {
        "fill-color": [
          "case",
          ["==", ["get", "category"], "restroom"], colors.washroom,
          ["==", ["get", "category"], "food"], colors.cafeteria,
          ["==", ["get", "category"], "lab"], colors.lab,
          ["==", ["get", "category"], "admin"], colors.admin,
          ["==", ["get", "category"], "auditorium"], colors.auditorium,
          ["==", ["get", "feature_type"], "corridor"], colors.corridor,
          ["coalesce", ["get", "fill"], colors.corridor]
        ],
        "fill-opacity": [
          "case",
          ["==", ["get", "feature_type"], "corridor"], 0.3,
          0.5
        ],
      },
      filter: ["==", ["geometry-type"], "Polygon"],
    });

    // Outline layer for all polygons
    map.addLayer({
      id: "indoor-map-fill-outline",
      type: "line",
      source: "indoor-map",
      paint: {
        "line-color": ["coalesce", ["get", "stroke"], colors.outline],
        "line-width": [
          "case",
          ["==", ["get", "feature_type"], "building"], 3,
          ["coalesce", ["get", "stroke-width"], 1.5]
        ],
        "line-opacity": ["coalesce", ["get", "stroke-opacity"], 1],
      },
      filter: ["==", ["geometry-type"], "Polygon"],
    });

    // 3D extrusion for units (rooms, labs, etc.)
    map.addLayer({
      id: "indoor-map-extrusion",
      type: "fill-extrusion",
      source: "indoor-map",
      filter: ["all",
        ["==", "feature_type", "unit"],
        ["!=", ["get", "category"], "restroom"]
      ],
      paint: {
        "fill-extrusion-color": [
          "case",
          ["boolean", ["feature-state", "hover"], false],
          colors.unit_hovered,
          [
            "case",
            ["==", ["get", "category"], "food"], colors.cafeteria,
            ["==", ["get", "category"], "lab"], colors.lab,
            ["==", ["get", "category"], "admin"], colors.admin,
            ["==", ["get", "category"], "auditorium"], colors.auditorium,
            colors.unit
          ]
        ],
        "fill-extrusion-height": [
          "case",
          ["==", ["get", "category"], "auditorium"], 4,
          ["coalesce", ["get", "height"], 2.5]
        ],
        "fill-extrusion-opacity": 0.8,
      },
    });

    // Lower extrusion for corridors
    map.addLayer({
      id: "indoor-map-corridor-extrusion",
      type: "fill-extrusion",
      source: "indoor-map",
      filter: ["all", ["==", "feature_type", "corridor"]],
      paint: {
        "fill-extrusion-color": colors.corridor,
        "fill-extrusion-height": 0.1,
        "fill-extrusion-opacity": 0.6,
      },
    });

    // Line layer for corridors (LineString)
    map.addLayer({
      id: "indoor-map-corridor-line",
      type: "line",
      source: "indoor-map",
      filter: ["all",
        ["==", ["geometry-type"], "LineString"],
        ["any",
          ["==", ["get", "feature_type"], "corridor"],
          ["==", ["get", "type"], "corridor"]
        ]
      ],
      layout: {
        "line-cap": "round",
        "line-join": "round"
      },
      paint: {
        "line-color": colors.corridor,
        "line-width": 8,
        "line-opacity": 1
      }
    });

    // Symbol layer for room labels
    map.addLayer({
      id: "indoor-map-labels",
      type: "symbol",
      source: "indoor-map",
      minzoom: 17,
      filter: ["all",
        ["has", "name"],
        ["==", ["get", "feature_type"], "unit"]
      ],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 12,
        "text-max-width": 10
      },
      paint: {
        "text-color": this.theme === "dark" ? "#ffffff" : "#000000",
        "text-halo-color": this.theme === "dark" ? "#000000" : "#ffffff",
        "text-halo-width": 1
      }
    });

    // Special styling for washrooms
    map.addLayer({
      id: "indoor-map-washroom",
      type: "fill-extrusion",
      source: "indoor-map",
      filter: ["all",
        ["==", "feature_type", "unit"],
        ["==", ["get", "category"], "restroom"]
      ],
      paint: {
        "fill-extrusion-color": colors.washroom,
        "fill-extrusion-height": 2.5,
        "fill-extrusion-opacity": 0.7,
      },
    });

    // Hover interaction for rooms
    map.on("mousemove", "indoor-map-extrusion", (e) => {
      if (e.features && e.features.length > 0) {
        map.getCanvas().style.cursor = "pointer";

        if (this.hoveredRoomId !== null) {
          map.setFeatureState(
            { source: "indoor-map", id: this.hoveredRoomId },
            { hover: false },
          );
        }
        this.hoveredRoomId = e.features[0].id as number;
        map.setFeatureState(
          { source: "indoor-map", id: this.hoveredRoomId },
          { hover: true },
        );
      }
    });

    map.on("mouseleave", "indoor-map-extrusion", () => {
      map.getCanvas().style.cursor = "";

      if (this.hoveredRoomId !== null) {
        map.setFeatureState(
          { source: "indoor-map", id: this.hoveredRoomId },
          { hover: false },
        );
        this.hoveredRoomId = null;
      }
    });

    // Hover interaction for washrooms
    map.on("mousemove", "indoor-map-washroom", (e) => {
      if (e.features && e.features.length > 0) {
        map.getCanvas().style.cursor = "pointer";

        if (this.hoveredRoomId !== null) {
          map.setFeatureState(
            { source: "indoor-map", id: this.hoveredRoomId },
            { hover: false },
          );
        }
        this.hoveredRoomId = e.features[0].id as number;
      }
    });

    map.on("mouseleave", "indoor-map-washroom", () => {
      map.getCanvas().style.cursor = "";

      if (this.hoveredRoomId !== null) {
        map.setFeatureState(
          { source: "indoor-map", id: this.hoveredRoomId },
          { hover: false },
        );
        this.hoveredRoomId = null;
      }
    });
  }
}