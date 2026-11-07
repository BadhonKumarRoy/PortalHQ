// src/pages/organization/approvals/ApprovalDetails.jsx
// Organization Admin - Approval Review & Decision Detail
// Inspect approval requests, review attached documents, and record approval decisions.

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApproval, reviewApproval } from '../../../api/approvals';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  User,
  Clock,
  Send,
} from 'lucide-react';

export default function ApprovalDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [approval, setApproval] = useState(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchApproval = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getApproval(id);
      setApproval(res.data);
      if (res.data?.comments) {
        setComments(res.data.comments);
      }
    } catch (err) {
      console.error('Failed to load approval:', err);
      toast.error('Failed to load approval details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApproval();
  }, [fetchApproval]);

  const handleDecision = async (newStatus) => {
    setSubmitting(true);
    try {
      await reviewApproval(id, newStatus, comments.trim());
      toast.success(`Approval status updated to ${newStatus.replace(/_/g, ' ')}!`);
      fetchApproval();
    } catch (err) {
      console.error('Error submitting decision:', err);
      toast.error('Failed to update approval decision.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!approval) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Approval Request Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          This approval record could not be found or has been deleted.
        </p>
        <Button variant="primary" onClick={() => navigate('/organization/approvals')}>
          Back to Approvals Queue
        </Button>
      </div>
    );
  }

  const downloadUrl = approval.document_file_url;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/organization/approvals')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={14} /> Back to Approvals Queue
        </button>

        <span className="text-xs font-mono font-semibold text-slate-400">
          APPROVAL #{approval.id}
        </span>
      </div>

      <PageHeader
        title={approval.document_title || `Approval Request #${approval.id}`}
        subtitle={`Requested by ${approval.requested_by_name || 'Staff'} on ${new Date(
          approval.requested_at
        ).toLocaleDateString()}`}
        action={<Badge status={approval.status} />}
      />

      {/* Main Details Card */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
          {/* Document Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Attached Deliverable / Document
            </h3>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <FileText size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {approval.document_title}
                </p>
                <p className="text-xs text-slate-400">
                  Document ID #{approval.document}
                </p>
              </div>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
                >
                  <Download size={13} /> Download
                </a>
              )}
            </div>
          </div>

          {/* Meta Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Client & Request Context
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Client Organization:</span>
                <strong className="text-slate-800">{approval.client_name || 'Internal'}</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Requested By:</span>
                <strong className="text-slate-800">{approval.requested_by_name || 'Staff'}</strong>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">Current Decision Status:</span>
                <Badge status={approval.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Existing Decision / Feedback */}
        <div className="pt-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
            Reviewer Feedback / Decision Notes
          </h3>
          <textarea
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Add review feedback, change requests, or approval confirmation notes..."
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white transition"
          />

          {approval.reviewed_by_name && (
            <p className="text-[11px] text-slate-400 mt-2">
              Last reviewed by <strong>{approval.reviewed_by_name}</strong> on{' '}
              {approval.reviewed_at ? new Date(approval.reviewed_at).toLocaleString() : '—'}
            </p>
          )}

          {/* Decision Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-slate-100 flex-wrap">
            <Button
              type="button"
              variant="secondary"
              icon={AlertTriangle}
              loading={submitting}
              className="text-xs text-amber-700 hover:bg-amber-50"
              onClick={() => handleDecision('REVISION_NEEDED')}
            >
              Request Revision
            </Button>
            <Button
              type="button"
              variant="secondary"
              icon={XCircle}
              loading={submitting}
              className="text-xs text-red-600 hover:bg-red-50"
              onClick={() => handleDecision('REJECTED')}
            >
              Reject
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={CheckCircle2}
              loading={submitting}
              className="text-xs !bg-emerald-600 hover:!bg-emerald-700"
              onClick={() => handleDecision('APPROVED')}
            >
              Approve Deliverable
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
