import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock3, FileStack, FileText, Flag, Search, ShieldCheck, UserRound, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, EmptyState, ErrorState, LoadingState, Modal, PageHeading, StatusBadge } from "../components/ui";
import { academicApi, authApi, dashboardApi, errorMessage, notesApi } from "../services/api";
import useApiResource from "../hooks/useApiResource";
import { formatBytes, formatDate } from "../utils/format";

const NotePreview = lazy(() => import("../components/NotePreview"));

function AdminMetric({ label, value, icon: Icon, tone }) {
  return <Card className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={19} /></span><span className="stat-label">{label}</span><strong className="stat-number">{value ?? "—"}</strong><span className="stat-caption">Platform-wide</span></Card>;
}

export function AdminOverviewPage() {
  const resource = useApiResource(async () => (await dashboardApi.overview()).data);
  if (resource.loading) return <LoadingState label="Loading platform overview..." />;
  if (resource.error) return <ErrorState message={resource.error} onRetry={resource.refresh} />;
  const overview = resource.data;
  const chartData = Object.entries(overview.notesByStatus || {}).map(([name, value]) => ({ name, value }));
  const statusColors = { approved: "#48a77a", pending: "#e5aa3b", rejected: "#da6e75", removed: "#98a2b3" };
  return (
    <div>
      <PageHeading eyebrow="Platform health" title="Admin overview" description="A high-level view of StudyStudent activity and moderation." />
      <div className="stats-grid admin-stats">
        <AdminMetric label="Active users" value={overview.summary?.totalUsers} icon={Users} tone="blue" />
        <AdminMetric label="Total notes" value={overview.summary?.totalNotes} icon={FileText} tone="violet" />
        <AdminMetric label="Open reports" value={overview.summary?.openReports} icon={Flag} tone="rose" />
        <AdminMetric label="Bookmarks" value={overview.summary?.totalBookmarks} icon={BookOpen} tone="green" />
      </div>
      <div className="admin-dashboard-grid">
        <Card className="admin-chart-card"><div className="panel-heading"><div><h2>Notes by review status</h2><p>Current distribution across the platform.</p></div></div>
          {chartData.length ? <div className="chart-container"><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={chartData} dataKey="value" nameKey="name" innerRadius={66} outerRadius={94} paddingAngle={4}>{chartData.map((entry) => <Cell key={entry.name} fill={statusColors[entry.name] || "#7890aa"} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="chart-legend">{chartData.map((item) => <span key={item.name}><i style={{ backgroundColor: statusColors[item.name] || "#7890aa" }} />{item.name}<strong>{item.value}</strong></span>)}</div></div> : <EmptyState title="No note activity yet" description="Chart data appears as notes are submitted." />}
        </Card>
        <div className="admin-side-stack"><Card className="admin-shortcut"><span className="feature-icon feature-icon-2"><Clock3 size={19} /></span><div><h3>Review queue</h3><p>Keep new student submissions moving.</p></div><Link to="/admin/review" className="text-link">Open queue <ArrowRight size={15} /></Link></Card><Card className="admin-shortcut"><span className="feature-icon feature-icon-3"><Flag size={19} /></span><div><h3>Reports</h3><p>See open content reports from students.</p></div><Link to="/admin/reports" className="text-link">View reports <ArrowRight size={15} /></Link></Card></div>
      </div>
      <Card className="dashboard-panel admin-recent"><div className="panel-heading"><div><h2>Recently approved</h2><p>Latest notes published to the public library.</p></div><Link to="/admin/review" className="subtle-link">Review queue <ArrowRight size={15} /></Link></div>
        {overview.recentNotes?.length ? <div className="recent-list">{overview.recentNotes.map((note) => <div key={note._id} className="recent-row"><span className="recent-file"><FileText size={17} /></span><span className="recent-title"><strong>{note.title}</strong><small>{note.courseId?.name || "Course"} · {note.subjectId?.name || "Subject"}</small></span><StatusBadge status="approved" /></div>)}</div> : <EmptyState title="No approved notes yet" description="Approved notes will appear here." />}
      </Card>
      <p className="backend-note">Use the admin navigation to manage accounts, review all submissions, and build the academic catalog.</p>
    </div>
  );
}

const rejectReasons = ["Incorrect subject", "Poor PDF quality", "Duplicate notes", "Copyright concern", "Irrelevant content", "Inappropriate material", "Other"];
export function ReviewQueuePage() {
  const resource = useApiResource(async () => (await notesApi.queue()).data.notes || []);
  const [preview, setPreview] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState(rejectReasons[0]);
  const [busy, setBusy] = useState(false);
  const review = async (note, action, rejectionReason = "") => {
    setBusy(true);
    try {
      await notesApi.review(note._id, { action, ...(action === "rejected" ? { reason: rejectionReason } : {}) });
      toast.success(`Note ${action}.`);
      setRejecting(null); resource.refresh();
    } catch (error) { toast.error(errorMessage(error)); }
    finally { setBusy(false); }
  };
  const decideReject = async (event) => {
    event.preventDefault();
    if (rejecting) await review(rejecting, "rejected", reason);
  };
  return (
    <div>
      <PageHeading eyebrow="Content moderation" title="Review queue" description="Every submission stays private until it has been reviewed." />
      {resource.loading ? <LoadingState label="Loading pending submissions..." /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refresh} /> : resource.data?.length ?
        <div className="review-list">{resource.data.map((note) => <Card key={note._id} className="review-card"><div className="review-file"><span className="file-icon"><FileText size={20} /></span><div><h3>{note.title}</h3><p>{note.fileName} · Submitted {formatDate(note.createdAt)}</p><small>By {(note.userId || note.uploaderId)?.name || "Unknown user"} · {(note.userId || note.uploaderId)?.email || "No email"}</small><small>{note.description || "No description provided."}</small></div></div><div className="review-meta"><span><strong>Course</strong>{typeof note.courseId === "object" ? note.courseId?.name : "Assigned course"}</span><span><strong>Subject</strong>{typeof note.subjectId === "object" ? note.subjectId?.name : "Assigned subject"}</span><span><strong>Review due</strong>{formatDate(note.reviewDueAt)}</span></div><div className="review-actions"><Button variant="secondary" onClick={() => setPreview(note)}><FileText size={15} /> Preview</Button><Button variant="secondary" onClick={() => setRejecting(note)} disabled={busy}><X size={15} /> Reject</Button><Button onClick={() => review(note, "approved")} disabled={busy}><Check size={15} /> Approve</Button></div></Card>)}</div> :
        <EmptyState title="The queue is clear" description="New student submissions will show up here." />}
      {preview && <Suspense fallback={<LoadingState label="Loading preview..." />}><NotePreview note={preview} open onOpenChange={(open) => { if (!open) setPreview(null); }} /></Suspense>}
      <Modal open={Boolean(rejecting)} onOpenChange={(open) => { if (!open && !busy) setRejecting(null); }} title="Reject this note" description="Choose a reason. The student will see this feedback with their submission.">
        <form className="upload-form" onSubmit={decideReject}><label className="field"><span>Rejection reason</span><select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>{rejectReasons.map((value) => <option key={value}>{value}</option>)}</select></label><div className="modal-actions"><Button type="submit" disabled={busy}>{busy ? "Submitting..." : "Confirm rejection"}</Button></div></form>
      </Modal>
    </div>
  );
}

export function UserManagementPage() {
  const currentUser = useSelector((state) => state.auth.user);
  const firstFilterEffect = useRef(true);
  const [filters, setFilters] = useState({ q: "", role: "", status: "all", page: 1 });
  const [search, setSearch] = useState("");
  const [busyUser, setBusyUser] = useState("");
  const resource = useApiResource(async () => (await authApi.users({
    q: filters.q || undefined,
    role: filters.role || undefined,
    status: filters.status,
    page: filters.page,
    limit: 20,
  })).data);

  useEffect(() => {
    if (firstFilterEffect.current) {
      firstFilterEffect.current = false;
      return;
    }
    resource.refresh();
  }, [filters, resource.refresh]);

  const submitSearch = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: search.trim(), page: 1 }));
  };

  const updateRole = async (user, role) => {
    if (user.role === role) return;
    setBusyUser(user.id);
    try {
      await authApi.updateUserRole(user.id, role);
      toast.success(`${user.name} is now ${role.toLowerCase()}.`);
      resource.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyUser("");
    }
  };

  const updateStatus = async (user) => {
    const isActive = !user.isActive;
    const action = isActive ? "activate" : "deactivate";
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} ${user.name}'s account?`)) return;
    setBusyUser(user.id);
    try {
      await authApi.updateUserStatus(user.id, isActive);
      toast.success(`Account ${isActive ? "activated" : "deactivated"}.`);
      resource.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyUser("");
    }
  };

  const users = resource.data?.users || [];
  const pagination = resource.data?.pagination;

  return (
    <div>
      <PageHeading eyebrow="Platform access" title="Manage users" description="Review member accounts, update roles, and manage access to the workspace." />
      <form className="filter-toolbar admin-user-filters" onSubmit={submitSearch}>
        <label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email..." /></label>
        <select className="input filter-select" value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value, page: 1 }))}>
          <option value="">All roles</option><option value="STUDENT">Student</option><option value="MODERATOR">Moderator</option><option value="ADMIN">Admin</option>
        </select>
        <select className="input filter-select" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}>
          <option value="active">Active accounts</option><option value="inactive">Deactivated accounts</option><option value="all">All accounts</option>
        </select>
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {resource.loading ? <LoadingState label="Loading user accounts..." /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refresh} /> : users.length ? <>
        <Card className="admin-table-card">
          <div className="admin-table-wrap"><table className="admin-table">
            <thead><tr><th>User</th><th>Role</th><th>Account</th><th>Email</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>{users.map((user) => <tr key={user.id}>
              <td><span className="admin-user-name"><span className="avatar"><UserRound size={15} /></span><span><strong>{user.name}</strong><small>{user.email}</small></span></span></td>
              <td><select className="input role-select" aria-label={`Role for ${user.name}`} value={user.role} disabled={busyUser === user.id || user.id === currentUser?.id} onChange={(event) => updateRole(user, event.target.value)}>
                <option value="STUDENT">Student</option><option value="MODERATOR">Moderator</option><option value="ADMIN">Admin</option>
              </select></td>
              <td><StatusBadge status={user.isActive ? "active" : "inactive"} /></td>
              <td><span className={`email-verification ${user.emailVerified ? "email-verified" : ""}`}><ShieldCheck size={14} />{user.emailVerified ? "Verified" : "Unverified"}</span></td>
              <td>{formatDate(user.createdAt)}</td>
              <td><div className="admin-user-actions">
                <Link className="button button-secondary" to={`/admin/notes?userId=${user.id}`}><FileStack size={14} /> Notes</Link>
                <Button variant={user.isActive ? "secondary" : "primary"} disabled={busyUser === user.id || user.id === currentUser?.id} onClick={() => updateStatus(user)}>{user.isActive ? "Deactivate" : "Activate"}</Button>
              </div></td>
            </tr>)}</tbody>
          </table></div>
        </Card>
        <div className="pagination admin-pagination"><span>{pagination.total} account{pagination.total === 1 ? "" : "s"} · Page {pagination.page} of {Math.max(1, pagination.pages)}</span><div>
          <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}><ArrowLeft size={14} /> Previous</Button>
          <Button variant="secondary" disabled={pagination.page >= pagination.pages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next <ArrowRight size={14} /></Button>
        </div></div>
      </> : <EmptyState title="No users found" description="Try another search or account filter." />}
    </div>
  );
}

