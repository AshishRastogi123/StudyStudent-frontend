import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowLeft, ArrowRight, Bookmark, Flag, FileText, Search, ShieldCheck } from "lucide-react";
import NoteCard from "../components/NoteCard";
import { Button, Card, EmptyState, ErrorState, LoadingState, Modal, NoteGridSkeleton, PageHeading, StatusBadge } from "../components/ui";
import { academicApi, errorMessage, notesApi } from "../services/api";
import { formatBytes, formatDate } from "../utils/format";

const reportReasons = [
  ["copyright", "Copyright concern"],
  ["inappropriate", "Inappropriate material"],
  ["spam", "Spam"],
  ["duplicate", "Duplicate note"],
  ["incorrect", "Incorrect information"],
  ["other", "Other"],
];
const NotePreview = lazy(() => import("../components/NotePreview"));

export function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [queryInput, setQueryInput] = useState(searchParams.get("q") || "");
  const [courseId, setCourseId] = useState(searchParams.get("courseId") || "");
  const [subjectId, setSubjectId] = useState(searchParams.get("subjectId") || "");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    academicApi.courses().then(({ data }) => { if (active) setCourses(data.courses || []); }).catch((err) => { if (active) toast.error(errorMessage(err)); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!courseId) { setSubjects([]); return; }
    let active = true;
    academicApi.subjects({ courseId }).then(({ data }) => { if (active) setSubjects(data.subjects || []); }).catch((err) => { if (active) toast.error(errorMessage(err)); });
    return () => { active = false; };
  }, [courseId]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      const params = { q: queryInput.trim(), courseId, subjectId, page, limit: 12 };
      setSearchParams(Object.fromEntries(Object.entries(params).filter(([, value]) => value)));
      notesApi.publicNotes(params).then(({ data }) => {
        if (active) { setNotes(data.notes || []); setPagination(data.pagination || null); }
      }).catch((err) => { if (active) setError(errorMessage(err)); })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [queryInput, courseId, subjectId, page, reload, setSearchParams]);

  const filtersActive = Boolean(queryInput || courseId || subjectId);
  return (
    <main className="library-page">
      <section className="library-hero">
        <div className="library-hero-content"><p className="eyebrow">Study together</p><h1>Your next great<br /><span>study session starts here.</span></h1><p>Explore notes shared by students, organized around the courses and subjects you’re studying.</p>
          <label className="library-search"><Search size={19} /><input value={queryInput} onChange={(e) => { setQueryInput(e.target.value); setPage(1); }} placeholder="Search notes, topics, or filenames..." /><kbd>↵</kbd></label>
          <div className="library-hero-foot"><span><ShieldCheck size={15} /> Public notes are reviewed before sharing</span><span>{pagination?.total ?? "—"} notes in the library</span></div>
        </div>
        <div className="library-hero-art"><div className="library-art-sheet"><span className="art-check"><FileText size={17} /></span><b>Lecture notes</b><i /><i /><i /><em>Course material</em></div><div className="library-art-tag">Curated by students</div></div>
      </section>
      <section className="library-results">
        <div className="library-results-heading"><div><p className="eyebrow">The library</p><h2>Explore public notes</h2></div><span className="results-count">{pagination?.total ?? 0} results</span></div>
        <div className="library-toolbar">
          <label className="search-field"><Search size={16} /><input value={queryInput} onChange={(e) => { setQueryInput(e.target.value); setPage(1); }} placeholder="Search titles and descriptions" /></label>
          <select className="input filter-select" value={courseId} onChange={(e) => { setCourseId(e.target.value); setSubjectId(""); setPage(1); }}><option value="">All courses</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.name}</option>)}</select>
          <select className="input filter-select" value={subjectId} disabled={!courseId} onChange={(e) => { setSubjectId(e.target.value); setPage(1); }}><option value="">All subjects</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}</select>
          {filtersActive && <button className="text-link clear-filters" onClick={() => { setQueryInput(""); setCourseId(""); setSubjectId(""); setPage(1); }}>Clear filters</button>}
        </div>
        {loading ? <NoteGridSkeleton count={6} /> : error ? <ErrorState message={error} onRetry={() => setReload((value) => value + 1)} /> : notes.length ?
          <>
            <div className="note-grid">{notes.map((note) => <NoteCard key={note._id} note={note} />)}</div>
            {pagination?.pages > 1 && <div className="pagination"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}><ArrowLeft size={15} /> Previous</Button><span>Page <strong>{pagination.page}</strong> of {pagination.pages}</span><Button variant="secondary" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next <ArrowRight size={15} /></Button></div>}
          </> : <EmptyState title={filtersActive ? "No notes match your search" : "The library is ready for its first notes"} description={filtersActive ? "Try a different search or remove one of the filters." : "Public notes approved by moderators will appear here."} action={filtersActive && <Button variant="secondary" onClick={() => { setQueryInput(""); setCourseId(""); setSubjectId(""); }}>Clear filters</Button>} />}
      </section>
    </main>
  );
}

