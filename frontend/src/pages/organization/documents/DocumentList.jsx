// src/pages/organization/documents/DocumentList.jsx
// Organization Admin - Document Management Library
// Full document repository: upload, categorize, track versions, and share files with clients.

import { useState, useEffect, useCallback } from 'react';
import { getDocuments, uploadDocument, deleteDocument } from '../../../api/documents';
import { getClients } from '../../../api/clients';
import { getProjects } from '../../../api/projects';

import PageHeader from '../../../components/ui/PageHeader';
import Card from '../../../components/ui/Card';
import StatCard from '../../../components/ui/StatCard';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
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
  Layers,
} from 'lucide-react';

const CATEGORY_TABS = ['All', 'Deliverable', 'Specification', 'Contract', 'Invoice', 'Other'];

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
    category: 'Deliverable',
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

  // Handle document upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Document title is required.');
      return;
    }
    if (!formData.file) {
      toast.error('Please choose a file to upload.');
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
        category: 'Deliverable',
        client: '',
        project: '',
        version: '1.0',
        is_shared_with_client: true,
        file: null,
      });
      fetchData();
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload document.');
    } finally {
      setSubmitting(false);
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
    const matchesCategory =
      activeCategory === 'All' || doc.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.client_name && doc.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.project_title && doc.project_title.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const sharedCount = documents.filter((d) => d.is_shared_with_client).length;
  const deliverableCount = documents.filter(
    (d) => d.category === 'Deliverable' || d.category === 'Specification'
  ).length;
  const contractCount = documents.filter(
    (d) => d.category === 'Contract' || d.category === 'Invoice'
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
              : 'Start by uploading your first contract, deliverable, or project spec.'}
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
                  <th className="py-3.5 px-4">Portal Visibility</th>
                  <th className="py-3.5 px-4">Date Uploaded</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => {
                  const downloadUrl = doc.file_url || doc.file;

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
                          {doc.category || 'General'}
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

                      <td className="py-3.5 px-4">
                        {doc.is_shared_with_client ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                            <ShieldCheck size={12} /> Shared
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Internal Only</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
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
                <option value="Deliverable">Deliverable</option>
                <option value="Specification">Specification</option>
                <option value="Contract">Contract</option>
                <option value="Invoice">Invoice</option>
                <option value="Other">Other</option>
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
                <option value="">No Client (Internal)</option>
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
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
              Select Document File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="sharedCheck"
              checked={formData.is_shared_with_client}
              onChange={(e) => setFormData({ ...formData, is_shared_with_client: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
            />
            <label htmlFor="sharedCheck" className="text-xs text-slate-700 font-medium">
              Share this file directly with the client in their portal
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
