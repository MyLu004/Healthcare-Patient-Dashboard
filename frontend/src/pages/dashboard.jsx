import { useEffect, useState } from "react";
import SummaryCard from "../components/SummaryCard";
import EntryTable from "../components/EntryTable";
import VitalChart from "../components/VitalChart";
import NewEntryForm from "../components/NewEntryForm";

import { fetchSummary, fetchTrends, fetchRecent } from "../lib/api";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [recent, setRecent] = useState([]);



  const reloadData = async () => {
  const summaryData = await fetchSummary();
  const trendData = await fetchTrends();
  const recentData = await fetchRecent();
  setSummary(summaryData);
  setTrends(trendData.points || []);
  setRecent(recentData.items || recentData);
};

useEffect(() => {
  reloadData();
}, []);

  return (
    <div className="p-6 space-y-6">
      <NewEntryForm onSuccess={reloadData} />
      <SummaryCard data={summary} />
      <VitalChart data={trends} />
      <EntryTable data={recent} />
    </div>
  );
}