export function NoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("incorrect");
  const [reportDetails, setReportDetails] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    notesApi.detail(id).then(({ data }) => { if (active) setNote(data.note); }).catch((err) => { if (active) setError(errorMessage(err)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const download = async () => {
    if (!user) { navigate("/login"); return; }
    try {
      const { data } = await notesApi.download(id);
      if (!data.signedUrl) throw new Error("This file is stored locally and does not have a secure download URL.");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (err) { toast.error(errorMessage(err)); }
  };
  const bookmark = async () => {
    if (!user) { navigate("/login"); return; }
    try {
      const { data } = await notesApi.bookmark(id);
      toast.success(data.bookmarked ? "Note saved to bookmarks." : "Note removed from bookmarks.");
    } catch (err) { toast.error(errorMessage(err)); }
  };
  const report = async (event) => {
    event.preventDefault();
    if (!user) { navigate("/login"); return; }
    setBusy(true);
    try {
      await notesApi.report(id, { reason: reportReason, details: reportDetails });
      toast.success("Thank you. Your report has been sent to the moderation team.");
      setReportOpen(false); setReportDetails("");
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };
  const openPreview = () => {
    if (!user) { navigate("/login"); return; }
    setPreviewOpen(true);
  };
  if (loading) return <main className="detail-page"><LoadingState label="Loading note details..." /></main>;
  if (error || !note) return <main className="detail-page"><ErrorState message={error || "Note not found."} onRetry={() => navigate("/library")} /></main>;

  return (
    <main className="detail-page">
      <Link to="/library" className="back-link"><ArrowLeft size={16} /> Back to library</Link>
      <div className="detail-layout">
        <div className="detail-main">
          <div className="detail-type"><span className="file-icon"><FileText size={20} /></span><StatusBadge status="approved" /><span>Shared {formatDate(note.approvedAt || note.createdAt)}</span></div>
          <h1>{note.title}</h1>
          <p className="detail-description">{note.description || "No description was provided for this note."}</p>
          <div className="detail-meta"><span>{note.courseId?.name || "Course"}</span><span>{note.subjectId?.name || "Subject"}</span><span>{note.fileName}</span></div>
          <Card className="detail-file-card"><span className="file-icon file-icon-large"><FileText size={23} /></span><div><strong>{note.fileName}</strong><p>{formatBytes(note.fileSize)} <span>·</span> {note.mimeType || "Document"}</p></div><Button variant="secondary" onClick={download}><ArrowDownToLine size={16} /> Download</Button></Card>
          <div className="detail-buttons"><Button onClick={openPreview}><FileText size={16} /> Preview note</Button><Button variant="secondary" onClick={bookmark}><Bookmark size={16} /> Save note</Button><Button variant="ghost" onClick={() => user ? setReportOpen(true) : navigate("/login")}><Flag size={16} /> Report</Button></div>
          <div className="detail-author"><span className="avatar">{(note.uploaderId?.name || "S").slice(0, 1)}</span><div><strong>Shared by {note.uploaderId?.name || "a student"}</strong><small>Available to the StudyStudent community</small></div></div>
        </div>
        <aside className="detail-sidebar"><Card><span className="feature-icon"><ShieldCheck size={19} /></span><h3>Reviewed for the library</h3><p>This note was approved by the StudyStudent moderation team before being made public.</p></Card><Card><h3>Study smarter</h3><p>Save this note to your bookmarks so you can find it quickly the next time you study.</p><Button variant="secondary" onClick={bookmark}>Add to bookmarks <Bookmark size={15} /></Button></Card></aside>
      </div>
      {previewOpen && <Suspense fallback={<LoadingState label="Loading preview..." />}><NotePreview note={note} open onOpenChange={setPreviewOpen} /></Suspense>}
      <Modal open={reportOpen} onOpenChange={setReportOpen} title="Report this note" description="Tell our moderation team what needs attention.">
        <form className="upload-form" onSubmit={report}>
          <label className="field"><span>Reason</span><select className="input" value={reportReason} onChange={(e) => setReportReason(e.target.value)}>{reportReasons.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="field"><span>Details <em>Optional</em></span><textarea className="input textarea" rows="4" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Share any context that may help the review." /></label>
          <div className="modal-actions"><Button type="submit" disabled={busy}>{busy ? "Sending..." : "Send report"} <ArrowRight size={16} /></Button></div>
        </form>
      </Modal>
    </main>
  );
}
