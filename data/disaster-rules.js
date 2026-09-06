/* ============================================================
   RESQ — DISASTER RULES ENGINE & DATA MODEL
   Fixed rules engine, property schemas, and impact models
============================================================ */

const DISASTER_RULES = {
    /* ------------------------------------------------------------
       CITY CLASSIFICATIONS & COMPATIBILITY
    ------------------------------------------------------------ */
    cities: {
        delhi: {
            name: "Delhi",
            type: "landlocked",
            country: "India",
            countryCode: "IN",
            latitude: 28.6139,
            longitude: 77.2090,
            population: 16787941,
        },
        chennai: {
            name: "Chennai",
            type: "coastal",
            country: "India",
            countryCode: "IN",
            latitude: 13.0827,
            longitude: 80.2707,
            population: 4646732,
        },
    },

    /* Disasters allowed per city classification */
    compatibility: {
        landlocked: {
            flood: true,
            earthquake: true,
            cyclone: false,
            tsunami: false,
        },
        coastal: {
            flood: true,
            earthquake: true,
            cyclone: true,
            tsunami: true,
        },
    },

    /* ------------------------------------------------------------
       DISASTER PROPERTIES SCHEMA (SLIDERS & TELEMETRY)
    ------------------------------------------------------------ */
    properties: {
        flood: [
            {
                id: "waterDepth",
                name: "WATER DEPTH",
                unit: "m",
                min: 0.2,
                max: 6.0,
                step: 0.1,
                defaultValue: 1.8,
                description: "Submersion level across low-lying districts",
            },
            {
                id: "velocity",
                name: "FLOW VELOCITY",
                unit: "m/s",
                min: 0.1,
                max: 4.5,
                step: 0.1,
                defaultValue: 1.4,
                description: "Kinetic water speed eroding arterial roadbeds",
            },
            {
                id: "duration",
                name: "INUNDATION DURATION",
                unit: "hrs",
                min: 2,
                max: 72,
                step: 1,
                defaultValue: 18,
                description: "Continuous period of urban drainage saturation",
            },
        ],
        earthquake: [
            {
                id: "pga",
                name: "PEAK GROUND ACCEL (PGA)",
                unit: "g",
                min: 0.05,
                max: 1.25,
                step: 0.02,
                defaultValue: 0.42,
                description: "Ground shaking intensity & seismic shockwave",
            },
            {
                id: "duration",
                name: "SHAKING DURATION",
                unit: "s",
                min: 5,
                max: 120,
                step: 1,
                defaultValue: 38,
                description: "Duration of primary destructive shear waves",
            },
            {
                id: "depth",
                name: "EPICENTER DEPTH",
                unit: "km",
                min: 5,
                max: 70,
                step: 1,
                defaultValue: 12,
                description: "Focal depth determining surface energy dissipation",
            },
        ],
        cyclone: [
            {
                id: "windSpeed",
                name: "MAX SUSTAINED WINDS",
                unit: "km/h",
                min: 70,
                max: 280,
                step: 5,
                defaultValue: 175,
                description: "Saffir-Simpson intensity driving aerodynamic uplift",
            },
            {
                id: "stormSurge",
                name: "STORM SURGE HEIGHT",
                unit: "m",
                min: 0.5,
                max: 8.0,
                step: 0.2,
                defaultValue: 3.2,
                description: "Ocean rise inundating coastal corridors",
            },
            {
                id: "rainfall",
                name: "RAINFALL INTENSITY",
                unit: "mm/h",
                min: 15,
                max: 140,
                step: 5,
                defaultValue: 65,
                description: "Precipitation volume overpowering drainage systems",
            },
        ],
        tsunami: [
            {
                id: "waveHeight",
                name: "WAVE RUN-UP HEIGHT",
                unit: "m",
                min: 1.0,
                max: 25.0,
                step: 0.5,
                defaultValue: 7.5,
                description: "Vertical crest height striking shoreline defenses",
            },
            {
                id: "inundationDist",
                name: "INUNDATION DISTANCE",
                unit: "km",
                min: 0.2,
                max: 8.0,
                step: 0.1,
                defaultValue: 2.8,
                description: "Horizontal inland penetration corridor",
            },
            {
                id: "waveVelocity",
                name: "WAVE VELOCITY",
                unit: "km/h",
                min: 20,
                max: 120,
                step: 2,
                defaultValue: 55,
                description: "Kinetic hydrodynamic scouring speed",
            },
        ],
    },

    /* ------------------------------------------------------------
       DISASTER IMPACT VOCABULARY & MODELS
    ------------------------------------------------------------ */
    impactModels: {
        flood: {
            title: "Corrosive Hydrodynamic Saturation",
            assetDamageModel: "Gradual/Corrosive — waterlogging, structural mold, foundation rust, electrical transformer shorting",
            transitImpact: "Submerged roads and arterial railways, delayed ground freight, impassable low-lying terrain, temporary airport/port shutdowns",
            primaryHazards: ["Submerged sub-stations", "Arterial gridlock", "Drinking water contamination", "Basement flood traps"],
            evacuationPriority: "Direct citizens from flood basins toward elevated eastern quadrants and reinforced concrete relief hubs.",
        },
        earthquake: {
            title: "Catastrophic Structural Shear",
            assetDamageModel: "Structural/Catastrophic — masonry cracking, foundation shear, structural unseating, partial and total building collapse",
            transitImpact: "Collapsed overpasses and bridges, warped rail tracks, fractured asphalt runways, heavy debris-blocked routes",
            primaryHazards: ["Ruptured gas distribution lines", "Falling facade debris", "Structural aftershock vulnerabilities", "Overloaded trauma units"],
            evacuationPriority: "Establish open-air staging corridors away from high-rise perimeters; route casualties to surviving suburban field clinics.",
        },
        cyclone: {
            title: "Aerodynamic Kinetic Destabilization",
            assetDamageModel: "Aerodynamic/Impact — roof lift-off, shattered glass curtains, wind-pressure structural buckling, flying-debris penetration",
            transitImpact: "Aviation and maritime logistics halted, overturned high-profile freight vehicles, roads blocked by uprooted trees and downed power lines",
            primaryHazards: ["High-voltage electrocution lines", "High-speed projectile debris", "Storm surge tidal surge", "Communications tower collapse"],
            evacuationPriority: "Secure internal reinforced shelters away from oceanfront perimeters; hold vehicular movement until storm eye clears.",
        },
        tsunami: {
            title: "Hydrodynamic Kinetic Scouring",
            assetDamageModel: "Hydrodynamic/Scouring — kinetic crushing, rapid foundation erosion, debris-driven structural pulverization",
            transitImpact: "Coastal ports and harbors obliterated, shoreline expressways washed out, long-term maritime and freight trade disruption",
            primaryHazards: ["Violent backwash currents", "Debris battering rams", "Submerged fuel storage ruptures", "Harbor crane collapse"],
            evacuationPriority: "Execute immediate vertical and high-ground inland evacuation beyond the 4km contour line; abandon sea-level transit routes.",
        },
    },

    /* ------------------------------------------------------------
       COLOR PALETTES PER DISASTER
    ------------------------------------------------------------ */
    palettes: {
        flood: { primary: "#0284c7", secondary: "#38bdf8", glow: "rgba(2, 132, 199, 0.45)" },
        earthquake: { primary: "#f59e0b", secondary: "#fbbf24", glow: "rgba(245, 158, 11, 0.45)" },
        cyclone: { primary: "#64748b", secondary: "#94a3b8", glow: "rgba(100, 116, 139, 0.45)" },
        tsunami: { primary: "#0ea5e9", secondary: "#7dd3fc", glow: "rgba(14, 165, 233, 0.45)" },
    },

    /* ------------------------------------------------------------
       HELPER FUNCTIONS
    ------------------------------------------------------------ */
    getCityType(cityName) {
        if (!cityName) return "coastal";
        const normalized = cityName.toLowerCase().trim();
        if (this.cities[normalized]) {
            return this.cities[normalized].type;
        }
        // Heuristic: If city contains known landlocked hints
        const landlockedKeywords = ["delhi", "bengaluru", "bangalore", "hyderabad", "jaipur", "lucknow", "bhopal", "pune", "nagpur", "patna", "kathmandu", "zurich", "denver"];
        if (landlockedKeywords.some(k => normalized.includes(k))) {
            return "landlocked";
        }
        return "coastal";
    },

    isDisasterAllowed(cityName, disaster) {
        const type = this.getCityType(cityName);
        const map = this.compatibility[type];
        if (!map) return true;
        return !!map[disaster.toLowerCase()];
    },
};

if (typeof window !== "undefined") {
    window.DISASTER_RULES = DISASTER_RULES;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = DISASTER_RULES;
}
