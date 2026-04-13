const { zones } = require('../data/venueData');
const { QUEUE_STATUS } = require('../utils/constants');

// Memory optimization: Index zones on startup
const zoneMap = new Map(zones.map(z => [z.id, z]));

/**
 * Queue Service
 * Calculates wait-time predictions based on historical base levels and live crowd density.
 */
class QueueService {
  /**
   * Calculates the estimated wait time for a specific zone.
   * Logic: baseWait + (density factor * multiplier)
   * 
   * @param {string} zoneId - Zone identifier
   * @returns {Object} Prediction report including wait string and status.
   */
  calculateWait(zoneId) {
    const zone = zoneMap.get(zoneId);
    if (!zone) return { estimatedWait: 0, status: 'Unknown' };

    // Standard metric: 2 minute penalty per 10% density beyond baseline
    const densityPenalty = (zone.density / 10) * 2;
    const finalWait = Math.round(zone.baseWait + densityPenalty);

    return {
      id: zone.id,
      name: zone.name,
      estimatedWait: finalWait,
      unit: 'min',
      status: this._getStatus(finalWait)
    };
  }

  /**
   * Internal status classifier
   * @private
   * @param {number} totalWait 
   * @returns {string} Status tag
   */
  _getStatus(totalWait) {
    if (totalWait >= 25) return QUEUE_STATUS.HEAVY;
    if (totalWait >= 10) return QUEUE_STATUS.MODERATE;
    return QUEUE_STATUS.LOW;
  }

  /**
   * Generates a full venue-wide prediction report.
   * @returns {Array<Object>}
   */
  getPredictionReport() {
    return zones.map(z => this.calculateWait(z.id));
  }
}

module.exports = new QueueService();
