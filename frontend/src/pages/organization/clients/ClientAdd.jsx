// src/pages/organization/clients/ClientAdd.jsx
// Form page for adding a brand new client to the system.
// Automatically provisions client portal login credentials with a 1-click copy card for WhatsApp/email.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../../../api/clients';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Card from '../../../components/ui/Card';
import Modal from '../../../components/ui/Modal';
import { copyToClipboard } from '../../../utils/clipboard';
import toast from 'react-hot-toast';
import { Copy, Check, KeyRound } from 'lucide-react';

const INDUSTRIES = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Retail', label: 'Retail' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Education', label: 'Education' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

export default function ClientAdd() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Credentials success modal state
  const [credModal, setCredModal] = useState({
    open: false,
    clientName: '',
    companyName: '',
    email: '',
    password: '',
    copied: false,
  });

  // Form state — all fields for a new client
  const [form, setForm] = useState({
    contact_name: '',
    company_name: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    website: '',
    status: 'ACTIVE',
    notes: '',
    portal_password: '',
  });

  // Update a single form field
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Validate required fields before submitting
  const validate = () => {
    const newErrors = {};
    if (!form.contact_name) newErrors.contact_name = 'Contact name is required.';
    if (!form.company_name) newErrors.company_name = 'Company name is required.';
    if (!form.email) newErrors.email = 'Email is required.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      let website = form.website?.trim() || '';
      if (website && !/^https?:\/\//i.test(website)) {
        website = `https://${website}`;
      }

      const payload = {
        ...form,
        website,
        name: form.contact_name?.trim(),
        contact_name: form.contact_name?.trim(),
      };

      const res = await createClient(payload);
      toast.success('Client added successfully!');

      // If temporary portal login credentials were generated, show the copy modal
      if (res.data?.temp_password) {
        setCredModal({
          open: true,
          clientName: res.data.name || form.contact_name,
          companyName: res.data.company_name || form.company_name,
          email: res.data.email || form.email,
          password: res.data.temp_password,
          copied: false,
        });
      } else {
        navigate('/organization/clients');
      }
    } catch (err) {
      const serverErrors = err.response?.data || {};
      if (serverErrors.name && !serverErrors.contact_name) {
        serverErrors.contact_name = Array.isArray(serverErrors.name)
          ? serverErrors.name[0]
          : serverErrors.name;
      }
      setErrors(serverErrors);

      const firstKey = Object.keys(serverErrors)[0];
      const detailMsg =
        serverErrors.detail ||
        (firstKey && Array.isArray(serverErrors[firstKey])
          ? `${firstKey}: ${serverErrors[firstKey][0]}`
          : serverErrors[firstKey]) ||
        'Failed to add client. Check the form for errors.';

      toast.error(detailMsg);
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = async () => {
    const textToCopy = `🔑 PortalHQ Client Portal Access:\n• Portal URL: ${window.location.origin}/\n• Company: ${credModal.companyName}\n• Email: ${credModal.email}\n• Temporary Password: ${credModal.password}`;
    const success = await copyToClipboard(textToCopy);
    if (success) {
      setCredModal((prev) => ({ ...prev, copied: true }));
      toast.success('Client login credentials copied to clipboard!');
      setTimeout(() => {
        setCredModal((prev) => ({ ...prev, copied: false }));
      }, 3000);
    } else {
      toast.error('Could not copy automatically. Please copy the text manually.');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Add Client"
        subtitle="Fill in the details to register a new client company and provision their portal login."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Contact name + Company name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Name *"
              name="contact_name"
              value={form.contact_name}
              onChange={handleChange}
              error={errors.contact_name}
              placeholder="John Smith"
              required
            />
            <Input
              label="Company Name *"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              error={errors.company_name}
              placeholder="Acme Corp"
              required
            />
          </div>

          {/* Row 2: Email + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address *"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="john@acme.com"
              required
            />
            <Input
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="+1 555-0100"
            />
          </div>

          {/* Row 3: Industry + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Industry"
              name="industry"
              value={form.industry}
              onChange={handleChange}
              options={INDUSTRIES}
              placeholder="Select industry"
            />
            <Select
              label="Status *"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={STATUS_OPTIONS}
              required
            />
          </div>

          {/* Website */}
          <Input
            label="Website"
            name="website"
            type="url"
            value={form.website}
            onChange={handleChange}
            placeholder="https://acme.com"
          />

          {/* Address */}
          <Input
            label="Address"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="123 Main St, City, State, ZIP"
          />

          {/* Portal Password */}
          <Input
            label="Initial Portal Password (Optional — auto-generated if left empty)"
            name="portal_password"
            type="password"
            value={form.portal_password}
            onChange={handleChange}
            placeholder="Leave empty for auto-generated temporary password"
          />

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes about this client..."
              className="w-full px-3.5 py-2.5 text-sm text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              Save Client & Generate Portal Access
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/organization/clients')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {/* ── MODAL: 1-CLICK CLIENT CREDENTIAL CARD ──────────────────────────── */}
      <Modal
        open={credModal.open}
        onClose={() => navigate('/organization/clients')}
        title="Client Portal Access Ready!"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            The client company has been created and their portal login account is ready. Copy and share these credentials with <strong>{credModal.clientName}</strong>:
          </p>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs space-y-2 text-slate-800">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-400 font-sans">Login Portal:</span>
              <span className="font-semibold text-teal-700">{window.location.origin}/</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-400 font-sans">Company:</span>
              <span className="font-semibold">{credModal.companyName}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-400 font-sans">Client Email:</span>
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
              onClick={copyCredentials}
            >
              {credModal.copied ? 'Copied to Clipboard!' : 'Copy Login Credentials'}
            </Button>
            <Button onClick={() => navigate('/organization/clients')}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
