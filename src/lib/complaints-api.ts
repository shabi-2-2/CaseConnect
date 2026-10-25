import { CaseItem } from '@/types/dashboard';

interface ComplaintsResponse {
  complaints: CaseItem[];
}

interface ComplaintResponse {
  complaint: CaseItem;
}

interface ErrorResponse {
  error?: string;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = (await res.json()) as ErrorResponse;
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function fetchComplaints(params?: Record<string, string>): Promise<CaseItem[]> {
  const query = params ? new URLSearchParams(params).toString() : '';
  const url = query ? `/api/complaints?${query}` : '/api/complaints';
  const res = await fetch(url, { cache: 'no-store' });
  const data = await handleResponse<ComplaintsResponse>(res);
  return Array.isArray(data.complaints) ? data.complaints : [];
}

export async function fetchComplaintById(id: string): Promise<CaseItem | null> {
  try {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (res.status === 404) return null;
    const data = await handleResponse<ComplaintResponse>(res);
    return data.complaint || null;
  } catch {
    return null;
  }
}

export async function createComplaint(input: Partial<CaseItem> & Record<string, any>): Promise<CaseItem> {
  const res = await fetch('/api/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await handleResponse<ComplaintResponse>(res);
  return data.complaint;
}

export async function updateComplaint(id: string, updates: Partial<CaseItem> & Record<string, any>): Promise<CaseItem> {
  const res = await fetch(`/api/complaints/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  const data = await handleResponse<ComplaintResponse>(res);
  return data.complaint;
}

export async function deleteComplaint(id: string): Promise<boolean> {
  const res = await fetch(`/api/complaints/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) return false;
  try {
    const data = await res.json();
    return !!data?.success;
  } catch {
    return res.ok;
  }
}
