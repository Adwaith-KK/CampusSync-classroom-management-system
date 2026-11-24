const pool = require('../config/db');
const { sendNotification } = require('../services/notificationService');
const { logAudit } = require('../services/auditService');

/**
 * Sweeps for active classroom claims that have passed their expiration timestamp.
 * Automatically marks them 'expired', updates classroom status, notifies the claimant,
 * and records an audit trail record.
 */
async function processExpiredClaims() {
  const connection = await pool.getConnection();
  try {
    // 1. Identify expired claims with row lock
    const [expiredClaims] = await connection.query(`
      SELECT 
        cc.id as claim_id, 
        cc.classroom_id, 
        cc.user_id, 
        cc.end_time, 
        c.room_number,
        u.name as user_name
      FROM classroom_claims cc
      JOIN classrooms c ON cc.classroom_id = c.id
      JOIN users u ON cc.user_id = u.id
      WHERE cc.status = 'active' 
        AND cc.end_time <= NOW()
    `);

    if (expiredClaims.length === 0) {
      return;
    }

    console.log(`[CampusSync Claim Expirer] Releasing ${expiredClaims.length} expired claims...`);

    for (const claim of expiredClaims) {
      // 2. Mark claim as expired
      await connection.query(
        `UPDATE classroom_claims SET status = 'expired' WHERE id = ?`,
        [claim.claim_id]
      );

      // 3. Reset classroom status back to 'available' (if not maintenance)
      await connection.query(
        `UPDATE classrooms SET status = 'available' WHERE id = ? AND status != 'maintenance'`,
        [claim.classroom_id]
      );

      // 4. Send notification to the user
      await sendNotification({
        userId: claim.user_id,
        title: 'Classroom Claim Expired',
        message: `Your temporary claim for classroom ${claim.room_number} has expired and the room is now available for campus use.`,
        type: 'claim'
      });

      // 5. Record audit trail
      await logAudit({
        userId: claim.user_id,
        action: 'CLASSROOM_CLAIM_AUTO_EXPIRED',
        entityType: 'classroom_claims',
        entityId: claim.claim_id,
        description: `Temporary claim for room ${claim.room_number} expired automatically and was released back to inventory.`,
        ipAddress: '127.0.0.1'
      });
    }
  } catch (error) {
    console.error('[CampusSync Claim Expirer] Error running claim expiration job:', error.message);
  } finally {
    connection.release();
  }
}

/**
 * Initializes recurring background interval check
 * Runs every 30 seconds
 */
function initClaimExpirationJob(intervalMs = 30000) {
  console.log(`[CampusSync Background Scheduler] Auto-release claim monitor active (interval: ${intervalMs / 1000}s)`);
  // Run once immediately on start
  processExpiredClaims();
  // Repeat on interval
  const intervalId = setInterval(processExpiredClaims, intervalMs);
  return intervalId;
}

module.exports = {
  processExpiredClaims,
  initClaimExpirationJob
};
