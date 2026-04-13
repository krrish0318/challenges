const { networkGraph, zones } = require('../data/venueData');
const googleService = require('./googleService');
const NodeCache = require('node-cache');
const { NETWORK, SYSTEM } = require('../utils/constants');

// Memory optimization: Index zones on startup
const zoneMap = new Map(zones.map(z => [z.id, z]));
const routeCache = new NodeCache({ stdTTL: 300 });

/**
 * Navigation Service
 * Implements crowd-aware pathfinding using Dijkstra's algorithm.
 */
class NavigationService {
  /**
   * Calculates the weighted cost of entering a zone based on crowd density.
   * @param {string} zoneId - The unique identifier of the zone.
   * @returns {number} The calculated cost (lower is better).
   */
  getZoneCost(zoneId) {
    const zone = zoneMap.get(zoneId);
    if (!zone) return NETWORK.MAX_COST;
    // Base cost + density surcharge (0.0 to 10.0)
    return NETWORK.DEFAULT_WEIGHT + (zone.density / 10);
  }

  /**
   * findSmartPath: Implements Dijkstra's Algorithm for weighted crowd-aware routing.
   * Ensures the suggested route is truly optimized for low-density paths.
   * 
   * @param {string} startId - Origin zone ID
   * @param {string} endId - Destination zone ID
   * @returns {Object|null} Optimized path details or null if no path exists.
   */
  findSmartPath(startId, endId) {
    const cacheKey = `${startId}_to_${endId}`;
    const cached = routeCache.get(cacheKey);
    if (cached) return { ...cached, status: 'cached' };

    // Initialization phase
    const distances = {};
    const previous = {};
    const nodes = new Set();

    for (const zoneId in networkGraph) {
      distances[zoneId] = Infinity;
      previous[zoneId] = null;
      nodes.add(zoneId);
    }
    distances[startId] = 0;

    // Main Dijkstra Loop
    while (nodes.size > 0) {
      // Priority optimization: Find lowest cost node in set
      let closestNode = null;
      for (const node of nodes) {
        if (closestNode === null || distances[node] < distances[closestNode]) {
          closestNode = node;
        }
      }

      // Exit conditions
      if (distances[closestNode] === Infinity || closestNode === endId) {
        break;
      }

      nodes.delete(closestNode);

      const neighbors = networkGraph[closestNode] || [];
      for (const neighbor of neighbors) {
        const cost = this.getZoneCost(neighbor);
        const alt = distances[closestNode] + cost;

        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = closestNode;
        }
      }
    }

    // Reconstruction phase
    const path = [];
    let current = endId;
    while (current) {
      path.unshift(current);
      current = previous[current];
    }

    // Integrity check
    if (path[0] !== startId) return null;

    // Enrichment phase
    const mapEnrichment = googleService.generatePathPolyline(path);
    const pathZones = path.map(id => zoneMap.get(id));
    const totalCost = path.reduce((acc, zid) => acc + this.getZoneCost(zid), 0);

    const result = {
      pathIds: path,
      zones: pathZones,
      cost: parseFloat(totalCost.toFixed(2)),
      maps_data: mapEnrichment,
      benefit: totalCost > path.length * 1.5 
        ? "High density detected, routing through clearer paths." 
        : "Optimal direct path found.",
      type: 'Weighted Optimality',
      engine: SYSTEM.SERVICE_NAME
    };

    googleService.logEvent('INFO', 'Smart Dijkstra Path Generated', { from: startId, to: endId, cost: totalCost });
    routeCache.set(cacheKey, result);
    
    return result;
  }
}

module.exports = new NavigationService();
