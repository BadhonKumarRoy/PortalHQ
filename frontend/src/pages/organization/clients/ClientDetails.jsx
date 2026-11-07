// src/pages/organization/clients/ClientDetails.jsx
// A 360° view of a single client with tabs: Overview, Projects, Tickets, Documents.

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Mail, Phone, Globe, MapPin, Building2, User } from 'lucide-react';
import { getClient } from '../../../api/clients';
import { getProjects } from '../../../api/projects';
import { getTickets } from '../../../api/tickets';
import { getDocuments } from '../../../api/documents';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Table from '../../../components/ui/Table';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Projects', 'Tickets', 'Documents'];

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [clientRes, projectsRes, ticketsRes, docsRes] = await Promise.all([
          getClient(id),
          getProjects({ client: id }),
          getTickets({ client: id }),
          getDocuments({ client: id }),
        ]);
        setClient(clientRes.data);
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data?.results || []);
        setTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : ticketsRes.data?.results || []);
        setDocuments(Array.isArray(docsRes.data) ? docsRes.data : docsRes.data?.results || []);
      } catch {
        toast.error('Failed to load client details.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!client) return <div className="text-slate-500">Client not found.</div>;

  const projectColumns = [
    { key: 'title', label: 'Project' },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: 'start_date', label: 'Start', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'end_date', label: 'End', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  const ticketColumns = [
    { key: 'title', label: 'Issue' },
    { key: 'priority', label: 'Priority', render: (v) => <Badge status={v} /> },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: 'created_at', label: 'Created', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  const docColumns = [
    { key: 'title', label: 'Document' },
    { key: 'category', label: 'Category' },
    { key: 'uploaded_by_name', label: 'Uploaded By' },
    { key: 'created_at', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : '—' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.company_name}
        subtitle={client.industry || 'Client'}
        action={
          <Button icon={Pencil} variant="secondary" onClick={() => navigate(`/organization/clients/${id}/edit`)}>
            Edit Client
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Contact Information">
            <div className="space-y-4">
              <InfoRow icon={User} label="Contact Person" value={client.contact_name || client.name} />
              <InfoRow icon={Building2} label="Company" value={client.company_name} />
              <InfoRow icon={Mail} label="Email" value={client.email} />
              <InfoRow icon={Phone} label="Phone" value={client.phone} />
              <InfoRow icon={Globe} label="Website" value={client.website} />
              <InfoRow icon={MapPin} label="Address" value={client.address} />
            </div>
          </Card>
          <Card title="Status & Notes">
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Status</p>
                <Badge status={client.status} />
              </div>
              {client.notes && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Notes</p>
                  <p className="text-sm text-slate-700">{client.notes}</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'Projects' && (
        <Card title="Projects">
          <Table columns={projectColumns} data={projects} emptyMessage="No projects for this client." onRowClick={(row) => navigate(`/organization/projects/${row.id}`)} />
        </Card>
      )}

      {/* Tickets Tab */}
      {activeTab === 'Tickets' && (
        <Card title="Support Tickets">
          <Table columns={ticketColumns} data={tickets} emptyMessage="No tickets for this client." onRowClick={(row) => navigate(`/organization/tickets/${row.id}`)} />
        </Card>
      )}

      {/* Documents Tab */}
      {activeTab === 'Documents' && (
        <Card title="Documents">
          <Table columns={docColumns} data={documents} emptyMessage="No documents shared with this client." />
        </Card>
      )}
    </div>
  );
}

// Helper component for displaying labeled info rows
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className="text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value || '—'}</p>
      </div>
    </div>
  );
}
