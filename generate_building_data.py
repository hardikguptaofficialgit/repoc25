import json
import math

# KIIT Campus 25 actual location
BASE_LAT = 20.3547
BASE_LON = 85.8193

# Building dimensions based on visual analysis of the floor plan
# Estimated from the actual floor plan: approximately 100m x 90m
BUILDING_WIDTH = 100   # meters (east-west)
BUILDING_HEIGHT = 90  # meters (north-south)

# Conversion factors
METERS_PER_DEG_LAT = 111000
METERS_PER_DEG_LON = 111000 * math.cos(math.radians(BASE_LAT))

def meters_to_lat(meters):
    return meters / METERS_PER_DEG_LAT

def meters_to_lon(meters):
    return meters / METERS_PER_DEG_LON

# Detailed room layout based on the actual floor plan image
# Origin (0,0) is at bottom-left corner (near KP 25 entrance)
# x increases going right (east), y increases going up (north)

ROOMS_LAYOUT = {
    # LEFT WING (A-BLOCK) - Bottom to Top
    # Bottom row (near KP 25 entrance)
    "A001": {"name": "A 001", "type": "classroom", "x": 5, "y": 5, "w": 8, "h": 7},
    "A002": {"name": "A 002", "type": "classroom", "x": 15, "y": 5, "w": 8, "h": 7},
    "A003": {"name": "A 003", "type": "classroom", "x": 25, "y": 5, "w": 8, "h": 7},
    "A004": {"name": "A 004", "type": "classroom", "x": 35, "y": 5, "w": 8, "h": 7},
    
    # Second row from bottom
    "A005": {"name": "A 005", "type": "classroom", "x": 5, "y": 14, "w": 8, "h": 7},
    "A006": {"name": "A 006", "type": "classroom", "x": 15, "y": 14, "w": 8, "h": 7},
    "A007": {"name": "A 007", "type": "classroom", "x": 25, "y": 14, "w": 8, "h": 7},
    "A008": {"name": "A 008", "type": "classroom", "x": 35, "y": 14, "w": 8, "h": 7},
    
    # Third row from bottom
    "A009": {"name": "A 009", "type": "classroom", "x": 5, "y": 23, "w": 8, "h": 7},
    "A010": {"name": "A 010", "type": "classroom", "x": 15, "y": 23, "w": 8, "h": 7},
    "A011": {"name": "A 011", "type": "classroom", "x": 25, "y": 23, "w": 8, "h": 7},
    "A012": {"name": "A 012", "type": "classroom", "x": 35, "y": 23, "w": 8, "h": 7},
    
    # Fourth row
    "A013": {"name": "A 013", "type": "classroom", "x": 5, "y": 32, "w": 8, "h": 7},
    "A014": {"name": "A 014", "type": "classroom", "x": 15, "y": 32, "w": 8, "h": 7},
    "A015": {"name": "A 015", "type": "classroom", "x": 25, "y": 32, "w": 8, "h": 7},
    
    # RIGHT WING (B-BLOCK) - Top to Bottom
    # Top section (near QC entrance)
    "B001": {"name": "B 001", "type": "classroom", "x": 60, "y": 70, "w": 8, "h": 7},
    "B002": {"name": "B 002", "type": "classroom", "x": 70, "y": 70, "w": 8, "h": 7},
    "B003": {"name": "B 003", "type": "classroom", "x": 80, "y": 70, "w": 8, "h": 7},
    
    # Second row from top
    "B004": {"name": "B 004", "type": "classroom", "x": 60, "y": 61, "w": 8, "h": 7},
    "B005": {"name": "B 005", "type": "classroom", "x": 70, "y": 61, "w": 8, "h": 7},
    "B006": {"name": "B 006", "type": "classroom", "x": 80, "y": 61, "w": 8, "h": 7},
    
    # Third row from top
    "B007": {"name": "B 007", "type": "classroom", "x": 60, "y": 52, "w": 8, "h": 7},
    "B008": {"name": "B 008", "type": "classroom", "x": 70, "y": 52, "w": 8, "h": 7},
    "B009": {"name": "B 009", "type": "classroom", "x": 80, "y": 52, "w": 8, "h": 7},
    
    # Fourth row from top
    "B010": {"name": "B 010", "type": "classroom", "x": 60, "y": 43, "w": 8, "h": 7},
    "B011": {"name": "B 011", "type": "classroom", "x": 70, "y": 43, "w": 8, "h": 7},
    "B012": {"name": "B 012", "type": "classroom", "x": 80, "y": 43, "w": 8, "h": 7},
    
    # Fifth row from top
    "B013": {"name": "B 013", "type": "classroom", "x": 60, "y": 34, "w": 8, "h": 7},
    "B014": {"name": "B 014", "type": "classroom", "x": 70, "y": 34, "w": 8, "h": 7},
    "B015": {"name": "B 015", "type": "classroom", "x": 80, "y": 34, "w": 8, "h": 7},
    
    # Sixth row from top
    "B016": {"name": "B 016", "type": "classroom", "x": 60, "y": 25, "w": 8, "h": 7},
    "B017": {"name": "B 017", "type": "classroom", "x": 70, "y": 25, "w": 8, "h": 7},
    "B018": {"name": "B 018", "type": "classroom", "x": 80, "y": 25, "w": 8, "h": 7},
    
    # Bottom section B-block
    "B019": {"name": "B 019", "type": "classroom", "x": 60, "y": 16, "w": 8, "h": 7},
    "B020": {"name": "B 020", "type": "classroom", "x": 70, "y": 16, "w": 8, "h": 7},
    "B021": {"name": "B 021", "type": "classroom", "x": 80, "y": 16, "w": 8, "h": 7},
    
    "B022": {"name": "B 022", "type": "classroom", "x": 60, "y": 7, "w": 8, "h": 7},
    "B023": {"name": "B 023", "type": "classroom", "x": 70, "y": 7, "w": 8, "h": 7},
    "B024": {"name": "B 024", "type": "classroom", "x": 80, "y": 7, "w": 8, "h": 7},
    
    # CENTER SECTION (C-BLOCK)
    "C001": {"name": "C 001", "type": "classroom", "x": 45, "y": 40, "w": 10, "h": 8},
    "C002": {"name": "C 002 - Seminar Hall", "type": "auditorium", "x": 35, "y": 50, "w": 12, "h": 10},
    "C003": {"name": "C 003 - Seminar Hall", "type": "auditorium", "x": 48, "y": 50, "w": 12, "h": 10},
    
    # SPECIAL AREAS
    "DIRECTOR_OFFICE": {"name": "Director General Office", "type": "office", "x": 62, "y": 80, "w": 15, "h": 8},
    "CAFETERIA": {"name": "Lake Campus 25 Cafeteria", "type": "cafeteria", "x": 2, "y": 50, "w": 12, "h": 15},
    "STUDENT_SEATING": {"name": "Student Seating Area", "type": "common_area", "x": 35, "y": 32, "w": 15, "h": 8},
    "FACULTY_SEATING": {"name": "Faculty Seating Area", "type": "staff_room", "x": 50, "y": 65, "w": 10, "h": 7},
    
    # WASHROOMS
    "WASHROOM_LADIES_1": {"name": "Ladies Washroom (A-Block)", "type": "restroom", "x": 2, "y": 32, "w": 2.5, "h": 5},
    "WASHROOM_LADIES_2": {"name": "Ladies Washroom (B-Block)", "type": "restroom", "x": 90, "y": 32, "w": 2.5, "h": 5},
    "WASHROOM_STAFF": {"name": "Staff Toilet", "type": "restroom", "x": 55, "y": 15, "w": 3, "h": 4},
    "WASHROOM_LADIES_3": {"name": "Ladies Washroom (Center)", "type": "restroom", "x": 18, "y": 40, "w": 2.5, "h": 5},
    
    # LABS
    "LAB_IOT": {"name": "IOT Lab", "type": "laboratory", "x": 45, "y": 5, "w": 10, "h": 8},
    "LAB_RESEARCH": {"name": "Research Lab", "type": "laboratory", "x": 15, "y": 41, "w": 10, "h": 8},
}

