// src/pages/client/tickets/TicketCreate.jsx
// Client Portal - Submit Support Ticket
// Allows client to open a new support or project change inquiry.

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getProjects } from '../../../api/projects';
import { createTicket } from '../../../api/tickets';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import toast from 'react-hot-toast';

import { ArrowLeft, Send, Ticket } from 'lucide-react';

export default function ClientTicketCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProject = searchParams.get('project');

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    project: preselectedProject || '',
  });

  useEffect(() => {
    getProjects()
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setProjects(data);
      })
      .catch((err) => {
        console.error('Failed to load projects:', err);
      })
      .finally(() => setLoadingProjects(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a ticket title.');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Please provide details in the description.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        project: formData.project ? Number(formData.project) : null,
      };

      const res = await createTicket(payload);
      toast.success('Support ticket submitted successfully!');
      navigate(`/client/tickets/${res.data.id}`);
    } catch (err) {
      console.error('Error submitting ticket:', err);
      toast.error('Failed to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/client/tickets')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={14} /> Back to Support Tickets
        </button>
      </div>

      <PageHeader
        title="Submit a Support Request"
        subtitle="Our engineering and support team typically responds within 2-4 hours."
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Ticket Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Subject / Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Question regarding shopping cart milestone delivery"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition"
              required
            />
          </div>

          {/* Related Project Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Related Project (Optional)
              </label>
              <select
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="">General Inquiry (No specific project)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="LOW">Low (General question or feedback)</option>
                <option value="MEDIUM">Medium (Standard feature or question)</option>
                <option value="HIGH">High (Needs prompt attention)</option>
                <option value="CRITICAL">Critical (Blocks operations)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Description & Details <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              placeholder="Describe your question, request, or issue in detail..."
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
              onClick={() => navigate('/client/tickets')}
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
              Submit Ticket
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
