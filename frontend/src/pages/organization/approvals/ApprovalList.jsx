// src/pages/organization/approvals/ApprovalList.jsx
// Organization Admin - Client Approvals Queue
// Track formal sign-offs, deliverable approvals, and client review decisions.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApprovals, createApproval, deleteApproval, reviewApproval } from '../../../api/approvals';
import { getDocuments } from '../../../api/documents';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import StatCard from '../../../components/ui/StatCard';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Plus,
  Search,
  FileText,
  Building2,
  Trash2,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

const STATUS_TABS = ['All', 'PENDING', 'APPROVED', 'REVISION_NEEDED', 'REJECTED'];

export default function ApprovalList() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Request new approval modal
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [requestNotes, setRequestNotes] = useState('');

  // Quick review decision modal
  const [decisionModal, setDecisionModal] = useState({
    open: false,
    approval: null,
    status: '',
    comments: '',
  });
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appRes, docsRes] = await Promise.allSettled([
        getApprovals(),
        getDocuments(),
      ]);

      if (appRes.status === 'fulfilled') {
        const aData = Array.isArray(appRes.value.data)
          ? appRes.value.data
          : appRes.value.data?.results || [];
        setApprovals(aData);
      }

      if (docsRes.status === 'fulfilled') {
        const dData = Array.isArray(docsRes.value.data)
          ? docsRes.value.data
          : docsRes.value.data?.results || [];
        setDocuments(dData);
      }
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create approval request
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!selectedDocId) {
      toast.error('Please select a document to request approval on.');
      return;
    }

    setSubmittingRequest(true);
    try {
      await createApproval({
        document: Number(selectedDocId),
        comments: requestNotes.trim(),
      });
      toast.success('Approval request created and sent to client!');
      setRequestModalOpen(false);
      setSelectedDocId('');
      setRequestNotes('');
      fetchData();
    } catch (err) {
      console.error('Create approval error:', err);
      toast.error('Failed to create approval request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Submit quick review decision
  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!decisionModal.approval) return;

    setSubmittingDecision(true);
    try {
      await reviewApproval(
        decisionModal.approval.id,
        decisionModal.status,
        decisionModal.comments
      );
      toast.success(`Approval status updated to ${decisionModal.status.replace(/_/g, ' ')}!`);
      setDecisionModal({ open: false, approval: null, status: '', comments: '' });
      fetchData();
    } catch (err) {
      console.error('Review error:', err);
      toast.error('Failed to update approval decision.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Delete approval request
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete approval request for "${title}"?`)) return;

    try {
      await deleteApproval(id);
      toast.success('Approval request deleted.');
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete approval request.');
    }
  };

  // Filter approvals
  const filteredApprovals = approvals.filter((app) => {
    const matchesTab = activeTab === 'All' || app.status === activeTab;
    const matchesSearch =
      !searchQuery ||
      (app.document_title && app.document_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.client_name && app.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (app.requested_by_name && app.requested_by_name.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;
  const approvedCount = approvals.filter((a) => a.status === 'APPROVED').length;
  const revisionCount = approvals.filter((a) => a.status === 'REVISION_NEEDED').length;
  const rejectedCount = approvals.filter((a) => a.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Approvals Queue"
        subtitle="Manage formal document sign-offs, deliverable approvals, and client decisions."
        action={
          <Button
            variant="primary"
            icon={Plus}
            className="!bg-[#121358] hover:!bg-[#2F578A]"
            onClick={() => setRequestModalOpen(true)}
          >
            Request New Approval
          </Button>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total In Queue"
          value={approvals.length}
          icon={ClipboardCheck}
          color="#121358"
          loading={loading}
          change="All Approval Records"
        />
        <StatCard
          title="Awaiting Decision"
          value={pendingCount}
          icon={Clock}
          color="#f59e0b"
          loading={loading}
          change={pendingCount > 0 ? 'Requires client review' : 'All clear'}
        />
        <StatCard
          title="Approved Deliverables"
          value={approvedCount}
          icon={CheckCircle2}
          color="#36ADA3"
          loading={loading}
          change="Client Signed Off"
        />
        <StatCard
          title="Revisions & Changes"
          value={revisionCount + rejectedCount}
          icon={AlertTriangle}
          color="#E47B24"
          loading={loading}
          change="Action Required"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        {/* Status Tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === tab
                  ? 'bg-[#121358] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'All' ? 'All Approvals' : tab.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search approvals or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Approvals Table */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredApprovals.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <ClipboardCheck className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-semibold text-slate-700">No Approvals Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || activeTab !== 'All'
              ? 'No approval records match your filter criteria.'
              : 'Request formal client approval on contracts, design proofs, or completed deliverables.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setRequestModalOpen(true)}
          >
            Request First Approval
          </Button>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Document / Deliverable</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Requested By</th>
                  <th className="py-3.5 px-4">Decision & Notes</th>
                  <th className="py-3.5 px-4">Requested Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApprovals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {item.document_title || `Document #${item.document}`}
                          </p>
                          <span className="font-mono text-[10px] text-slate-400">
                            APPROVAL #{item.id}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.client_name ? (
                        <span className="font-semibold text-slate-700">
                          {item.client_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not linked</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge status={item.status} />
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {item.requested_by_name || 'Staff'}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      {item.comments ? (
                        <p className="text-slate-600 truncate" title={item.comments}>
                          "{item.comments}"
                        </p>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                      {item.reviewed_by_name && (
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          Reviewed by {item.reviewed_by_name}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(item.requested_at).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs"
                          onClick={() => navigate(`/organization/approvals/${item.id}`)}
                        >
                          Review
                        </Button>
                        <button
                          onClick={() => handleDelete(item.id, item.document_title || `#${item.id}`)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Request"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Request Approval Modal */}
      <Modal
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        title="Request Document Approval"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Select Deliverable Document <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Select a document from library...</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title} {d.client_name ? `(${d.client_name})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Review Instructions / Notes for Client
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Please review section 4 and approve the sign-off before Friday."
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submittingRequest}
              className="!bg-[#121358]"
            >
              Send Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
