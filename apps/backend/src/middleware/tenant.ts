import { NextFunction, Request, Response } from 'express';
import { db } from '../config/firebase';
import { EnterpriseOrgRole, OrganizationMembership } from '../models';
import { AppError } from '../shared/errors';
import { AuthenticatedRequest } from './auth';

export interface TenantRequest extends AuthenticatedRequest {
  tenant: { orgId: string; membership: OrganizationMembership };
}

function requestOrganizationKey(request: Request): string | undefined {
  const header = request.header('x-organization-id')?.trim();
  if (header) return header;
  const hostname = (request.hostname || '').split(':')[0];
  const suffix = process.env.TENANT_DOMAIN_SUFFIX ?? 'classsync.edu.vn';
  if (!hostname.endsWith(`.${suffix}`)) return undefined;
  const subdomain = hostname.slice(0, -(`.${suffix}`).length).split('.').pop();
  return subdomain || undefined;
}

export async function resolveTenant(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const routeOrgId = typeof request.params.orgId === 'string' ? request.params.orgId : undefined;
    const requestedKey = routeOrgId ?? requestOrganizationKey(request);
    if (!requestedKey) throw new AppError(400, 'Organization context is required');
    if (routeOrgId && requestOrganizationKey(request) && requestOrganizationKey(request) !== routeOrgId) throw new AppError(403, 'Organization context does not match the route');

    const organizations = db.collection('organizations');
    const organization = (await organizations.doc(requestedKey).get()).exists
      ? organizations.doc(requestedKey)
      : (await organizations.where('slug', '==', requestedKey).limit(1).get()).docs[0]?.ref;
    if (!organization) throw new AppError(404, 'Organization was not found');
    const userId = (request as AuthenticatedRequest).user.id;
    const membership = await db.collection('organization_memberships').doc(`${organization.id}_${userId}`).get();
    if (!membership.exists) throw new AppError(403, 'You are not a member of this organization');
    (request as TenantRequest).tenant = { orgId: organization.id, membership: membership.data() as OrganizationMembership };
    next();
  } catch (error) { next(error); }
}

export function requireOrgRole(...roles: EnterpriseOrgRole[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const tenantRequest = request as TenantRequest;
    if (!tenantRequest.tenant || !roles.includes(tenantRequest.tenant.membership.orgRole)) return next(new AppError(403, 'Insufficient organization permissions'));
    next();
  };
}