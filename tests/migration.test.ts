import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { getSupabaseServerClient } from '../src/lib/supabase/server';
import { GET as getHealth } from '../src/app/api/health/route';
import { GET as getComplaints, POST as postComplaint } from '../src/app/api/complaints/route';
import { GET as getComplaintById, PATCH as patchComplaint, DELETE as deleteComplaint } from '../src/app/api/complaints/[id]/route';
import { GET as getOverlaps, PATCH as patchOverlap } from '../src/app/api/overlaps/route';
import { GET as getCoordination, POST as postCoordination, PATCH as patchCoordination } from '../src/app/api/coordination/route';
import { GET as getInstitutions } from '../src/app/api/institutions/route';
import { GET as getNotices, POST as postNotice } from '../src/app/api/notices/route';
import { GET as getResponses, POST as postResponse, PATCH as patchResponse } from '../src/app/api/institution/responses/route';
import { GET as getProfile, PATCH as patchProfile } from '../src/app/api/institution/profile/route';
import { GET as getHistory, POST as postHistory } from '../src/app/api/case-history/route';
import { NextRequest } from 'next/server';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function makeRequest(url: string, options: { method?: string; body?: any; headers?: Record<string, string> } = {}) {
  const init: any = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };
  if (options.body) {
    init.body = JSON.stringify(options.body);
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

async function runTests() {
  console.log('--- Starting CaseConnect Migration Test Suite ---');

  // 1. Database connection
  console.log('\n[1] Testing Database Connection & Server Client...');
  const supabase = getSupabaseServerClient();
  assert(!!supabase, 'Supabase server client initialized successfully');

  // 2. Health Endpoint
  console.log('\n[2] Testing Health Endpoint (/api/health)...');
  const healthRes = await getHealth();
  const healthData = await healthRes.json();
  assert(healthRes.status === 200, 'Health endpoint returned 200');
  assert(healthData.status === 'ok', 'Health status is ok');
  assert(healthData.db === 'connected', 'Health reports database connected');
  assert(typeof healthData.count === 'number' && healthData.count > 0, `Complaints count is ${healthData.count}`);

  // 3. Complaints APIs
  console.log('\n[3] Testing Complaints API (/api/complaints)...');
  const complaintsReq = makeRequest('/api/complaints');
  const complaintsRes = await getComplaints(complaintsReq);
  const complaintsData = await complaintsRes.json();
  assert(complaintsRes.status === 200, 'GET /api/complaints returned 200');
  assert(Array.isArray(complaintsData.complaints), 'Returned complaints array');
  assert(complaintsData.complaints.length > 0, `Complaints list has ${complaintsData.complaints.length} records`);

  const firstCase = complaintsData.complaints[0];
  assert(!!firstCase.caseNumber, `First complaint has caseNumber: ${firstCase.caseNumber}`);
  assert(!!firstCase.institutionName, `First complaint has institutionName: ${firstCase.institutionName}`);
  assert(typeof firstCase.hasOverlapAlert === 'boolean', 'hasOverlapAlert is boolean');

  // Filter complaints
  const filteredReq = makeRequest('/api/complaints?bureau=PGRC');
  const filteredRes = await getComplaints(filteredReq);
  const filteredData = await filteredRes.json();
  assert(filteredRes.status === 200, 'GET /api/complaints?bureau=PGRC returned 200');
  assert(filteredData.complaints.every((c: any) => c.bureau === 'PGRC'), 'All filtered complaints belong to PGRC');

  // 4. Complaint by ID
  console.log('\n[4] Testing Complaint By ID (/api/complaints/[id])...');
  const singleReq = makeRequest(`/api/complaints/${firstCase.id}`);
  const singleRes = await getComplaintById(singleReq, { params: Promise.resolve({ id: firstCase.id }) });
  const singleData = await singleRes.json();
  assert(singleRes.status === 200, `GET /api/complaints/${firstCase.id} returned 200`);
  assert(singleData.complaint?.id === firstCase.id, 'Fetched complaint matches ID');

  // Missing complaint
  const missingReq = makeRequest('/api/complaints/non-existent-case-id-12345');
  const missingRes = await getComplaintById(missingReq, { params: Promise.resolve({ id: 'non-existent-case-id-12345' }) });
  assert(missingRes.status === 404, 'GET missing complaint returned 404');

  // 5. POST Complaint
  console.log('\n[5] Testing POST /api/complaints...');
  const newCaseId = `case-test-${Date.now()}`;
  const createReq = makeRequest('/api/complaints', {
    method: 'POST',
    body: {
      id: newCaseId,
      caseNumber: `AICTE/TEST/2026/${Math.floor(1000 + Math.random() * 9000)}`,
      institutionName: 'Apex Institute of Technology & Engineering',
      institutionCode: '1-3329182741',
      bureau: 'PGRC',
      status: 'Pending',
      subject: 'Automated Migration Test Complaint',
      category: 'Fee Irregularities',
      priority: 'High',
    },
  });
  const createRes = await postComplaint(createReq);
  const createData = await createRes.json();
  assert(createRes.status === 201, 'POST /api/complaints created record (201)');
  assert(createData.complaint?.id === newCaseId, 'Created complaint ID matches');

  // Invalid payload validation
  const invalidReq = makeRequest('/api/complaints', {
    method: 'POST',
    body: { status: 'InvalidStatus' },
  });
  const invalidRes = await postComplaint(invalidReq);
  assert(invalidRes.status === 400, 'POST invalid complaint correctly rejected with 400');

  // 6. PATCH Complaint
  console.log('\n[6] Testing PATCH /api/complaints/[id]...');
  const patchReq = makeRequest(`/api/complaints/${newCaseId}`, {
    method: 'PATCH',
    body: {
      status: 'Under Process',
      assignedOfficer: 'Dr. Testing Officer',
      managementFlagged: true,
      managementNotes: [{ id: 'n1', author: 'Test Officer', content: 'Verified', timestamp: '2026-10-27 12:00' }],
    },
  });
  const patchRes = await patchComplaint(patchReq, { params: Promise.resolve({ id: newCaseId }) });
  const patchData = await patchRes.json();
  assert(patchRes.status === 200, 'PATCH /api/complaints/[id] returned 200');
  assert(patchData.complaint?.status === 'Under Process', 'Updated status persisted to Under Process');
  assert(patchData.complaint?.managementFlagged === true, 'Updated managementFlagged persisted');
  assert(patchData.complaint?.managementNotes?.length === 1, 'Updated management notes persisted');

  // Cleanup test complaint
  const delReq = makeRequest(`/api/complaints/${newCaseId}`, { method: 'DELETE' });
  const delRes = await deleteComplaint(delReq, { params: Promise.resolve({ id: newCaseId }) });
  assert(delRes.status === 200, 'DELETE /api/complaints/[id] returned 200');

  // 7. Overlap Alerts APIs
  console.log('\n[7] Testing Overlap Alerts API (/api/overlaps)...');
  const overlapsReq = makeRequest('/api/overlaps');
  const overlapsRes = await getOverlaps(overlapsReq);
  const overlapsData = await overlapsRes.json();
  assert(overlapsRes.status === 200, 'GET /api/overlaps returned 200');
  assert(Array.isArray(overlapsData.overlaps), 'Returned overlaps array');
  assert(overlapsData.overlaps.length > 0, `Overlap alerts count is ${overlapsData.overlaps.length}`);

  const testOverlap = overlapsData.overlaps[0];
  const patchOvrReq = makeRequest('/api/overlaps', {
    method: 'PATCH',
    body: {
      id: testOverlap.id,
      reviewStatus: 'Separate Matters',
      reviewedBy: 'Test Reviewer',
      reviewNotes: 'Verified as separate matters in test run',
    },
  });
  const patchOvrRes = await patchOverlap(patchOvrReq);
  const patchOvrData = await patchOvrRes.json();
  assert(patchOvrRes.status === 200, 'PATCH /api/overlaps returned 200');
  assert(patchOvrData.overlap?.reviewStatus === 'Separate Matters', 'Overlap review status updated');

  // 8. Coordination APIs
  console.log('\n[8] Testing Coordination Requests API (/api/coordination)...');
  const coordReq = makeRequest('/api/coordination');
  const coordRes = await getCoordination(coordReq);
  const coordData = await coordRes.json();
  assert(coordRes.status === 200, 'GET /api/coordination returned 200');
  assert(Array.isArray(coordData.requests) && coordData.requests.length > 0, 'Returned coordination requests');

  const testCoord = coordData.requests[0];
  const patchCoordReq = makeRequest('/api/coordination', {
    method: 'PATCH',
    body: {
      id: testCoord.id,
      status: 'In Joint Review',
      newRemark: 'Test remark added via verification suite',
    },
  });
  const patchCoordRes = await patchCoordination(patchCoordReq);
  const patchCoordData = await patchCoordRes.json();
  assert(patchCoordRes.status === 200, 'PATCH /api/coordination returned 200');
  assert(patchCoordData.request?.status === 'In Joint Review', 'Coordination status updated');

  const createCoordReq = makeRequest('/api/coordination', {
    method: 'POST',
    body: {
      title: 'Automated Test Joint Inquiry',
      institutionName: 'Apex Institute of Technology & Engineering',
      institutionCode: '1-3329182741',
      requestingBureau: 'PGRC',
      targetBureau: 'Regulation Bureau',
      initialRemark: 'Coordination request created during verification',
    },
  });
  const createCoordRes = await postCoordination(createCoordReq);
  assert(createCoordRes.status === 201, 'POST /api/coordination created request (201)');

  // 9. Institutions API
  console.log('\n[9] Testing Institutions API (/api/institutions)...');
  const instRes = await getInstitutions();
  const instData = await instRes.json();
  assert(instRes.status === 200, 'GET /api/institutions returned 200');
  assert(Array.isArray(instData.institutions) && instData.institutions.length > 0, 'Returned institutions array');
  const apex = instData.institutions.find((i: any) => i.code === '1-3329182741');
  assert(!!apex, 'Apex Institute found in institutions directory');
  assert(typeof apex?.totalCases === 'number', `Apex totalCases calculated from complaints: ${apex?.totalCases}`);

  // 10. Regulatory Notices API
  console.log('\n[10] Testing Regulatory Notices API (/api/notices)...');
  const noticesReq = makeRequest('/api/notices');
  const noticesRes = await getNotices(noticesReq);
  const noticesData = await noticesRes.json();
  assert(noticesRes.status === 200, 'GET /api/notices returned 200');
  assert(Array.isArray(noticesData.notices) && noticesData.notices.length > 0, 'Returned regulatory notices');

  const createNoticeReq = makeRequest('/api/notices', {
    method: 'POST',
    body: {
      caseId: 'case-001',
      caseNumber: 'AICTE/PGRC/2026/8841',
      institutionName: 'Apex Institute of Technology & Engineering',
      institutionCode: '1-3329182741',
      noticeType: 'Show Cause Notice',
      reason: 'Automated test regulatory compliance notice',
      responseDeadline: '2026-11-15',
    },
  });
  const createNoticeRes = await postNotice(createNoticeReq);
  assert(createNoticeRes.status === 201, 'POST /api/notices created notice (201)');

  // 11. Institution Responses API
  console.log('\n[11] Testing Institution Responses API (/api/institution/responses)...');
  const respReq = makeRequest('/api/institution/responses?institutionCode=1-3329182741');
  const respRes = await getResponses(respReq);
  const respData = await respRes.json();
  assert(respRes.status === 200, 'GET /api/institution/responses returned 200');
  assert(respData.success === true, 'Response success is true');
  assert(Array.isArray(respData.responses), 'Returned responses array');

  const createRespReq = makeRequest('/api/institution/responses', {
    method: 'POST',
    body: {
      institutionCode: '1-3329182741',
      subject: 'Automated Test Compliance Representation',
      responseText: 'Clarification submitted for migration verification suite',
      caseId: 'case-001',
      caseNumber: 'AICTE/PGRC/2026/8841',
    },
  });
  const createRespRes = await postResponse(createRespReq);
  const createRespData = await createRespRes.json();
  assert(createRespRes.status === 200 && createRespData.success === true, 'POST /api/institution/responses created response');

  const patchRespReq = makeRequest('/api/institution/responses', {
    method: 'PATCH',
    body: {
      id: createRespData.response.id,
      status: 'Under Review',
      bureauFeedback: 'Feedback noted by test suite',
    },
  });
  const patchRespRes = await patchResponse(patchRespReq);
  assert(patchRespRes.status === 200, 'PATCH /api/institution/responses returned 200');

  // 12. Institution Profile API
  console.log('\n[12] Testing Institution Profile API (/api/institution/profile)...');
  const profReq = makeRequest('/api/institution/profile?code=1-3329182741');
  const profRes = await getProfile(profReq);
  const profData = await profRes.json();
  assert(profRes.status === 200, 'GET /api/institution/profile returned 200');
  assert(profData.success === true && profData.profile?.code === '1-3329182741', 'Fetched institution profile for Apex');

  const patchProfReq = makeRequest('/api/institution/profile', {
    method: 'PATCH',
    body: {
      code: '1-3329182741',
      contactPhone: '+91 11 23200001',
    },
  });
  const patchProfRes = await patchProfile(patchProfReq);
  assert(patchProfRes.status === 200, 'PATCH /api/institution/profile returned 200');

  // 13. Case History API
  console.log('\n[13] Testing Case History API (/api/case-history)...');
  const histReq = makeRequest('/api/case-history?caseId=case-001');
  const histRes = await getHistory(histReq);
  const histData = await histRes.json();
  assert(histRes.status === 200, 'GET /api/case-history returned 200');
  assert(Array.isArray(histData.history) && histData.history.length > 0, 'Returned case history timeline');

  const postHistReq = makeRequest('/api/case-history', {
    method: 'POST',
    body: {
      caseId: 'case-001',
      caseNumber: 'AICTE/PGRC/2026/8841',
      action: 'Verified by Migration Suite',
      remarks: 'Automated audit entry',
    },
  });
  const postHistRes = await postHistory(postHistReq);
  assert(postHistRes.status === 201, 'POST /api/case-history created record (201)');

  // 14. Verification of SQLite file removal
  console.log('\n[14] Verifying No Local SQLite/data Directory Exists...');
  const dataDir = path.join(process.cwd(), 'data');
  assert(!fs.existsSync(dataDir), 'Local data/ directory does NOT exist on filesystem');

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test runner error:', e);
  process.exit(1);
});
