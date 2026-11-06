// src/pages/employee/projects/MyProjects.jsx
// Component: MyProjects
// Purpose: Assigned Projects
// Clean, beginner-friendly modern component styled with Tailwind CSS.

import React from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import PageHeader from '../../../components/ui/PageHeader';

export default function MyProjects() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Assigned Projects"
        subtitle="Manage and monitor your employee in one place."
        action={
          <Button variant="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-slate-500 uppercase">Total Items</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">24</p>
          <span className="inline-block mt-2 text-xs text-emerald-600 font-semibold">Active</span>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-slate-500 uppercase">Pending Actions</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">5</p>
          <span className="inline-block mt-2 text-xs text-amber-600 font-semibold">Requires Review</span>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-slate-500 uppercase">Completed</h3>
          <p className="text-3xl font-bold text-slate-800 mt-2">19</p>
          <span className="inline-block mt-2 text-xs text-blue-600 font-semibold">This Month</span>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 border-b pb-4">
          <h2 className="text-lg font-semibold text-slate-800">Records & Activity</h2>
          <Badge status="ACTIVE">Operational</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b">
              <tr>
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Title / Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50 transition">
                <td className="py-3 px-4 font-mono text-xs text-slate-500">#101</td>
                <td className="py-3 px-4 font-medium text-slate-800">Sample Employee Record</td>
                <td className="py-3 px-4"><Badge status="IN_PROGRESS">In Progress</Badge></td>
                <td className="py-3 px-4 text-slate-500">Just now</td>
                <td className="py-3 px-4 text-right space-x-2">
                  <Button variant="secondary" size="sm">View</Button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50 transition">
                <td className="py-3 px-4 font-mono text-xs text-slate-500">#102</td>
                <td className="py-3 px-4 font-medium text-slate-800">Second Item - Milestone deliverable</td>
                <td className="py-3 px-4"><Badge status="APPROVED">Approved</Badge></td>
                <td className="py-3 px-4 text-slate-500">2 hours ago</td>
                <td className="py-3 px-4 text-right space-x-2">
                  <Button variant="secondary" size="sm">View</Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
