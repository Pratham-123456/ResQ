/* ============================================================
   RESQ — SIMULATION ENGINE
   Cascading urban crisis modeling, telemetry, and dynamic AI summary
============================================================ */

class SimulationEngine {
    constructor(simulationConfig) {
        this.config = simulationConfig;
        this.rules = window.DISASTER_RULES || {
            properties: {},
            impactModels: {},
            palettes: {},
        };

        this.subscribers = new Set();
        this.timer = null;
        this.lastTickTime = performance.now();

        this.state = this.initInitialState();
        this.generateAIResponse();
    }

    initInitialState() {
        const disaster = (this.config.disaster || "flood").toLowerCase();
        const cityPop = this.config.population || 4500000;
        const propDefinitions = this.rules.properties[disaster] || [];

        // Build active properties dictionary with default values
        const properties = {};
        propDefinitions.forEach(p => {
            properties[p.id] = p.defaultValue;
        });

        // Hospital capacity baseline
        const totalHospitals = Math.max(8, Math.min(28, Math.round(cityPop / 350000)));
        const totalShelters = Math.max(4, Math.min(18, Math.round(cityPop / 450000)));

        return {
            city: this.config.city || "Chennai",
            country: this.config.country || "India",
            countryCode: this.config.countryCode || "IN",
            latitude: Number(this.config.latitude) || 13.0827,
            longitude: Number(this.config.longitude) || 80.2707,
            population: cityPop,
            disaster: disaster,
            severity: 2.8, // Scale 1.0 to 5.0
            elapsedTime: 0, // Simulated seconds
            speed: 1, // 1x, 2x, 5x
            isPaused: false,
            properties: properties,
            metrics: {
                affectedPeople: Math.round(cityPop * 0.012),
                hospitalsAvailable: totalHospitals - 2,
                hospitalsFull: 2,
                hospitalsTotal: totalHospitals,
                blockedRoads: 4,
                activeShelters: Math.max(2, Math.round(totalShelters * 0.4)),
                sheltersTotal: totalShelters,
                powerOutages: 3,
            },
            aiResponse: {
                summary: "",
                guidance: "",
            },
        };
    }