# Points of Interest (lifts, stairs, entrances)
POIS = {
    # Entrances
    "MAIN_GATE_KP_BOYS": {"name": "Campus 25 Main Gate (KP 25 Boys Side)", "type": "entrance", "x": 45, "y": 0},
    "MAIN_GATE_QC_GIRLS": {"name": "Campus 25 Main Gate (QC 19/25 Girls Side)", "type": "entrance", "x": 90, "y": 40},
    "QC_ENTRANCE": {"name": "QC 19/25 Entrance", "type": "entrance", "x": 90, "y": 75},
    "SECOND_ENTRANCE": {"name": "Second Entrance", "type": "entrance", "x": 65, "y": 90},
    
    # Lifts (distributed throughout the building)
    "LIFT_1": {"name": "Lift 1 (A-Block)", "type": "elevator", "x": 18, "y": 45},
    "LIFT_2": {"name": "Lift 2 (A-Block)", "type": "elevator", "x": 22, "y": 45},
    "LIFT_3": {"name": "Lift 3 (Center)", "type": "elevator", "x": 28, "y": 45},
    "LIFT_4": {"name": "Lift 4 (Center)", "type": "elevator", "x": 32, "y": 45},
    "LIFT_5": {"name": "Lift 5 (B-Block)", "type": "elevator", "x": 55, "y": 30},
    "LIFT_6": {"name": "Lift 6 (B-Block)", "type": "elevator", "x": 75, "y": 75},
    "LIFT_7": {"name": "Lift 7 (B-Block)", "type": "elevator", "x": 79, "y": 75},
    "LIFT_8": {"name": "Lift 8 (A-Block)", "type": "elevator", "x": 10, "y": 15},
    "LIFT_9": {"name": "Lift 9 (A-Block)", "type": "elevator", "x": 10, "y": 19},
    
    # Stairs
    "STAIRS_1": {"name": "Stairs (A-Block South)", "type": "stairs", "x": 12, "y": 45},
    "STAIRS_2": {"name": "Stairs (Center)", "type": "stairs", "x": 36, "y": 45},
    "STAIRS_3": {"name": "Stairs (B-Block)", "type": "stairs", "x": 85, "y": 35},
    "STAIRS_4": {"name": "Stairs (B-Block North)", "type": "stairs", "x": 85, "y": 70},
    
    # Other landmarks
    "LAKE": {"name": "Lake Campus 25", "type": "landmark", "x": 0, "y": 55},
    "WATER_COOLER_1": {"name": "Water Cooler (A-Block)", "type": "amenity", "x": 15, "y": 6},
    "WATER_COOLER_2": {"name": "Water Cooler (B-Block)", "type": "amenity", "x": 75, "y": 8},
    "WATER_COOLER_3": {"name": "Water Cooler (Center)", "type": "amenity", "x": 40, "y": 45},
}