export function AllNotesPage() {
  const [searchParams] = useSearchParams();
  const firstFilterEffect = useRef(true);
  const userId = searchParams.get("userId") || "";
  const [filters, setFilters] = useState({ q: "", status: "", page: 1 });
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState(rejectReasons[0]);
  const [busyNote, setBusyNote] = useState("");
  const resource = useApiResource(async () => (await notesApi.all({
    q: filters.q || undefined,
    status: filters.status || undefined,
    userId: userId || undefined,
    page: filters.page,
    limit: 20,
  })).data);

  useEffect(() => {
    if (firstFilterEffect.current) {
      firstFilterEffect.current = false;
      return;
    }
    resource.refresh();
  }, [filters, resource.refresh, userId]);

  const submitSearch = (event) => {
    event.preventDefault();
    setFilters((current) => ({ ...current, q: search.trim(), page: 1 }));
  };

  const review = async (note, action, rejectionReason = "") => {
    setBusyNote(note._id);
    try {
      await notesApi.review(note._id, { action, ...(action === "rejected" ? { reason: rejectionReason } : {}) });
      toast.success(`Note ${action}.`);
      setRejecting(null);
      resource.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyNote("");
    }
  };

  const submitRejection = (event) => {
    event.preventDefault();
    if (rejecting) review(rejecting, "rejected", reason);
  };

  const notes = resource.data?.notes || [];
  const pagination = resource.data?.pagination;
  const heading = userId ? "User notes" : "All notes";

  return (
    <div>
      <PageHeading eyebrow="Platform content" title={heading} description={userId ? "Review every submission from this account, including its moderation status." : "Search all submissions across users and review note statuses."} />
      {userId && <p className="admin-filter-context"><Link to="/admin/users" className="text-link"><ArrowLeft size={14} /> Back to users</Link></p>}
      <form className="filter-toolbar admin-note-filters" onSubmit={submitSearch}>
        <label className="search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, description, or filename..." /></label>
        <select className="input filter-select" value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))}>
          <option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="removed">Removed</option>
        </select>
        <Button type="submit" variant="secondary">Search</Button>
      </form>
      {resource.loading ? <LoadingState label="Loading all note submissions..." /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refresh} /> : notes.length ? <>
        <div className="review-list">{notes.map((note) => {
          const owner = note.userId || note.uploaderId;
          return <Card key={note._id} className="review-card admin-note-card">
            <div className="review-file"><span className="file-icon"><FileText size={20} /></span><div><div className="admin-note-title"><h3>{note.title}</h3><StatusBadge status={note.status} /></div><p>{note.fileName} · {formatBytes(note.fileSize)} · Submitted {formatDate(note.createdAt)}</p><small>By {owner?.name || "Unknown user"} ({owner?.email || "No email"})</small></div></div>
            <div className="review-meta"><span><strong>Course</strong>{note.courseId?.name || "Unassigned"}</span><span><strong>Subject</strong>{note.subjectId?.name || "Unassigned"}</span><span><strong>Review status</strong>{note.status}</span></div>
            {note.status === "rejected" && note.rejectionReason && <p className="admin-rejection-reason">Reason: {note.rejectionReason}</p>}
            <div className="review-actions"><Button variant="secondary" onClick={() => setPreview(note)}><FileText size={15} /> Preview</Button>
              {note.status === "pending" && <><Button variant="secondary" disabled={busyNote === note._id} onClick={() => setRejecting(note)}><X size={15} /> Reject</Button><Button disabled={busyNote === note._id} onClick={() => review(note, "approved")}><Check size={15} /> Approve</Button></>}
            </div>
          </Card>;
        })}</div>
        <div className="pagination admin-pagination"><span>{pagination.total} note{pagination.total === 1 ? "" : "s"} · Page {pagination.page} of {Math.max(1, pagination.pages)}</span><div>
          <Button variant="secondary" disabled={pagination.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}><ArrowLeft size={14} /> Previous</Button>
          <Button variant="secondary" disabled={pagination.page >= pagination.pages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next <ArrowRight size={14} /></Button>
        </div></div>
      </> : <EmptyState title="No notes found" description="Try another search or moderation status." />}
      {preview && <Suspense fallback={<LoadingState label="Loading preview..." />}><NotePreview note={preview} open onOpenChange={(open) => { if (!open) setPreview(null); }} /></Suspense>}
      <Modal open={Boolean(rejecting)} onOpenChange={(open) => { if (!open && !busyNote) setRejecting(null); }} title="Reject this note" description="The uploader will see this reason in their notes list.">
        <form className="upload-form" onSubmit={submitRejection}><label className="field"><span>Rejection reason</span><select className="input" value={reason} onChange={(event) => setReason(event.target.value)}>{rejectReasons.map((value) => <option key={value}>{value}</option>)}</select></label><div className="modal-actions"><Button type="submit" disabled={Boolean(busyNote)}>{busyNote ? "Submitting..." : "Confirm rejection"}</Button></div></form>
      </Modal>
    </div>
  );
}

