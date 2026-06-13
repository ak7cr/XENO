// Shared segment-criteria → SQL translation, used by the segments API
// (to preview/count matches) and the campaigns API (to resolve recipients).

export interface SegmentCriteria {
  tier?: string[];
  minSpend?: number;
  maxSpend?: number;
  daysSinceLastPurchase?: number;
  neverPurchased?: boolean;
  active?: boolean;
}

export function buildSegmentQuery(criteria: SegmentCriteria) {
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params: (string | number)[] = [];

  if (criteria.tier && criteria.tier.length > 0) {
    const placeholders = criteria.tier.map(() => '?').join(',');
    query += ` AND tier IN (${placeholders})`;
    params.push(...criteria.tier);
  }

  if (criteria.minSpend !== undefined) {
    query += ' AND total_spend >= ?';
    params.push(criteria.minSpend);
  }

  if (criteria.maxSpend !== undefined) {
    query += ' AND total_spend <= ?';
    params.push(criteria.maxSpend);
  }

  if (criteria.daysSinceLastPurchase !== undefined) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - criteria.daysSinceLastPurchase);
    query += ' AND last_purchase_date < ?';
    params.push(cutoffDate.toISOString());
  }

  if (criteria.neverPurchased === true) {
    query += ' AND last_purchase_date IS NULL';
  }

  if (criteria.active === true) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    query += ' AND last_purchase_date >= ?';
    params.push(cutoffDate.toISOString());
  }

  return { query, params };
}
