# Icon Reference - Lucide React

## All Icons Used in the Application

### Navigation & Location
- **Map** - Main application icon (header)
- **MapPin** - Location markers, starting point
- **Navigation** - Destination/arrival icon
- **Route** - Distance/route indicator
- **ArrowRight** - Direction arrows, navigation flow
- **ArrowUpDown** - Swap locations button

### Search & Actions
- **Search** - Search input icon
- **X** - Clear/close buttons
- **Trash2** - Clear route button
- **Clock** - Time estimation

### Facilities
- **Building2** - Classrooms and general buildings
- **MoveVertical** - Lifts/Elevators (up/down movement)
- **ArrowUpFromLine** - Stairs (upward movement)
- **Droplet** - Washrooms/Restrooms
- **DoorOpen** - Entrances/Exits

## Icon Mapping by Feature

### POI Types
```javascript
{
  classroom: Building2,
  lift: MoveVertical,
  stairs: ArrowUpFromLine,
  washroom_gents: Droplet,
  washroom_ladies: Droplet,
  entrance: DoorOpen
}
```

### Quick Actions
```javascript
{
  nearest_stairs: ArrowUpFromLine,
  nearest_lift: MoveVertical,
  nearest_gents: Droplet,
  nearest_ladies: Droplet,
  nearest_entrance: DoorOpen
}
```

### Route Information
```javascript
{
  start: MapPin,
  end: Navigation,
  distance: Route,
  time: Clock,
  waypoint: ArrowRight
}
```

## Usage Example

```jsx
import { MapPin, Navigation, Route } from 'lucide-react';

// Basic usage
<MapPin size={20} />

// With custom stroke width
<MapPin size={20} strokeWidth={2} />

// With custom color (via className)
<MapPin size={20} className="text-blue-500" />
```

## Color Scheme

### Icon Colors in Dark Mode
- **Primary Icons**: `#3B82F6` (Blue)
- **Success Icons**: `#10B981` (Green)
- **Warning Icons**: `#F59E0B` (Amber)
- **Danger Icons**: `#EF4444` (Red)
- **Purple Icons**: `#8B5CF6` (Violet)
- **Pink Icons**: `#EC4899` (Pink)
- **Default Icons**: `#64748B` (Slate)
- **White Icons**: `#FFFFFF` (on colored backgrounds)

## Notes
- All icons are from `lucide-react` package
- Default size is 24px, but we use 16-28px range
- Icons support `size`, `strokeWidth`, `color`, and `className` props
- All icons are SVG-based and scale perfectly
