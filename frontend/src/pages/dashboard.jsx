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

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recent, setRecent] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

 

  const reloadData = async () => {
    const summaryData = await fetchSummary();
    const trendData = await fetchTrends();
    const recentData = await fetchRecent();

    setSummary(summaryData);
    setTrends(trendData.points || []);

    // Normalize entry format for EntryTable
    const formattedRecent = recentData.items || recentData;

  setRecent(formattedRecent);
};
  useEffect(() => {
    reloadData();
  }, []);

  const handleEdit = (row) => {
    // shape frontend row -> modal expects VitalsUpdate-like fields
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

  const handleSaveEdit = async (payload) => {
    try {
      await updateVital(editing.id, payload, 1);
      setEditOpen(false);
      setEditing(null);
      await reloadData();
    } catch (e) {
      console.error(e);
      alert("Failed to update entry");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteVital(id, 1);
      await reloadData();
    } catch (e) {
      console.error(e);
      alert("Failed to delete entry");
    }
  };

  return (
    <div >
      

      <div className="p-6 space-y-6">
        

        <NewEntryForm onSuccess={reloadData} />

        <SummaryCard data={summary} />
        <VitalChart data={trends} />
        <EntryTable data={recent} onEdit={handleEdit} onDelete={handleDelete} />

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
