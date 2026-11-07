// src/pages/organization/tickets/TicketCreate.jsx
// Organization Admin - Create Support Ticket
// Create and log customer support tickets, assign engineers, and specify SLA priorities.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTicket } from '../../../api/tickets';
import { getClients } from '../../../api/clients';
import { getProjects } from '../../../api/projects';
import { getUsers } from '../../../api/auth';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import { ArrowLeft, Send, Ticket } from 'lucide-react';

export default function TicketCreate() {
  const navigate = useNavigate();

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    client: '',
    project: '',
    assigned_to: '',
    priority: 'MEDIUM',
    description: '',
  });

  useEffect(() => {
    Promise.allSettled([getClients(), getProjects(), getUsers()])
      .then(([cRes, pRes, uRes]) => {
        if (cRes.status === 'fulfilled') {
          setClients(Array.isArray(cRes.value.data) ? cRes.value.data : cRes.value.data?.results || []);
        }
        if (pRes.status === 'fulfilled') {
          setProjects(Array.isArray(pRes.value.data) ? pRes.value.data : pRes.value.data?.results || []);
        }
        if (uRes.status === 'fulfilled') {
          const uData = Array.isArray(uRes.value.data) ? uRes.value.data : uRes.value.data?.results || [];
          setStaffUsers(uData.filter((u) => u.role === 'ADMIN' || u.role === 'EMPLOYEE'));
        }
      })
      .finally(() => setLoadingInitial(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Ticket subject is required.');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Ticket details/description are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        client: formData.client ? Number(formData.client) : null,
        project: formData.project ? Number(formData.project) : null,
        assigned_to: formData.assigned_to ? Number(formData.assigned_to) : null,
        status: formData.assigned_to ? 'ASSIGNED' : 'OPEN',
      };

      const res = await createTicket(payload);
      toast.success('Support ticket created successfully!');
      navigate(`/organization/tickets/${res.data.id}`);
    } catch (err) {
      console.error('Create ticket error:', err);
      toast.error('Failed to create ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter projects by selected client if one is selected
  const availableProjects = formData.client
    ? projects.filter((p) => String(p.client) === String(formData.client))
    : projects;

  if (loadingInitial) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/organization/tickets')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={14} /> Back to Ticket Queue
        </button>
      </div>

      <PageHeader
        title="Create Support Ticket"
        subtitle="Log customer inquiries, bugs, or technical tasks and assign to team members."
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ticket Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Subject / Issue Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Database connection timeout during peak hours"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition"
              required
            />
          </div>

          {/* Client & Project Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Client Organization
              </label>
              <select
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value, project: '' })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="">Internal / No Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Related Project
              </label>
              <select
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="">No Project Link</option>
                {availableProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="LOW">Low (General question)</option>
                <option value="MEDIUM">Medium (Standard feature)</option>
                <option value="HIGH">High (Needs prompt attention)</option>
                <option value="CRITICAL">Critical (Blocks operations)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Assign to Staff Member
              </label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="">Leave Unassigned</option>
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Issue Description & Details <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Describe the issue, reproduction steps, or request specifics..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition leading-relaxed"
              required
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/organization/tickets')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Send}
              loading={submitting}
              className="!bg-[#121358] hover:!bg-[#2F578A]"
            >
              Create Ticket
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
