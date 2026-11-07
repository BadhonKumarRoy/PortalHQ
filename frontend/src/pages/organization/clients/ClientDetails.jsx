// src/pages/organization/clients/ClientDetails.jsx
// A 360° view of a single client with tabs: Overview, Projects, Tickets, Documents.
// Includes a 1-click 'Share Portal Login' credential generator to copy and send to the client.

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Mail, Phone, Globe, MapPin, Building2, User, KeyRound, Copy, Check } from 'lucide-react';
import { getClient, getClientPortalAccess } from '../../../api/clients';
import { getProjects } from '../../../api/projects';
import { getTickets } from '../../../api/tickets';
import { getDocuments } from '../../../api/documents';
import { copyToClipboard } from '../../../utils/clipboard';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Table from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
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

  // Generating state for credentials
  const [generating, setGenerating] = useState(false);

  // Credentials Modal State
  const [credModal, setCredModal] = useState({
    open: false,
    email: '',
    password: '',
    copied: false,
  });

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

  /** Retrieve or reset client's portal login info and auto-copy to clipboard */
  const handlePortalAccess = async () => {
    setGenerating(true);
    try {
      const res = await getClientPortalAccess(id);
      const textToCopy = `🔑 PortalHQ Client Portal Access:\n• Portal URL: ${window.location.origin}/\n• Company: ${client?.company_name}\n• Email: ${res.data.email}\n• Temporary Password: ${res.data.temp_password}`;
      
      const isCopied = await copyToClipboard(textToCopy);

      setCredModal({
        open: true,
        email: res.data.email,
        password: res.data.temp_password,
        copied: isCopied,
      });

      if (isCopied) {
        toast.success('Credentials copied to clipboard!');
      } else {
        toast.success('Credentials ready to copy!');
      }
    } catch {
      toast.error('Failed to generate client portal credentials.');
    } finally {
      setGenerating(false);
    }
  };

  /** Manual click on Copy button inside the modal */
  const handleCopyFromModal = async () => {
    const textToCopy = `🔑 PortalHQ Client Portal Access:\n• Portal URL: ${window.location.origin}/\n• Company: ${client?.company_name}\n• Email: ${credModal.email}\n• Temporary Password: ${credModal.password}`;
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCredModal((prev) => ({ ...prev, copied: true }));
      toast.success('Credentials copied to clipboard!');
      setTimeout(() => {
        setCredModal((prev) => ({ ...prev, copied: false }));
      }, 3000);
    } else {
      toast.error('Could not copy automatically. Please select and copy the text below.');
    }
  };

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
        subtitle={client.industry || 'Client Profile'}
        action={
          <div className="flex gap-2">
            <Button
              icon={KeyRound}
              variant="secondary"
              loading={generating}
              onClick={handlePortalAccess}
            >
              Share Portal Login
            </Button>
            <Button
              icon={Pencil}
              variant="secondary"
              onClick={() => navigate(`/organization/clients/${id}/edit`)}
            >
              Edit Client
            </Button>
          </div>
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

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  size="sm"
                  icon={KeyRound}
                  variant="secondary"
                  loading={generating}
                  onClick={handlePortalAccess}
                >
                  Share Portal Login
                </Button>
              </div>
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
                  <p className="text-sm text-slate-700 whitespace-pre-line">{client.notes}</p>
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

      {/* ── MODAL: 1-CLICK CLIENT CREDENTIAL CARD ──────────────────────────── */}
      <Modal
        open={credModal.open}
        onClose={() => setCredModal((prev) => ({ ...prev, open: false }))}
        title="Client Portal Access Details"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Copy and send these login credentials to <strong>{client.contact_name || client.name}</strong> via WhatsApp, SMS, or email:
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs space-y-2 text-slate-800">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-400 font-sans">Login Portal:</span>
              <span className="font-semibold text-teal-700">{window.location.origin}/</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-400 font-sans">Company:</span>
              <span className="font-semibold">{client.company_name}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-400 font-sans">Email:</span>
              <span className="font-semibold">{credModal.email}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-sans">Temporary Password:</span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {credModal.password}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant={credModal.copied ? 'primary' : 'secondary'}
              icon={credModal.copied ? Check : Copy}
              onClick={handleCopyFromModal}
            >
              {credModal.copied ? '✓ Copied to Clipboard!' : 'Copy Login Credentials'}
            </Button>
            <Button onClick={() => setCredModal((prev) => ({ ...prev, open: false }))}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
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
