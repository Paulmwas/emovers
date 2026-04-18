"use client";
import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { reviewsApi, jobsApi } from "@/lib/api";
import { Button, Table, Modal, EmptyState, RatingStars, Badge, Avatar } from "@/components/ui";
import { formatDate, getErrorMessage } from "@/lib/utils";
import { StaffReview, Job } from "@/types";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import { Star, Plus, Users } from "lucide-react";

const toArray = <T,>(data: any): T[] =>
  Array.isArray(data) ? data : data?.results ?? data?.data ?? data?.reviews ?? [];

const CATEGORIES = [
  { value: "overall", label: "Overall" },
  { value: "punctuality", label: "Punctuality" },
  { value: "teamwork", label: "Teamwork" },
  { value: "care_of_goods", label: "Care of Goods" },
  { value: "physical_fitness", label: "Physical Fitness" },
  { value: "communication", label: "Communication" },
];

export default function ReviewsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "mover-admin";
  const [reviews, setReviews] = useState<StaffReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [reviewItems, setReviewItems] = useState([{ reviewee_id: "", category: "overall", rating: 5, comment: "" }]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = isAdmin
        ? await reviewsApi.list()
        : await reviewsApi.myReviews();
      setReviews(toArray<StaffReview>(res.data));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const openBulkReview = async () => {
    try {
      const res = await jobsApi.list({ status: "completed" });
      setCompletedJobs(toArray<Job>(res.data));
      setBulkOpen(true);
    } catch { toast.error("Failed to load jobs"); }
  };

  const handleJobSelect = (jobId: string) => {
    const job = completedJobs.find(j => j.id === parseInt(jobId));
    setSelectedJob(job || null);
    if (job) {
      const movers = job.assignments?.filter(a => a.role === "mover") || [];
      setReviewItems(movers.map(m => ({
        reviewee_id: String(m.staff.id),
        category: "overall",
        rating: 5,
        comment: "",
      })));
    }
  };

  const handleBulkSubmit = async () => {
    if (!selectedJob) { toast.error("Select a job first"); return; }
    setSubmitting(true);
    try {
      const res = await reviewsApi.bulkCreate({
        job_id: selectedJob.id,
        reviews: reviewItems.map(r => ({
          ...r,
          reviewee_id: parseInt(r.reviewee_id),
          rating: parseInt(String(r.rating)),
        })),
      });
      const { summary } = res.data;
      toast.success(`${summary.created}/${summary.total_submitted} reviews submitted!`);
      setBulkOpen(false);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const headers = isAdmin
    ? ["Reviewer", "Reviewee", "Job", "Category", "Rating", "Comment", "Date"]
    : ["Reviewer", "Job", "Category", "Rating", "Comment", "Date"];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 font-display">
            {isAdmin ? "All Reviews" : "My Reviews"}
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">{reviews.length} reviews</p>
        </div>
        {isAdmin && (
          <Button onClick={openBulkReview} icon={<Plus size={16} />}>
            Bulk Review
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <Table headers={headers} loading={loading}>
          {reviews.length === 0 ? (
            <tr><td colSpan={isAdmin ? 7 : 6}>
              <EmptyState icon={<Star size={24} />} title="No reviews yet"
                description={isAdmin ? "Submit reviews after completed jobs." : "No reviews received yet."} />
            </td></tr>
          ) : (
            reviews.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Avatar name={`${r.reviewer?.first_name} ${r.reviewer?.last_name}`} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {r.reviewer?.first_name} {r.reviewer?.last_name}
                      </p>
                      <p className="text-xs text-gray-400">Reviewer</p>
                    </div>
                  </div>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={`${r.reviewee?.first_name} ${r.reviewee?.last_name}`} size="sm" />
                      <p className="text-sm font-medium text-gray-900">
                        {r.reviewee?.first_name} {r.reviewee?.last_name}
                      </p>
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600">Job #{r.job}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-1 rounded-full capitalize">
                    {CATEGORIES.find(c => c.value === r.category)?.label || r.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <RatingStars rating={r.rating} />
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-600 max-w-[180px] truncate">{r.comment || "—"}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-400">{formatDate(r.created_at)}</p>
                </td>
              </tr>
            ))
          )}
        </Table>
      </div>

      {/* Bulk Review Modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Submit Reviews" size="xl"
        footer={<>
          <Button variant="secondary" onClick={() => setBulkOpen(false)}>Cancel</Button>
          <Button onClick={handleBulkSubmit} loading={submitting} icon={<Star size={14} />}>
            Submit Reviews
          </Button>
        </>}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Select Completed Job <span className="text-red-500">*</span>
            </label>
            <select onChange={(e) => handleJobSelect(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
              <option value="">Select a completed job...</option>
              {completedJobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} — {j.customer?.first_name} {j.customer?.last_name}
                </option>
              ))}
            </select>
          </div>

          {selectedJob && reviewItems.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <Users size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No movers assigned to this job</p>
            </div>
          )}

          {reviewItems.map((item, idx) => {
            const mover = selectedJob?.assignments?.find(a => a.staff.id === parseInt(item.reviewee_id));
            return (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                  {mover && (
                    <>
                      <Avatar name={`${mover.staff.first_name} ${mover.staff.last_name}`} size="sm" />
                      <p className="text-sm font-semibold text-gray-900">
                        {mover.staff.first_name} {mover.staff.last_name}
                      </p>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                    <select value={item.category}
                      onChange={(e) => setReviewItems(prev => prev.map((r, i) => i === idx ? { ...r, category: e.target.value } : r))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-brand-500">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Rating (1-5)</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} type="button"
                          onClick={() => setReviewItems(prev => prev.map((r, i) => i === idx ? { ...r, rating: s } : r))}
                          className={`flex-1 py-1.5 text-sm font-bold rounded-lg border-2 transition-all ${
                            item.rating >= s ? "border-amber-400 bg-amber-50 text-amber-700" : "border-gray-200 text-gray-400"
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Comment (optional)</label>
                  <input type="text" value={item.comment}
                    onChange={(e) => setReviewItems(prev => prev.map((r, i) => i === idx ? { ...r, comment: e.target.value } : r))}
                    placeholder="Write a comment..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500" />
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
    </DashboardLayout>
  );
}