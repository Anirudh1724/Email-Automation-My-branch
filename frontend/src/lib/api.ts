/**
 * API Client for Backend
 * All frontend operations go through this client to the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
    }

    getToken(): string | null {
        return this.token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Request failed' }));
            throw new Error(error.detail || error.message || 'Request failed');
        }

        // Handle empty responses
        const text = await response.text();
        return (text ? JSON.parse(text) : null) as T;
    }

    // Auth
    async login(email: string, password: string) {
        return this.request<{ access_token: string; user: any }>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async register(email: string, password: string, fullName?: string) {
        return this.request<{ access_token: string; user: any }>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, full_name: fullName }),
        });
    }

    async logout() {
        return this.request('/api/auth/logout', { method: 'POST' });
    }

    async getMe() {
        return this.request<any>('/api/auth/me');
    }

    async updateProfile(updates: any) {
        return this.request<any>('/api/auth/profile', {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async updatePassword(password: string) {
        return this.request('/api/auth/password', {
            method: 'PATCH',
            body: JSON.stringify({ password }),
        });
    }

    // Campaigns
    async getCampaigns() {
        return this.request<any[]>('/api/campaigns');
    }

    async getCampaign(id: string) {
        return this.request<any>(`/api/campaigns/${id}`);
    }

    async createCampaign(campaign: any) {
        return this.request<any>('/api/campaigns', {
            method: 'POST',
            body: JSON.stringify(campaign),
        });
    }

    async updateCampaign(id: string, updates: any) {
        return this.request<any>(`/api/campaigns/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async deleteCampaign(id: string) {
        return this.request(`/api/campaigns/${id}`, { method: 'DELETE' });
    }

    async updateCampaignStatus(id: string, status: string) {
        return this.request<any>(`/api/campaigns/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });
    }

    // Leads
    async getLeads(campaignId?: string, leadListId?: string) {
        const params = new URLSearchParams();
        if (campaignId) params.append('campaign_id', campaignId);
        if (leadListId) params.append('lead_list_id', leadListId);
        const query = params.toString() ? `?${params}` : '';
        return this.request<any[]>(`/api/leads${query}`);
    }

    async getLead(id: string) {
        return this.request<any>(`/api/leads/${id}`);
    }

    async createLead(lead: any) {
        return this.request<any>('/api/leads', {
            method: 'POST',
            body: JSON.stringify(lead),
        });
    }

    async createLeadsBulk(leadListId: string, campaignId: string | undefined, leads: any[]) {
        return this.request<any[]>('/api/leads/bulk', {
            method: 'POST',
            body: JSON.stringify({ lead_list_id: leadListId, campaign_id: campaignId, leads }),
        });
    }

    async updateLead(id: string, updates: any) {
        return this.request<any>(`/api/leads/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async deleteLead(id: string) {
        return this.request(`/api/leads/${id}`, { method: 'DELETE' });
    }

    async deleteLeadsBulk(ids: string[]) {
        return this.request('/api/leads/bulk/delete', {
            method: 'POST',
            body: JSON.stringify({ ids }),
        });
    }

    // Lead Lists
    async getLeadLists() {
        return this.request<any[]>('/api/lead-lists');
    }

    async getLeadList(id: string) {
        return this.request<any>(`/api/lead-lists/${id}`);
    }

    async createLeadList(data: any) {
        return this.request<any>('/api/lead-lists', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateLeadList(id: string, updates: any) {
        return this.request<any>(`/api/lead-lists/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async deleteLeadList(id: string) {
        return this.request(`/api/lead-lists/${id}`, { method: 'DELETE' });
    }

    // Email Templates
    async getTemplates() {
        return this.request<any[]>('/api/templates');
    }

    async getTemplate(id: string) {
        return this.request<any>(`/api/templates/${id}`);
    }

    async createTemplate(template: any) {
        return this.request<any>('/api/templates', {
            method: 'POST',
            body: JSON.stringify(template),
        });
    }

    async updateTemplate(id: string, updates: any) {
        return this.request<any>(`/api/templates/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async deleteTemplate(id: string) {
        return this.request(`/api/templates/${id}`, { method: 'DELETE' });
    }

    async incrementTemplateUsage(id: string) {
        return this.request<any>(`/api/templates/${id}/use`, { method: 'POST' });
    }

    // Sending Accounts
    async getSendingAccounts() {
        return this.request<any[]>('/api/sending-accounts');
    }

    async getSendingAccount(id: string) {
        return this.request<any>(`/api/sending-accounts/${id}`);
    }

    async createSendingAccount(account: any) {
        return this.request<any>('/api/sending-accounts', {
            method: 'POST',
            body: JSON.stringify(account),
        });
    }

    async updateSendingAccount(id: string, updates: any) {
        return this.request<any>(`/api/sending-accounts/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async deleteSendingAccount(id: string) {
        return this.request(`/api/sending-accounts/${id}`, { method: 'DELETE' });
    }

    // Inbox
    async getInboxThreads() {
        return this.request<any[]>('/api/inbox/threads');
    }

    async getThreadHistory(leadId: string) {
        return this.request<any[]>(`/api/inbox/threads/${leadId}`);
    }

    // Email Events
    async getEmailEvents(campaignId?: string) {
        const query = campaignId ? `?campaign_id=${campaignId}` : '';
        return this.request<any[]>(`/api/email-events${query}`);
    }

    // Domains
    async getDomains() {
        return this.request<any[]>('/api/domains');
    }

    async getDomainHealth(id: string) {
        return this.request<any>(`/api/domains/${id}/health`);
    }

    async createDomain(domain: string) {
        return this.request<any>('/api/domains', {
            method: 'POST',
            body: JSON.stringify({ domain }),
        });
    }

    async updateDomain(id: string, updates: any) {
        return this.request<any>(`/api/domains/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async deleteDomain(id: string) {
        return this.request(`/api/domains/${id}`, { method: 'DELETE' });
    }

    // Team
    async getTeamMembers() {
        return this.request<any[]>('/api/team');
    }

    async inviteTeamMember(email: string, role?: string) {
        return this.request<any>('/api/team/invite', {
            method: 'POST',
            body: JSON.stringify({ member_email: email, role }),
        });
    }

    async removeTeamMember(id: string) {
        return this.request(`/api/team/${id}`, { method: 'DELETE' });
    }

    // Subscription
    async getSubscription() {
        return this.request<any>('/api/subscriptions');
    }

    // Unsubscribe
    async getUnsubscribeList() {
        return this.request<any[]>('/api/unsubscribe');
    }

    async addToUnsubscribeList(email: string, reason?: string) {
        return this.request<any>('/api/unsubscribe', {
            method: 'POST',
            body: JSON.stringify({ email, reason }),
        });
    }

    async removeFromUnsubscribeList(id: string) {
        return this.request(`/api/unsubscribe/${id}`, { method: 'DELETE' });
    }

    async getDomainBlacklist() {
        return this.request<any[]>('/api/unsubscribe/blacklist');
    }

    async addToDomainBlacklist(domain: string) {
        return this.request<any>('/api/unsubscribe/blacklist', {
            method: 'POST',
            body: JSON.stringify({ domain }),
        });
    }

    async removeFromDomainBlacklist(id: string) {
        return this.request(`/api/unsubscribe/blacklist/${id}`, { method: 'DELETE' });
    }

    // Email Operations
    async sendCampaignEmails(campaignId?: string) {
        const query = campaignId ? `?campaign_id=${campaignId}` : '';
        return this.request<any>(`/api/emails/send-campaign${query}`, { method: 'POST' });
    }

    async checkReplies() {
        return this.request<any>('/api/emails/check-replies', { method: 'POST' });
    }
}

export const api = new ApiClient();
export default api;
