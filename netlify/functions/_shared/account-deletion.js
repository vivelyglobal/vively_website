// Single place that knows every collection a creator account touches, so
// self-service deletion (me.js) and admin deletion (admin-users.js) behave
// identically and neither leaves orphaned records behind.
//
// What happens to each collection:
//   users                 -> document deleted
//   notifications         -> deleted
//   account_action_codes  -> deleted
//   invitations           -> deleted (brand -> creator campaign invites)
//   verification_codes    -> deleted (keyed by email)
//   password_reset_tokens -> deleted (keyed by email)
//   referrals (as referrer)  -> deleted
//   referrals (as referred)  -> kept, username replaced with "deleted-user"
//                              so the referrer's count history stays intact
//   applications          -> KEPT but anonymised: every personal field is
//                            cleared. The record itself (campaign, status,
//                            timestamps) stays so campaign applicant counts,
//                            brand-side application history and reward /
//                            accounting records remain consistent.
//                            TODO(business/legal): confirm this retention is
//                            wanted and for how long; delete fully if not.
//   account_deletions     -> one row with NO personal data (type, who
//                            initiated it, timestamp) as an audit trail.
const {
  getUsersCollection,
  getReferralsCollection,
  getNotificationsCollection,
  getApplicationsCollection,
  getAccountCodesCollection,
  getInvitationsCollection,
  getVerificationCodesCollection,
  getPasswordResetTokensCollection,
  getAccountDeletionsCollection,
} = require("../db");

const ANONYMISED_NAME = "Deleted user";

async function deleteCreatorAccount(userId, { initiatedBy = "self" } = {}) {
  const users = await getUsersCollection();
  const user = await users.findOne({ _id: userId });
  if (!user) return { deleted: false, reason: "not-found" };

  const now = new Date();
  const email = user.email;

  const [
    referrals,
    notifications,
    applications,
    codes,
    invitations,
    verificationCodes,
    resetTokens,
    deletions,
  ] = await Promise.all([
    getReferralsCollection(),
    getNotificationsCollection(),
    getApplicationsCollection(),
    getAccountCodesCollection(),
    getInvitationsCollection(),
    getVerificationCodesCollection(),
    getPasswordResetTokensCollection(),
    getAccountDeletionsCollection(),
  ]);

  await Promise.all([
    referrals.updateMany(
      { referredUserId: userId },
      { $set: { referredUsername: "deleted-user", referredDeleted: true } }
    ),
    referrals.deleteMany({ referrerId: userId }),
    notifications.deleteMany({ userId }),
    codes.deleteMany({ userId }),
    invitations.deleteMany({ creatorId: userId }),
    email ? verificationCodes.deleteMany({ email }) : Promise.resolve(),
    email ? resetTokens.deleteMany({ email, accountType: "user" }) : Promise.resolve(),
    applications.updateMany(
      { creatorId: userId },
      {
        $set: {
          creatorId: null,
          creatorEmail: null,
          creatorName: ANONYMISED_NAME,
          creatorUsername: null,
          creatorInstagram: null,
          creatorTiktok: null,
          creatorPhone: null,
          name: ANONYMISED_NAME,
          email: null,
          instagram: null,
          message: null,
          creatorDeleted: true,
          anonymizedAt: now,
        },
      }
    ),
  ]);

  await users.deleteOne({ _id: userId });

  // Audit row only — intentionally stores nothing that identifies the person.
  await deletions
    .insertOne({ accountType: "creator", initiatedBy, deletedAt: now })
    .catch(() => {});

  return { deleted: true };
}

module.exports = { deleteCreatorAccount, ANONYMISED_NAME };