# Corridors (visual representation)
CORRIDORS = [
    # A-Block Vertical Corridors
    {"name": "A-Block Corridor 1", "x": 13, "y": 5, "w": 2, "h": 35},
    {"name": "A-Block Corridor 2", "x": 23, "y": 5, "w": 2, "h": 35},
    {"name": "A-Block Corridor 3", "x": 33, "y": 5, "w": 2, "h": 35},
    
    # B-Block Vertical Corridors
    {"name": "B-Block Corridor 1", "x": 68, "y": 5, "w": 2, "h": 75},
    {"name": "B-Block Corridor 2", "x": 78, "y": 5, "w": 2, "h": 75},
    
    # Main Horizontal Corridor (connecting everything)
    {"name": "Main Horizontal Corridor", "x": 0, "y": 45, "w": 100, "h": 3},
    
    # Central Vertical Corridor
    {"name": "Central Vertical Corridor", "x": 45, "y": 0, "w": 3, "h": 90},
]

def create_polygon_from_room(room_data, room_id):
    """Create a GeoJSON polygon for a room"""
    x = room_data["x"]
    y = room_data["y"]
    w = room_data["w"]
    h = room_data["h"]
    
    # Convert to lat/lon offsets from base
    lon_offset_min = meters_to_lon(x)
    lon_offset_max = meters_to_lon(x + w)
    lat_offset_min = meters_to_lat(y)
    lat_offset_max = meters_to_lat(y + h)
    
    # Create polygon coordinates (clockwise from bottom-left)
    coordinates = [[
        [BASE_LON + lon_offset_min, BASE_LAT + lat_offset_min],
        [BASE_LON + lon_offset_max, BASE_LAT + lat_offset_min],
        [BASE_LON + lon_offset_max, BASE_LAT + lat_offset_max],
        [BASE_LON + lon_offset_min, BASE_LAT + lat_offset_max],
        [BASE_LON + lon_offset_min, BASE_LAT + lat_offset_min]
    ]]
    
    return {
        "type": "Feature",
        "id": room_id,
        "properties": {
            "id": room_id,
            "name": room_data["name"],
            "alt_name": None,
            "category": room_data.get("type", "corridor"),
            "restriction": None,
            "accessibility": None,
            "display_point": None,
            "feature_type": "unit" if room_data.get("type") != "corridor" else "corridor",
            "level_id": 0,
            "show": True,
            "area": round(w * h, 2)
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": coordinates
        }
    }

