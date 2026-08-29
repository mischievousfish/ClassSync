import { NextFunction, Request, Response, Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { requireOrgRole, resolveTenant, TenantRequest } from '../middleware/tenant';
import { getOrganizationAnalytics, inviteTeachers, provisionOrganization, shareCurriculum } from '../services/organization.service';

export const organizationRouter = Router();

organizationRouter.post('/', async (request: Request, response: Response, next: NextFunction) => {
  try {
    response.status(201).json(await provisionOrganization(request.body, (request as AuthenticatedRequest).user.id));
  } catch (error) { next(error); }
});

const tenantAdmin = [resolveTenant, requireOrgRole('ORG_ADMIN')];
organizationRouter.post('/:orgId/teachers/invite', ...tenantAdmin, async (request: Request, response: Response, next: NextFunction) => {
  try {
    const tenantRequest = request as TenantRequest;
    response.status(202).json(await inviteTeachers(tenantRequest.tenant.orgId, request.body, tenantRequest.user.id));
  } catch (error) { next(error); }
});

organizationRouter.get('/:orgId/analytics', resolveTenant, requireOrgRole('ORG_ADMIN', 'BRANCH_MANAGER'), async (request: Request, response: Response, next: NextFunction) => {
  try { response.json(await getOrganizationAnalytics((request as TenantRequest).tenant.orgId)); } catch (error) { next(error); }
});

organizationRouter.post('/:orgId/curriculum/share', resolveTenant, requireOrgRole('ORG_ADMIN', 'STAFF_TEACHER'), async (request: Request, response: Response, next: NextFunction) => {
  try {
    const tenantRequest = request as TenantRequest;
    response.status(201).json(await shareCurriculum(tenantRequest.tenant.orgId, tenantRequest.user.id, request.body));
  } catch (error) { next(error); }
});