    start() {
        if (this.timer) return;
        this.lastTickTime = performance.now();
        this.timer = setInterval(() => this.tick(), 1000);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    togglePause() {
        this.state.isPaused = !this.state.isPaused;
        this.notify();
        return this.state.isPaused;
    }

    setSpeed(speedMultiplier) {
        this.state.speed = speedMultiplier;
        this.notify();
    }

    setProperty(propertyId, value) {
        const numVal = parseFloat(value);
        if (!isNaN(numVal)) {
            this.state.properties[propertyId] = numVal;
            this.recalculateSeverityFromProperties();
            this.recalculateMetrics();
            this.generateAIResponse();
            this.notify();
        }
    }

    recalculateSeverityFromProperties() {
        const disaster = this.state.disaster;
        const props = this.state.properties;
        const schema = this.rules.properties[disaster] || [];

        let normalizedSum = 0;
        schema.forEach(p => {
            const val = props[p.id] !== undefined ? props[p.id] : p.defaultValue;
            const norm = (val - p.min) / (p.max - p.min);
            normalizedSum += Math.max(0, Math.min(1, norm));
        });

        const avgNorm = schema.length ? (normalizedSum / schema.length) : 0.5;
        this.state.severity = parseFloat((1.0 + avgNorm * 4.0).toFixed(2));
    }

    tick() {
        if (this.state.isPaused) return;

        const deltaSimSeconds = 15 * this.state.speed;
        this.state.elapsedTime += deltaSimSeconds;

        // Progressively escalate as the disaster plays out over time
        this.recalculateMetrics();

        // Regenerate AI briefing periodically or when severity milestones change
        if (this.state.elapsedTime % 60 === 0 || !this.state.aiResponse.summary) {
            this.generateAIResponse();
        }

        this.notify();
    }

    recalculateMetrics() {
        const timeFactor = 1 + Math.log10(1 + this.state.elapsedTime / 180);
        const sevFactor = Math.pow(this.state.severity / 2.5, 1.35);

        // Affected population
        const baseRatio = 0.015 * sevFactor * timeFactor;
        const calculatedAffected = Math.min(
            this.state.population,
            Math.round(this.state.population * baseRatio)
        );
        this.state.metrics.affectedPeople = calculatedAffected;

        // Blocked roads
        const baseBlocked = Math.round(5 * sevFactor * timeFactor);
        this.state.metrics.blockedRoads = Math.min(85, baseBlocked);

        // Hospital capacity
        const totalHosp = this.state.metrics.hospitalsTotal;
        const fullRatio = Math.min(1.0, 0.15 + (this.state.severity / 5.0) * 0.65 * (timeFactor * 0.8));
        const fullCount = Math.min(totalHosp, Math.max(1, Math.round(totalHosp * fullRatio)));
        this.state.metrics.hospitalsFull = fullCount;
        this.state.metrics.hospitalsAvailable = Math.max(0, totalHosp - fullCount);

        // Active shelters
        const totalShelters = this.state.metrics.sheltersTotal;
        const activeCount = Math.min(totalShelters, Math.max(2, Math.round(3 + (this.state.severity * 1.5))));
        this.state.metrics.activeShelters = activeCount;

        // Power outages
        const outageCount = Math.round(4 * sevFactor * (1 + this.state.elapsedTime / 300));
        this.state.metrics.powerOutages = Math.min(60, outageCount);
    }

    /* ------------------------------------------------------------
       AI RESPONSE READOUT GENERATOR
       Swappable function that synthesizes plain-language situation
       briefings and prioritized evacuation guidance from impact models.
    ------------------------------------------------------------ */
    generateAIResponse() {
        const s = this.state;
        const disaster = s.disaster;
        const model = (this.rules.impactModels && this.rules.impactModels[disaster]) || {
            title: "Severe Urban Crisis",
            assetDamageModel: "Widespread infrastructure disruption",
            transitImpact: "Transit networks impaired",
            primaryHazards: ["Structural damage", "Utility failure"],
            evacuationPriority: "Direct non-essential traffic to higher elevation centers.",
        };

        const sevLevel = s.severity >= 4.0 ? "CRITICAL CATASTROPHIC" : s.severity >= 3.0 ? "SEVERE ELEVATED" : "MODERATE MONITORING";
        const elapsedMinutes = Math.floor(s.elapsedTime / 60);

        // Format property readouts into plain speech
        const propStrings = Object.entries(s.properties)
            .map(([k, v]) => `${k.replace(/([A-Z])/g, " $1").toLowerCase()}: ${v}`)
            .slice(0, 3)
            .join(", ");

        // 1. Generated Situation Summary
        const summary = `T+${elapsedMinutes}m SITREP — ${s.city.toUpperCase()} [${sevLevel} — SEV ${s.severity}/5.0]: An escalating ${disaster.toUpperCase()} event is impacting municipal sectors with ${propStrings}. Asset damage is characterized by ${model.assetDamageModel.toLowerCase()}. Transit reports indicate ${model.transitImpact.toLowerCase()}. Approximately ${s.metrics.affectedPeople.toLocaleString()} residents are in the primary impact envelope with ${s.metrics.blockedRoads} arterial road blockages and ${s.metrics.powerOutages} regional electrical grid failures.`;

        // 2. Actionable Evacuation Guidance
        const guidance = `OPERATIONAL DIRECTIVE: Prioritize life-safety extraction along designated green corridors away from low-lying coastal/basin bottlenecks. ${model.evacuationPriority} ${s.metrics.hospitalsAvailable} of ${s.metrics.hospitalsTotal} district trauma centers remain operational; reroute critical triage patients away from ${s.metrics.hospitalsFull} saturated facilities. ${s.metrics.activeShelters} high-capacity reinforced civic shelters are accepting evacuees. Inhibit secondary freight and deploy mobile emergency generators to high-density relief sectors.`;

        s.aiResponse = {
            summary: summary,
            guidance: guidance,
            timestamp: new Date().toLocaleTimeString(),
        };

        return s.aiResponse;
    }

    reset() {
        this.state = this.initInitialState();
        this.generateAIResponse();
        this.notify();
    }

    subscribe(fn) {
        this.subscribers.add(fn);
        fn(this.state);
        return () => this.subscribers.delete(fn);
    }

    notify() {
        this.subscribers.forEach(fn => {
            try {
                fn(this.state);
            } catch (err) {
                console.error("Simulation listener error:", err);
            }
        });
    }
}

if (typeof window !== "undefined") {
    window.SimulationEngine = SimulationEngine;
}
