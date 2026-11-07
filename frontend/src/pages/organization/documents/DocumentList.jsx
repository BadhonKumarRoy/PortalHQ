// src/pages/organization/documents/DocumentList.jsx
// Organization Admin - Document Management Library
// Full document repository: upload, categorize, track versions, and share files with clients.

import { useState, useEffect, useCallback } from 'react';
import {
  getDocuments,
  uploadDocument,
  deleteDocument,
  toggleShareDocument,
  getFileUrl,
} from '../../../api/documents';
import { getClients } from '../../../api/clients';
import { getProjects } from '../../../api/projects';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import StatCard from '../../../components/ui/StatCard';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

import {
  FileText,
  Upload,
  Download,
  Trash2,
  Search,
  Calendar,
  FolderOpen,
  Building2,
  FileCheck,
  ShieldCheck,
  Lock,
  Share2,
  AlertCircle,
} from 'lucide-react';

const CATEGORY_TABS = ['All', 'Deliverable', 'Specification', 'Contract', 'Invoice', 'Report', 'Other'];

// 500 KB upload restriction
const MAX_FILE_SIZE_BYTES = 500 * 1024; // 500 KB

export default function DocumentList() {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'DELIVERABLE',
    client: '',
    project: '',
    version: '1.0',
    is_shared_with_client: true,
    file: null,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [docsRes, clientsRes, projRes] = await Promise.allSettled([
        getDocuments(),
        getClients(),
        getProjects(),
      ]);

      if (docsRes.status === 'fulfilled') {
        const dData = Array.isArray(docsRes.value.data)
          ? docsRes.value.data
          : docsRes.value.data?.results || [];
        setDocuments(dData);
      }

      if (clientsRes.status === 'fulfilled') {
        const cData = Array.isArray(clientsRes.value.data)
          ? clientsRes.value.data
          : clientsRes.value.data?.results || [];
        setClients(cData);
      }

      if (projRes.status === 'fulfilled') {
        const pData = Array.isArray(projRes.value.data)
          ? projRes.value.data
          : projRes.value.data?.results || [];
        setProjects(pData);
      }
    } catch (err) {
      console.error('Failed to load documents data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle file selection with 500 KB limit validation
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setFormData((prev) => ({ ...prev, file: null }));
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(
        `File size (${(file.size / 1024).toFixed(1)} KB) exceeds the maximum allowed limit of 500 KB. Please select a smaller file.`
      );
      e.target.value = '';
      setFormData((prev) => ({ ...prev, file: null }));
      return;
    }
    setFormData((prev) => ({ ...prev, file }));
  };

  // Handle document upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Document title is required.');
      return;
    }
    if (!formData.file) {
      toast.error('Please choose a file under 500 KB to upload.');
      return;
    }
    if (formData.file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('File size exceeds the 500 KB limit.');
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append('title', formData.title.trim());
      data.append('category', formData.category);
      data.append('version', formData.version || '1.0');
      data.append('is_shared_with_client', formData.is_shared_with_client);
      data.append('file', formData.file);
      if (formData.client) data.append('client', formData.client);
      if (formData.project) data.append('project', formData.project);

      await uploadDocument(data);
      toast.success('Document uploaded successfully!');
      setUploadModalOpen(false);
      setFormData({
        title: '',
        category: 'DELIVERABLE',
        client: '',
        project: '',
        version: '1.0',
        is_shared_with_client: true,
        file: null,
      });
      fetchData();
    } catch (err) {
      console.error('Upload error:', err);
      const errMsg =
        err.response?.data?.file?.[0] ||
        err.response?.data?.detail ||
        'Failed to upload document. Please ensure the file is under 500 KB.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // 1-Click Document Sharing Toggle
  const handleToggleShare = async (docId, title, currentStatus) => {
    try {
      const res = await toggleShareDocument(docId);
      const newStatus = res.data?.is_shared_with_client ?? !currentStatus;
      toast.success(
        newStatus
          ? `"${title}" is now shared with client.`
          : `"${title}" is now internal only.`
      );
      fetchData();
    } catch (err) {
      console.error('Toggle share error:', err);
      toast.error('Failed to update document sharing status.');
    }
  };

  // Handle document deletion
  const handleDelete = async (docId, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    try {
      await deleteDocument(docId);
      toast.success('Document deleted.');
      fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete document.');
    }
  };

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const docCat = (doc.category_display || doc.category || '').toUpperCase();
    const tabUpper = activeCategory.toUpperCase();
    const matchesCategory = activeCategory === 'All' || docCat === tabUpper;

    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.client_name && doc.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.project_title && doc.project_title.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const sharedCount = documents.filter((d) => d.is_shared_with_client).length;
  const deliverableCount = documents.filter(
    (d) =>
      (d.category || '').toUpperCase() === 'DELIVERABLE' ||
      (d.category || '').toUpperCase() === 'SPECIFICATION'
  ).length;
  const contractCount = documents.filter(
    (d) =>
      (d.category || '').toUpperCase() === 'CONTRACT' ||
      (d.category || '').toUpperCase() === 'INVOICE'
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Management Library"
        subtitle="Centralized repository for deliverables, contracts, specifications, and invoices."
        action={
          <Button
            variant="primary"
            icon={Upload}
            className="!bg-[#121358] hover:!bg-[#2F578A]"
            onClick={() => setUploadModalOpen(true)}
          >
            Upload Document
          </Button>
        }
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Documents"
          value={documents.length}
          icon={FileText}
          color="#121358"
          loading={loading}
          change="Document Library Repository"
        />
        <StatCard
          title="Shared with Clients"
          value={sharedCount}
          icon={ShieldCheck}
          color="#36ADA3"
          loading={loading}
          change="Available in Client Portals"
        />
        <StatCard
          title="Deliverables & Specs"
          value={deliverableCount}
          icon={FileCheck}
          color="#2F578A"
          loading={loading}
          change="Technical Artifacts"
        />
        <StatCard
          title="Contracts & Billing"
          value={contractCount}
          icon={Building2}
          color="#f59e0b"
          loading={loading}
          change="Invoices & Agreements"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        {/* Category Tabs */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveCategory(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeCategory === tab
                  ? 'bg-[#121358] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'All' ? 'All Files' : tab}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents, clients, or projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Documents Table / Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <LoadingSpinner size="lg" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm">
          <FileText className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-base font-semibold text-slate-700">No Documents Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || activeCategory !== 'All'
              ? 'No documents match your filter criteria.'
              : 'Start by uploading your first contract, deliverable, or project spec (max 500 KB).'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={Upload}
            onClick={() => setUploadModalOpen(true)}
          >
            Upload First Document
          </Button>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-[11px] border-b border-slate-200/80">
                <tr>
                  <th className="py-3.5 px-4">Document Title & Version</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Portal Visibility (Click to Toggle)</th>
                  <th className="py-3.5 px-4">Date Uploaded</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => {
                  const rawUrl = doc.file_url || doc.file;
                  const downloadUrl = getFileUrl(rawUrl);

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{doc.title}</p>
                            {doc.version && (
                              <span className="font-mono text-[10px] text-slate-400">
                                v{doc.version}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full font-semibold text-[11px] bg-blue-50 text-blue-700">
                          {doc.category_display || doc.category || 'General'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {doc.client_name ? (
                          <span className="font-medium text-slate-700">
                            {doc.client_name}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Internal</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {doc.project_title ? (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <FolderOpen size={12} className="text-slate-400" />
                            {doc.project_title}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* 1-Click Toggle for Portal Sharing */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleShare(doc.id, doc.title, doc.is_shared_with_client)}
                          className={`inline-flex items-center gap-1.5 font-semibold text-[11px] px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-xs ${
                            doc.is_shared_with_client
                              ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                              : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                          }`}
                          title="Click to toggle client portal visibility"
                        >
                          {doc.is_shared_with_client ? (
                            <>
                              <ShieldCheck size={13} className="text-emerald-600" />
                              <span>Shared with Client</span>
                            </>
                          ) : (
                            <>
                              <Lock size={12} className="text-slate-400" />
                              <span>Internal Only</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Toggle Share Button */}
                          <button
                            onClick={() => handleToggleShare(doc.id, doc.title, doc.is_shared_with_client)}
                            className={`p-1.5 rounded-lg transition ${
                              doc.is_shared_with_client
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
                            }`}
                            title={
                              doc.is_shared_with_client
                                ? 'Currently visible to client (click to make internal)'
                                : 'Share with client in portal'
                            }
                          >
                            <Share2 size={15} />
                          </button>

                          {/* Download Button */}
                          {downloadUrl && (
                            <a
                              href={downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                              title="Download File"
                            >
                              <Download size={15} />
                            </a>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(doc.id, doc.title)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete Document"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Upload Document Modal */}
      <Modal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Document to Library"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Document Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Master Services Agreement 2026"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="DELIVERABLE">Deliverable</option>
                <option value="SPECIFICATION">Specification</option>
                <option value="CONTRACT">Contract</option>
                <option value="REPORT">Report</option>
                <option value="INVOICE">Invoice</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Version
              </label>
              <input
                type="text"
                placeholder="1.0"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Link Client (Optional)
              </label>
              <select
                value={formData.client}
                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">No Client (All Clients if Shared)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                Link Project (Optional)
              </label>
              <select
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Select Document File <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                <AlertCircle size={12} /> Max 500 KB limit
              </span>
            </div>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Supports lightweight documents (PDF, TXT, DOCX, PNG) up to <strong>500 KB</strong>.
            </p>
            {formData.file && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                <FileCheck size={13} />
                <span className="truncate max-w-[200px]">{formData.file.name}</span>
                <span className="text-[10px] text-blue-500 font-mono">
                  ({(formData.file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <input
              type="checkbox"
              id="sharedCheck"
              checked={formData.is_shared_with_client}
              onChange={(e) => setFormData({ ...formData, is_shared_with_client: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
            />
            <label htmlFor="sharedCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
              Share this file directly with client in their portal
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setUploadModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              className="!bg-[#121358]"
            >
              Upload Document
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
