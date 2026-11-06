// src/pages/organization/clients/ClientAdd.jsx
// Form page for adding a brand new client to the system.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '../../../api/clients';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Card from '../../../components/ui/Card';
import toast from 'react-hot-toast';

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
  });

  // Update a single form field
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear any error for this field when user starts typing
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
      await createClient(form);
      toast.success('Client added successfully!');
      navigate('/organization/clients');
    } catch (err) {
      const serverErrors = err.response?.data || {};
      setErrors(serverErrors);
      toast.error('Failed to add client. Check the form for errors.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Add Client"
        subtitle="Fill in the details to register a new client."
      />

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1: Contact name + Company name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Name"
              name="contact_name"
              value={form.contact_name}
              onChange={handleChange}
              error={errors.contact_name}
              placeholder="John Smith"
              required
            />
            <Input
              label="Company Name"
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
              label="Email"
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
              type="tel"
              value={form.phone}
              onChange={handleChange}
              error={errors.phone}
              placeholder="+1 (555) 000-0000"
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
              label="Status"
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
              Save Client
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
    </div>
  );
}
