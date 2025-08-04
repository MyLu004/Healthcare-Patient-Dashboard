import { useEffect, useState } from "react";
import SummaryCard from "../components/SummaryCard";
import EntryTable from "../components/EntryTable";
import VitalChart from "../components/VitalChart";
import NewEntryForm from "../components/NewEntryForm"; // if you added it
import EditVitalModal from "../components/EditVitalModal";

import { Link } from "react-router-dom";
import {
  fetchSummary,
  fetchTrends,
  fetchRecent,
  updateVital,
  deleteVital,
} from "../lib/api";


// Dashboard page: Main health dashboard for the authenticated user
export default function Dashboard() {
  // Store summary stats, trends, and recent entries for display
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recent, setRecent] = useState([]);

  // State for edit modal (open/closed) and currently editing entry
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Reload all dashboard data (summary, trends, recent) from backend
  const reloadData = async () => {
    const summaryData = await fetchSummary();
    const trendData = await fetchTrends();
    const recentData = await fetchRecent();

    setSummary(summaryData);
    setTrends(trendData.points || []);

    // Normalize recent entries for EntryTable compatibility
    const formattedRecent = recentData.items || recentData;

    setRecent(Array.isArray(formattedRecent) ? formattedRecent : []);
};

  // Load dashboard data on component mount
  useEffect(() => {
    reloadData();
  }, []);

  // Handle edit button in EntryTable: open modal and pre-fill fields
  const handleEdit = (row) => {
    setEditing({
      id: row.id,
      recorded_at: row.date ?? row.recorded_at,
      systolic_bp: row.systolic ?? null,
      diastolic_bp: row.diastolic ?? null,
      heart_rate: row.heart_rate ?? null,
      temperature: row.temperature ?? null,
      glucose: row.glucose ?? null,
      notes: row.notes ?? "",
    });
    setEditOpen(true);
  };

  // Save changes to an edited entry (calls backend, closes modal, reloads data)
  const handleSaveEdit = async (payload) => {
    try {
      await updateVital(editing.id, payload);
      setEditOpen(false);
      setEditing(null);
      await reloadData();
    } catch (e) {
      console.error(e);
      alert("Failed to update entry");
    }
  };

  // Delete a recent entry (asks for confirmation, then reloads data)
  const handleDelete = async (id) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteVital(id);
      await reloadData();
    } catch (e) {
      console.error(e);
      alert("Failed to delete entry");
    }
  };

  // Main dashboard layout
  return (
    <div >
      <div className="p-6 space-y-6">
        {/* Form for adding new vitals */}
        <NewEntryForm onSuccess={reloadData} />

        {/* Dashboard summary cards */}
        <SummaryCard data={summary} />

        {/* Chart of vitals over time */}
        <VitalChart data={trends} />

        {/* Recent entries table with edit/delete actions */}
        <EntryTable data={recent} onEdit={handleEdit} onDelete={handleDelete} />

        {/* Edit modal for modifying an existing entry */}
        <EditVitalModal
          open={editOpen}
          initial={editing}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveEdit}
        />
      </div>
      
      
    </div>
  );
}
