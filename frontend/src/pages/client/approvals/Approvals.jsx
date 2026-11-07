// src/pages/client/approvals/Approvals.jsx
// Client Portal - Pending Approvals & Sign-offs
// Allows clients to review deliverable documents, designs, or milestone sign-offs.

import { useState, useEffect, useCallback } from 'react';
import { getApprovals, reviewApproval } from '../../../api/approvals';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  MessageSquare,
  Clock,
} from 'lucide-react';

export default function ClientApprovals() {
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState([]);

  // Decision Modal
  const [decisionModal, setDecisionModal] = useState({
    open: false,
    approval: null,
    status: '', // 'APPROVED' or 'REJECTED'
    comments: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getApprovals();
      const aData = Array.isArray(res.data) ? res.data : res.data?.results || [];
      setApprovals(aData);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleOpenDecision = (approval, status) => {
    setDecisionModal({
      open: true,
      approval,
      status,
      comments: '',
    });
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!decisionModal.approval) return;

    setSubmitting(true);
    try {
      await reviewApproval(
        decisionModal.approval.id,
        decisionModal.status,
        decisionModal.comments
      );
      toast.success(
        decisionModal.status === 'APPROVED'
          ? 'Deliverable approved successfully!'
          : 'Revision requested.'
      );
      setDecisionModal({ open: false, approval: null, status: '', comments: '' });
      fetchApprovals();
    } catch (err) {
      console.error('Failed to submit approval review:', err);
      toast.error('Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING' || a.status === 'PENDING_REVIEW');
  const pastApprovals = approvals.filter((a) => a.status !== 'PENDING' && a.status !== 'PENDING_REVIEW');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Approvals"
        subtitle="Review deliverable sign-offs and approve completed milestones."
      />

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : approvals.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <ClipboardCheck className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-semibold text-slate-700">No Approvals Pending</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            When your agency engineering team requests acceptance on deliverables or documents, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Sign-offs Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Awaiting Your Decision ({pendingApprovals.length})
              </h2>
            </div>

            {pendingApprovals.length === 0 ? (
              <Card className="p-6 text-center text-xs text-slate-400 bg-slate-50/50">
                You're all caught up! No approvals waiting for your review.
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingApprovals.map((item) => (
                  <Card key={item.id} className="p-5 border-amber-200 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <FileText size={18} className="text-blue-600" />
                        <h3 className="text-sm font-bold text-slate-800">
                          {item.document_title || `Approval #${item.id}`}
                        </h3>
                      </div>
                      <Badge status={item.status} />
                    </div>

                    <p className="text-xs text-slate-500 mb-4">
                      Requested by <strong>{item.requested_by_name || 'Project Staff'}</strong> on{' '}
                      {new Date(item.requested_at).toLocaleDateString()}
                    </p>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={CheckCircle2}
                        className="flex-1 !bg-emerald-600 hover:!bg-emerald-700 text-xs"
                        onClick={() => handleOpenDecision(item, 'APPROVED')}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={XCircle}
                        className="flex-1 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => handleOpenDecision(item, 'REJECTED')}
                      >
                        Request Revision
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Past Decisions History */}
          {pastApprovals.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-3">
                Review History ({pastApprovals.length})
              </h2>

              <Card className="divide-y divide-slate-100 overflow-hidden">
                {pastApprovals.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {item.document_title || `Approval #${item.id}`}
                      </p>
                      <p className="text-slate-400 mt-0.5">
                        Reviewed on {item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString() : '—'}
                        {item.comments && ` • "${item.comments}"`}
                      </p>
                    </div>
                    <Badge status={item.status} />
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Decision Modal */}
      <Modal
        open={decisionModal.open}
        onClose={() => setDecisionModal({ open: false, approval: null, status: '', comments: '' })}
        title={decisionModal.status === 'APPROVED' ? 'Approve Deliverable' : 'Request Changes / Revisions'}
      >
        <form onSubmit={handleSubmitDecision} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {decisionModal.status === 'APPROVED'
              ? 'Are you ready to sign off on this item? Your team will be notified of your approval.'
              : 'Please explain what needs adjustment or revisions so the team can address it.'}
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Comments / Notes {decisionModal.status === 'REJECTED' && <span className="text-red-500">*</span>}
            </label>
            <textarea
              rows={4}
              value={decisionModal.comments}
              onChange={(e) => setDecisionModal({ ...decisionModal, comments: e.target.value })}
              placeholder={decisionModal.status === 'APPROVED' ? 'Optional feedback...' : 'Describe required adjustments...'}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              required={decisionModal.status === 'REJECTED'}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setDecisionModal({ open: false, approval: null, status: '', comments: '' })}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              className={decisionModal.status === 'APPROVED' ? '!bg-emerald-600' : '!bg-red-600'}
            >
              Confirm {decisionModal.status === 'APPROVED' ? 'Approval' : 'Revision Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