export function ReportsPage() {
  const resource = useApiResource(async () => (await notesApi.reports()).data.reports || []);
  return (
    <div>
      <PageHeading eyebrow="Community safety" title="Note reports" description="Review content reports submitted by StudyStudent members." />
      {resource.loading ? <LoadingState label="Loading reports..." /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refresh} /> : resource.data?.length ?
        <div className="report-list">{resource.data.map((report) => <Card key={report._id} className="report-card"><span className="report-icon"><Flag size={18} /></span><div className="report-body"><div className="report-title"><h3>{report.noteId?.title || "Note unavailable"}</h3><StatusBadge status={report.status} /></div><p><strong>{report.reason}</strong>{report.details ? ` — ${report.details}` : ""}</p><small>Reported by {report.reporterId?.name || "a student"} · {formatDate(report.createdAt)}</small></div>{report.noteId?._id && <Link className="button button-secondary" to={`/notes/${report.noteId._id}`}>View note <ArrowRight size={15} /></Link>}</Card>)}</div> :
        <EmptyState title="No reports" description="Student-submitted reports will appear here." />}
      <p className="backend-note">The backend currently supports listing reports, but does not provide an endpoint to resolve, dismiss, or update their status.</p>
    </div>
  );
}

export function AcademicAdminPage() {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [topics, setTopics] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [unitName, setUnitName] = useState("");
  const [unitPosition, setUnitPosition] = useState("1");
  const [topicName, setTopicName] = useState("");
  const [topicPosition, setTopicPosition] = useState("1");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await academicApi.hierarchy();
      setCourses(data.courses || []);
      setSubjects(data.subjects || []);
      setUnits(data.units || []);
      setTopics(data.topics || []);
      const activeCourse = data.courses?.some((course) => course._id === selectedCourse) ? selectedCourse : data.courses?.[0]?._id || "";
      const activeSubject = data.subjects?.some((subject) => subject._id === selectedSubject && String(subject.courseId) === String(activeCourse))
        ? selectedSubject
        : data.subjects?.find((subject) => String(subject.courseId) === String(activeCourse))?._id || "";
      const activeUnit = data.units?.some((unit) => unit._id === selectedUnit && String(unit.subjectId) === String(activeSubject))
        ? selectedUnit
        : data.units?.find((unit) => String(unit.subjectId) === String(activeSubject))?._id || "";
      setSelectedCourse(activeCourse);
      setSelectedSubject(activeSubject);
      setSelectedUnit(activeUnit);
    } catch (err) { setError(errorMessage(err)); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addCourse = async (event) => {
    event.preventDefault();
    if (!courseName.trim()) return;
    setBusy(true);
    try {
      await academicApi.createCourse({ name: courseName.trim(), description: courseDescription.trim() });
      toast.success("Course added."); setCourseName(""); setCourseDescription(""); await refresh();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };
  const addSubject = async (event) => {
    event.preventDefault();
    if (!subjectName.trim() || !selectedCourse) return;
    setBusy(true);
    try {
      await academicApi.createSubject({ courseId: selectedCourse, name: subjectName.trim(), code: subjectCode.trim() });
      toast.success("Subject added."); setSubjectName(""); setSubjectCode(""); await refresh();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };
  const addUnit = async (event) => {
    event.preventDefault();
    if (!unitName.trim() || !selectedSubject) return;
    setBusy(true);
    try {
      await academicApi.createUnit({ subjectId: selectedSubject, name: unitName.trim(), position: Number(unitPosition) || 1 });
      toast.success("Unit added."); setUnitName(""); await refresh();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };
  const addTopic = async (event) => {
    event.preventDefault();
    if (!topicName.trim() || !selectedUnit) return;
    setBusy(true);
    try {
      await academicApi.createTopic({ unitId: selectedUnit, name: topicName.trim(), position: Number(topicPosition) || 1 });
      toast.success("Topic added."); setTopicName(""); await refresh();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };
  const selectedCourseInfo = courses.find((course) => course._id === selectedCourse);
  const courseSubjects = subjects.filter((subject) => String(subject.courseId) === String(selectedCourse));
  const subjectUnits = units.filter((unit) => String(unit.subjectId) === String(selectedSubject));
  const unitTopics = topics.filter((topic) => String(topic.unitId) === String(selectedUnit));
  return (
    <div>
      <PageHeading eyebrow="Platform setup" title="Academic catalog" description="Build the complete course → subject → unit → topic paths used throughout the learning library." />
      {loading ? <LoadingState label="Loading the academic catalog..." /> : error ? <ErrorState message={error} onRetry={refresh} /> : <div className="catalog-grid">
        <Card className="catalog-form-card"><span className="feature-icon"><BookOpen size={19} /></span><h2>Add a course</h2><p>New courses become available in note filters and upload forms.</p><form className="upload-form" onSubmit={addCourse}><label className="field"><span>Course name</span><input className="input" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="e.g. Computer Science" required /></label><label className="field"><span>Description <em>Optional</em></span><textarea className="input textarea" rows="2" value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)} /></label><Button type="submit" disabled={busy}>Add course</Button></form></Card>
        <Card className="catalog-form-card"><span className="feature-icon feature-icon-2"><FileText size={19} /></span><h2>Add a subject</h2><p>Add a subject to one of the active courses.</p><form className="upload-form" onSubmit={addSubject}><label className="field"><span>Course</span><select className="input" value={selectedCourse} onChange={(e) => { const courseId = e.target.value; setSelectedCourse(courseId); setSelectedSubject(subjects.find((subject) => String(subject.courseId) === String(courseId))?._id || ""); }}><option value="">Select a course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.name}</option>)}</select></label><label className="field"><span>Subject name</span><input className="input" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="e.g. Algorithms" required /></label><label className="field"><span>Subject code <em>Optional</em></span><input className="input" value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} placeholder="e.g. CS201" /></label><Button type="submit" disabled={busy || !selectedCourse}>Add subject</Button></form></Card>
        <Card className="catalog-form-card"><span className="feature-icon feature-icon-3"><FileStack size={19} /></span><h2>Add a unit</h2><p>Organize a subject into ordered units or chapters.</p><form className="upload-form" onSubmit={addUnit}><label className="field"><span>Subject</span><select className="input" value={selectedSubject} onChange={(e) => { const subjectId = e.target.value; setSelectedSubject(subjectId); setSelectedUnit(units.find((unit) => String(unit.subjectId) === String(subjectId))?._id || ""); }}><option value="">Select a subject</option>{courseSubjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}</select></label><label className="field"><span>Unit name</span><input className="input" value={unitName} onChange={(e) => setUnitName(e.target.value)} placeholder="e.g. Foundations" required /></label><label className="field"><span>Order</span><input className="input" type="number" min="1" value={unitPosition} onChange={(e) => setUnitPosition(e.target.value)} /></label><Button type="submit" disabled={busy || !selectedSubject}>Add unit</Button></form></Card>
        <Card className="catalog-form-card"><span className="feature-icon feature-icon-4"><FileText size={19} /></span><h2>Add a topic</h2><p>Add a topic under an existing unit.</p><form className="upload-form" onSubmit={addTopic}><label className="field"><span>Unit</span><select className="input" value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}><option value="">Select a unit</option>{subjectUnits.map((unit) => <option key={unit._id} value={unit._id}>{unit.name}</option>)}</select></label><label className="field"><span>Topic name</span><input className="input" value={topicName} onChange={(e) => setTopicName(e.target.value)} placeholder="e.g. Introduction" required /></label><label className="field"><span>Order</span><input className="input" type="number" min="1" value={topicPosition} onChange={(e) => setTopicPosition(e.target.value)} /></label><Button type="submit" disabled={busy || !selectedUnit}>Add topic</Button></form></Card>
        <Card className="catalog-list-card"><div className="panel-heading"><div><h2>{selectedCourseInfo?.name || "Course catalog"}</h2><p>{courseSubjects.length} subjects</p></div><select className="input filter-select" value={selectedCourse} onChange={(e) => { const courseId = e.target.value; setSelectedCourse(courseId); const subjectId = subjects.find((subject) => String(subject.courseId) === String(courseId))?._id || ""; setSelectedSubject(subjectId); setSelectedUnit(units.find((unit) => String(unit.subjectId) === String(subjectId))?._id || ""); }}><option value="">Select course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.name}</option>)}</select></div>
          {courseSubjects.length ? <div className="catalog-subject-list">{courseSubjects.map((subject) => {
            const subjectUnitsList = units.filter((unit) => String(unit.subjectId) === String(subject._id));
            return <div key={subject._id} className="catalog-subject"><span className="recent-file"><FileText size={16} /></span><span className="catalog-subject-main"><strong>{subject.name}</strong><small>{subject.code || "No subject code"} · Semester {subject.semester || 1}</small>{subjectUnitsList.map((unit) => <span className="catalog-unit-line" key={unit._id}><strong>{unit.name}</strong><small>{topics.filter((topic) => String(topic.unitId) === String(unit._id)).map((topic) => topic.name).join(" · ") || "No topics yet"}</small></span>)}</span></div>;
          })}</div> : <EmptyState title="No subjects yet" description="Add a subject to this course to make it available for notes." />}
        </Card>
        <p className="backend-note catalog-note">Courses, subjects, units, and topics are managed here. User access and submissions are available from the admin navigation.</p>
      </div>}
    </div>
  );
}