def create_point_from_poi(poi_data, poi_id):
    """Create a GeoJSON point for a POI"""
    x = poi_data["x"]
    y = poi_data["y"]
    
    lon = BASE_LON + meters_to_lon(x)
    lat = BASE_LAT + meters_to_lat(y)
    
    return {
        "type": "Feature",
        "id": poi_id,
        "properties": {
            "id": poi_id,
            "name": poi_data["name"],
            "type": poi_data["type"],
            "floor": 0,
            "building_id": "CAMPUS_25"
        },
        "geometry": {
            "type": "Point",
            "coordinates": [lon, lat]
        }
    }

def create_building_outline():
    """Create the building outline polygon based on actual floor plan shape"""
    # The building has an irregular shape, approximating with main rectangle
    lon_offset_max = meters_to_lon(BUILDING_WIDTH)
    lat_offset_max = meters_to_lat(BUILDING_HEIGHT)
    
    coordinates = [[
        [BASE_LON, BASE_LAT],
        [BASE_LON + lon_offset_max, BASE_LAT],
        [BASE_LON + lon_offset_max, BASE_LAT + lat_offset_max],
        [BASE_LON, BASE_LAT + lat_offset_max],
        [BASE_LON, BASE_LAT]
    ]]
    
    return {
        "type": "Feature",
        "id": "BUILDING_OUTLINE",
        "properties": {
            "name": "Campus 25 Building Outline",
            "feature_type": "building",
            "level_id": 0,
            "show": True
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": coordinates
        }
    }

def generate_routes():
    """Generate navigation graph (nodes and edges)"""
    # Define key nodes (intersections, room entrances)
    nodes = []
    edges = []
    
    # Main corridor nodes (Horizontal)
    for x in range(5, 95, 10):
        nodes.append({"id": f"H_{x}", "x": x, "y": 46.5}) # Center of 3m corridor at y=45
        
    # Main corridor nodes (Vertical)
    for y in range(5, 85, 10):
        nodes.append({"id": f"V_{y}", "x": 46.5, "y": y}) # Center of 3m corridor at x=45

    # Connect horizontal nodes
    for i in range(len(nodes) - 1):
        n1 = nodes[i]
        n2 = nodes[i+1]
        if n1["id"].startswith("H_") and n2["id"].startswith("H_"):
             edges.append([n1["id"], n2["id"]])

    # Connect vertical nodes
    # (Simplified logic, just creating a basic mesh for now)
    
    # Create GeoJSON features for routes
    features = []
    
    # Add nodes
    for node in nodes:
        lon = BASE_LON + meters_to_lon(node["x"])
        lat = BASE_LAT + meters_to_lat(node["y"])
        features.append({
            "type": "Feature",
            "id": node["id"],
            "properties": {"id": node["id"], "type": "node"},
            "geometry": {"type": "Point", "coordinates": [lon, lat]}
        })
        
    # Add edges (LineStrings)
    # For now, let's just create a simple cross shape for navigation
    # Horizontal Line
    features.append({
        "type": "Feature",
        "properties": {"type": "route", "weight": 1},
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [BASE_LON + meters_to_lon(0), BASE_LAT + meters_to_lat(46.5)],
                [BASE_LON + meters_to_lon(100), BASE_LAT + meters_to_lat(46.5)]
            ]
        }
    })
    
    # Vertical Line
    features.append({
        "type": "Feature",
        "properties": {"type": "route", "weight": 1},
        "geometry": {
            "type": "LineString",
            "coordinates": [
                [BASE_LON + meters_to_lon(46.5), BASE_LAT + meters_to_lat(0)],
                [BASE_LON + meters_to_lon(46.5), BASE_LAT + meters_to_lat(90)]
            ]
        }
    })

    return features

