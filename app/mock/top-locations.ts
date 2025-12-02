import {
    Building2,
    Coffee,
    DoorOpen,
    Landmark,
    School,
    Users,
    Utensils,
    FlaskConical,
    Theater,
    ArrowUpDown, // Replaced 'Elevator' (does not exist in Lucide)
    type LucideIcon, // Import the correct type helper
} from "lucide-react";

export interface TopLocation {
    name: string;
    icon: LucideIcon; // Much cleaner type definition
    colors: string;
}

const topLocations: TopLocation[] = [
    {
        name: "Cafeteria",
        icon: Utensils,
        colors:
            "bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400",
    },
    {
        name: "A 001",
        icon: School,
        colors:
            "bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
        name: "B 001",
        icon: School,
        colors:
            "bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400",
    },
    {
        name: "C 002 - Seminar Hall",
        icon: Theater,
        colors:
            "bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
        name: "IOT Lab",
        icon: FlaskConical,
        colors:
            "bg-cyan-100 text-cyan-600 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400",
    },
    {
        name: "Research Lab",
        icon: FlaskConical,
        colors:
            "bg-teal-100 text-teal-600 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-400",
    },
    {
        name: "Director General Office",
        icon: Building2,
        colors:
            "bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400",
    },
    {
        name: "Student Seating Area",
        icon: Users,
        colors:
            "bg-pink-100 text-pink-600 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400",
    },
    {
        name: "Lake Campus 25",
        icon: Landmark,
        colors:
            "bg-sky-100 text-sky-600 hover:bg-sky-200 dark:bg-sky-900/30 dark:text-sky-400",
    },
    {
        name: "Campus 25 Main Gate (KP 25 Boys Side)",
        icon: DoorOpen,
        colors:
            "bg-amber-100 text-amber-600 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
    },
    {
        name: "Lift 1 (A-Block)",
        icon: ArrowUpDown, // Updated icon
        colors:
            "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900/30 dark:text-slate-400",
    },
    {
        name: "Faculty Seating Area",
        icon: Coffee,
        colors:
            "bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400",
    },
    {
        name: "Seminar Halls",
        icon: Theater,
        colors:
            "bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400",
    },
];

export default topLocations;