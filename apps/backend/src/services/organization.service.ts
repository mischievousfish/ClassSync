import { FieldValue } from 'firebase-admin/firestore';
import { db } from '../config/firebase';
import { EnterpriseOrgRole, Organization, OrganizationMembership, SharedCurriculumLibraryItem, SubscriptionTier } from '../models';
import { AppError } from '../shared/errors';

interface ProvisionOrganizationInput {
  name: string; slug: string; logoUrl?: string; subscriptionTier?: SubscriptionTier;
  allowedTeacherSeats?: number; allowedStudentSeats?: number; customDomain?: string;
}

export async function provisionOrganization(input: ProvisionOrganizationInput, userId: string): Promise<Organization> {
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(input.slug)) throw new AppError(400, 'slug must contain lowercase letters, numbers, and hyphens');
  const reference = db.collection('organizations').doc();
  const organization: Organization = { id: reference.id, name: input.name, slug: input.slug, logoUrl: input.logoUrl, subscriptionTier: input.subscriptionTier ?? 'BASIC', allowedTeacherSeats: input.allowedTeacherSeats ?? 10, allowedStudentSeats: input.allowedStudentSeats ?? 500, customDomain: input.customDomain, settings: {}, createdAt: FieldValue.serverTimestamp() as never };
  const membership: OrganizationMembership = { id: `${reference.id}_${userId}`, orgId: reference.id, userId, orgRole: 'ORG_ADMIN', assignedBranchIds: [], createdAt: FieldValue.serverTimestamp() as never };
  const batch = db.batch();
  batch.set(reference, organization);
  batch.set(db.collection('organization_memberships').doc(membership.id), membership);
  await batch.commit();
  return organization;
}

function parseCsvRows(csv: string): Array<{ email: string; orgRole: EnterpriseOrgRole; assignedBranchIds: string[] }> {
  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(',').map((header) => header.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
    const orgRole = (row.orgrole || row.role || 'STAFF_TEACHER') as EnterpriseOrgRole;
    if (!['ORG_ADMIN', 'BRANCH_MANAGER', 'STAFF_TEACHER', 'TEACHING_ASSISTANT'].includes(orgRole) || !row.email) throw new AppError(400, 'Invalid teacher invitation CSV');
    return { email: row.email, orgRole, assignedBranchIds: (row.assignedbranchids || '').split('|').filter(Boolean) };
  });
}

export async function inviteTeachers(orgId: string, input: { emails?: Array<{ email: string; orgRole: EnterpriseOrgRole; assignedBranchIds?: string[] }>; csv?: string }, invitedBy: string) {
  const rows = [...(input.emails ?? []), ...parseCsvRows(input.csv ?? '')];
  if (!rows.length) throw new AppError(400, 'At least one teacher invitation is required');
  const references = rows.map((row) => db.collection('organization_invitations').doc());
  const batch = db.batch();
  references.forEach((reference, index) => batch.set(reference, { id: reference.id, orgId, email: rows[index].email, orgRole: rows[index].orgRole, assignedBranchIds: rows[index].assignedBranchIds ?? [], invitedBy, status: 'PENDING', createdAt: FieldValue.serverTimestamp() }));
  await batch.commit();
  return { invited: rows.length, invitations: references.map((reference, index) => ({ id: reference.id, ...rows[index] })) };
}

export async function getOrganizationAnalytics(orgId: string) {
  const [members, assignments, aiAssets] = await Promise.all([
    db.collection('organization_memberships').where('orgId', '==', orgId).get(),
    db.collection('assignments').where('orgId', '==', orgId).get(),
    db.collection('ai_generated_assets').where('orgId', '==', orgId).get(),
  ]);
  const activeStudentCount = members.docs.filter((doc) => doc.data().orgRole === 'STUDENT').length;
  const completedHomework = assignments.docs.filter((doc) => doc.data().completionRate != null).reduce((sum, doc) => sum + Number(doc.data().completionRate), 0);
  return { activeStudentCount, teacherCount: members.docs.filter((doc) => ['STAFF_TEACHER', 'TEACHING_ASSISTANT'].includes(doc.data().orgRole)).length, homeworkCompletionRate: assignments.size ? completedHomework / assignments.size : 0, teacherAiPrepUsage: aiAssets.size };
}

export async function shareCurriculum(orgId: string, createdById: string, input: Omit<SharedCurriculumLibraryItem, 'id' | 'orgId' | 'createdById' | 'createdAt'>) {
  const reference = db.collection('shared_curriculum_library').doc();
  const item: SharedCurriculumLibraryItem = { id: reference.id, orgId, createdById, ...input, createdAt: FieldValue.serverTimestamp() as never };
  await reference.set(item);
  return item;
}