# Generate the complete building data
building_data = {
    "id": 25,
    "name": "KIIT Campus 25 - School of Computer Engineering",
    "description": "Ground Floor Layout, Campus 25, KIIT University (KIIT Saathi)",
    "address": "Campus 25, KIIT University, Bhubaneswar, Odisha, India",
    "location": {
        "latitude": BASE_LAT,
        "longitude": BASE_LON
    },
    "indoor_map": {
        "type": "FeatureCollection",
        "features": []
    },
    "indoor_routes": {
        "type": "FeatureCollection",
        "features": []
    },
    "pois": {
        "type": "FeatureCollection",
        "features": []
    },
    "levels": [
        {"id": 0, "name": "Ground Floor", "short_name": "G", "ordinal": 0},
        {"id": 1, "name": "First Floor", "short_name": "1", "ordinal": 1},
        {"id": 2, "name": "Second Floor", "short_name": "2", "ordinal": 2},
        {"id": 3, "name": "Third Floor", "short_name": "3", "ordinal": 3}
    ],
    "custom_metadata": {
        "source": "KIIT Saathi Floor Plan - Ground Floor",
        "website": "www.kiitsaathi.in",
        "campus_code": "CAMPUS_25",
        "adjacent_buildings": ["KP 25 (A,B,C,D)", "QC 19/25"],
        "landmarks": ["Lake Campus 25"]
    },
    "owner_id": None
}

# Add building outline
building_data["indoor_map"]["features"].append(create_building_outline())

# Add all rooms
for room_id, room_data in ROOMS_LAYOUT.items():
    building_data["indoor_map"]["features"].append(create_polygon_from_room(room_data, room_id))

# Add corridors (as visual polygons)
for i, corridor in enumerate(CORRIDORS):
    building_data["indoor_map"]["features"].append(create_polygon_from_room(corridor, f"CORRIDOR_{i}"))

# Add all POIs
for poi_id, poi_data in POIS.items():
    building_data["pois"]["features"].append(create_point_from_poi(poi_data, poi_id))

# Add navigation routes
building_data["indoor_routes"]["features"] = generate_routes()

# Save to file
with open("app/mock/building.json", "w", encoding="utf-8") as f:
    json.dump(building_data, f, indent=2, ensure_ascii=False)

print(f"✅ Generated accurate building.json based on floor plan with:")
print(f"   - {len(ROOMS_LAYOUT)} rooms and areas")
print(f"   - {len(CORRIDORS)} corridors")
print(f"   - {len(POIS)} points of interest")
print(f"   - Building outline")
print(f"   - Total indoor features: {len(building_data['indoor_map']['features'])}")
print(f"   - Total POIs: {len(building_data['pois']['features'])}")
print(f"   - Navigation routes generated")
print(f"\n📍 Building dimensions: {BUILDING_WIDTH}m x {BUILDING_HEIGHT}m")
print(f"📍 Base coordinates: {BASE_LAT}, {BASE_LON}")
