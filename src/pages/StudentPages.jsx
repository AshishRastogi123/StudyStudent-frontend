import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useDropzone } from "react-dropzone";
import { z } from "zod";
import { motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import {
  ArrowDownToLine, ArrowRight, Bell, BookMarked, BookOpen, Check, Clock3, FileText,
  LockKeyhole, Plus, Search, ShieldCheck, Trash2, UploadCloud, UserRound, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import NoteCard from "../components/NoteCard";
import { Button, Card, EmptyState, ErrorState, LoadingState, Modal, PageHeading, StatusBadge } from "../components/ui";
import { academicApi, authApi, errorMessage, notesApi, notificationsApi } from "../services/api";
import { setUser } from "../features/auth/authSlice";
import useApiResource from "../hooks/useApiResource";
import { formatBytes, formatDate } from "../utils/format";

const allowedExtensions = /\.(pdf|doc|docx|ppt|pptx|txt|png|jpe?g)$/i;
const NotePreview = lazy(() => import("../components/NotePreview"));
const allowedMime = [
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain", "image/png", "image/jpeg",
];
const uploadSchema = z.object({
  title: z.string().trim().min(2, "Add a note title."),
  courseId: z.string().min(1, "Choose a course."),
  subjectId: z.string().min(1, "Choose a subject."),
});

function CountCard({ label, value, icon: Icon, tone }) {
  const reduced = useReducedMotion();
  const count = useSpring(0, { stiffness: 90, damping: 22 });
  const display = useTransform(count, (latest) => Math.round(latest));
  useEffect(() => { reduced ? count.jump(value) : count.set(value); }, [count, reduced, value]);
  return (
    <motion.div initial={reduced ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.3 }}>
      <Card className="stat-card"><span className={`stat-icon ${tone}`}><Icon size={19} /></span><span className="stat-label">{label}</span><strong className="stat-number"><motion.span>{display}</motion.span></strong><span className="stat-caption">Your account</span></Card>
    </motion.div>
  );
}

export function DashboardPage() {
  const notesResource = useApiResource(async () => (await notesApi.mine()).data.notes || []);
  const bookmarksResource = useApiResource(async () => (await notesApi.bookmarks()).data.bookmarks || []);
  const noticesResource = useApiResource(async () => (await notificationsApi.list()).data.notifications || []);
  if (notesResource.loading || bookmarksResource.loading || noticesResource.loading) return <LoadingState label="Loading your dashboard..." />;
  const notes = notesResource.data || [];
  const failed = [notesResource.error, bookmarksResource.error, noticesResource.error].filter(Boolean).join(" ");
  const count = (status) => notes.filter((note) => note.status === status).length;
  const recent = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);
  const activity = [...(noticesResource.data || [])].slice(0, 4);
  return (
    <div>
      <PageHeading eyebrow="Your learning space" title="Good to see you." description="A quick look at the notes you’ve shared and saved." action={<Link to="/app/notes" className="button button-primary"><Plus size={16} /> Add a note</Link>} />
      {failed && <div className="mb-5"><ErrorState message={failed} /></div>}
      <div className="stats-grid">
        <CountCard label="Total notes" value={notes.length} icon={FileText} tone="blue" />
        <CountCard label="Pending review" value={count("pending")} icon={Clock3} tone="amber" />
        <CountCard label="Approved" value={count("approved")} icon={Check} tone="green" />
        <CountCard label="Rejected" value={count("rejected")} icon={XCircle} tone="rose" />
        <CountCard label="Bookmarks" value={bookmarksResource.data?.length || 0} icon={BookMarked} tone="violet" />
      </div>
      <div className="dashboard-columns">
        <Card className="dashboard-panel"><div className="panel-heading"><div><h2>Recently uploaded</h2><p>Your latest additions to the community.</p></div><Link to="/app/notes" className="subtle-link">View all <ArrowRight size={15} /></Link></div>
          {recent.length ? <div className="recent-list">{recent.map((note) => <Link key={note._id} to="/app/notes" className="recent-row"><span className="recent-file"><FileText size={17} /></span><span className="recent-title"><strong>{note.title}</strong><small>{note.fileName} · {formatDate(note.createdAt)}</small></span><StatusBadge status={note.status} /></Link>)}</div> : <EmptyState title="No notes uploaded" description="Your submitted notes will appear here." action={<Link to="/app/notes" className="text-link">Upload your first note <ArrowRight size={14} /></Link>} />}
        </Card>
        <Card className="dashboard-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Updates about your notes and account.</p></div><Link to="/app/notifications" className="subtle-link">See all <ArrowRight size={15} /></Link></div>
          {activity.length ? <div className="activity-list">{activity.map((item) => <div key={item._id} className="activity-row"><span className={`activity-dot ${item.isRead ? "" : "activity-dot-new"}`}><Bell size={14} /></span><div><strong>{item.title}</strong><p>{item.message}</p><small>{formatDate(item.createdAt)}</small></div></div>)}</div> : <EmptyState title="You're all caught up" description="New updates will show here." />}
        </Card>
      </div>
    </div>
  );
}

function FileDropzone({ file, setFile, error }) {
  const onDrop = useCallback((accepted, rejections) => {
    if (rejections.length) {
      toast.error(rejections[0].errors[0]?.message || "This file can’t be uploaded.");
      return;
    }
    setFile(accepted[0] || null);
  }, [setFile]);
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop, noClick: true, multiple: false, maxSize: 10 * 1024 * 1024,
    accept: { "application/pdf": [".pdf"], "application/msword": [".doc"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"], "application/vnd.ms-powerpoint": [".ppt"], "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"], "text/plain": [".txt"], "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"] },
  });
  return (
    <div {...getRootProps()} className={`dropzone ${isDragActive ? "dropzone-active" : ""} ${error ? "dropzone-error" : ""}`}>
      <input {...getInputProps()} />
      {file ? <><span className="drop-icon drop-icon-success"><Check size={20} /></span><strong>{file.name}</strong><small>{formatBytes(file.size)}</small><button type="button" className="quiet-link" onClick={(event) => { event.stopPropagation(); setFile(null); }}>Remove file</button></> :
        <><span className="drop-icon"><UploadCloud size={21} /></span><strong>{isDragActive ? "Drop your file to upload" : "Drag a file here, or browse"}</strong><small>PDF, Word, PowerPoint, TXT, PNG or JPG · max 10 MB</small><Button variant="secondary" onClick={open}>Choose a file</Button></>}
      {error && <small className="field-error">{error}</small>}
    </div>
  );
}

function UploadNoteModal({ open, onOpenChange, onUploaded }) {
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", courseId: "", subjectId: "" });
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    academicApi.courses().then(({ data }) => { if (active) setCourses(data.courses || []); }).catch((err) => { if (active) toast.error(errorMessage(err)); });
    return () => { active = false; };
  }, [open]);

  useEffect(() => {
    if (!form.courseId) { setSubjects([]); return; }
    let active = true;
    academicApi.subjects({ courseId: form.courseId }).then(({ data }) => { if (active) setSubjects(data.subjects || []); }).catch((err) => { if (active) toast.error(errorMessage(err)); });
    return () => { active = false; };
  }, [form.courseId]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value, ...(key === "courseId" ? { subjectId: "" } : {}) }));
  const submit = async (event) => {
    event.preventDefault();
    const result = uploadSchema.safeParse(form);
    const validation = result.success ? "" : (result.error.issues[0]?.message || "Check the required fields.");
    if (!file || !allowedExtensions.test(file.name) || !allowedMime.includes(file.type)) {
      setFormError("Choose a supported file before submitting.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) { setFormError("Files must be 10 MB or smaller."); return; }
    if (validation) { setFormError(validation); return; }
    setBusy(true); setFormError(""); setProgress(0);
    const body = new FormData();
    body.append("file", file);
    body.append("title", form.title.trim());
    body.append("description", form.description.trim());
    body.append("courseId", form.courseId);
    body.append("subjectId", form.subjectId);
    try {
      await notesApi.upload(body, ({ loaded, total }) => setProgress(total ? Math.round((loaded * 100) / total) : 0));
      toast.success("Your note was submitted for review.");
      setForm({ title: "", description: "", courseId: "", subjectId: "" });
      setFile(null); setProgress(0);
      onOpenChange(false);
      onUploaded();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onOpenChange={(value) => { if (!busy) onOpenChange(value); }} title="Upload a note" description="Share your study material with the community. New notes are reviewed before they’re public.">
      <form className="upload-form" onSubmit={submit}>
        <label className="field"><span>Note title</span><input className="input" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Introduction to cell biology" /></label>
        <label className="field"><span>Description <em>Optional</em></span><textarea className="input textarea" rows="3" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What will classmates learn from this note?" /></label>
        <div className="form-two-col">
          <label className="field"><span>Course</span><select className="input" value={form.courseId} onChange={(e) => update("courseId", e.target.value)}><option value="">Select a course</option>{courses.map((course) => <option key={course._id} value={course._id}>{course.name}</option>)}</select></label>
          <label className="field"><span>Subject</span><select className="input" value={form.subjectId} onChange={(e) => update("subjectId", e.target.value)} disabled={!form.courseId}><option value="">Select a subject</option>{subjects.map((subject) => <option key={subject._id} value={subject._id}>{subject.name}</option>)}</select></label>
        </div>
        <FileDropzone file={file} setFile={setFile} />
        {busy && <div className="upload-progress"><div className="progress-label"><span>Uploading securely</span><strong>{progress}%</strong></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div></div>}
        {formError && <p className="form-error-message">{formError}</p>}
        <div className="modal-actions"><Button type="submit" disabled={busy}>{busy ? "Uploading..." : "Submit for review"} <ArrowRight size={16} /></Button></div>
      </form>
    </Modal>
  );
}

export function MyNotesPage() {
  const resource = useApiResource(async () => (await notesApi.mine()).data.notes || []);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewNote, setPreviewNote] = useState(null);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const notes = resource.data || [];
  const filtered = useMemo(() => notes.filter((note) =>
    (filter === "all" || note.status === filter) &&
    `${note.title} ${note.description} ${note.fileName}`.toLowerCase().includes(query.toLowerCase()),
  ), [notes, filter, query]);
  const download = async (note) => {
    try {
      const { data } = await notesApi.download(note._id);
      if (!data.signedUrl) throw new Error("This file is stored locally and does not have a secure download URL.");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) { toast.error(errorMessage(error)); }
  };
  const remove = async (note) => {
    if (!window.confirm(`Delete “${note.title}”? This cannot be undone.`)) return;
    try { await notesApi.remove(note._id); toast.success("Note deleted."); resource.refresh(); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  return (
    <div>
      <PageHeading eyebrow="Your library" title="My notes" description="Manage your submissions and follow their review status." action={<Button onClick={() => setUploadOpen(true)}><Plus size={16} /> Upload note</Button>} />
      {resource.loading ? <LoadingState label="Loading your notes..." /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refresh} /> : <>
        <div className="filter-toolbar">
          <label className="search-field"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your notes..." /></label>
          <select className="input filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
        </div>
        {filtered.length ? <div className="personal-notes-list">{filtered.map((note) => <Card key={note._id} className="personal-note-row">
          <span className="personal-file"><FileText size={20} /></span>
          <div className="personal-note-main"><div className="personal-note-title"><h3>{note.title}</h3><StatusBadge status={note.status} /></div><p>{note.fileName} <span>·</span> {formatBytes(note.fileSize)} <span>·</span> Submitted {formatDate(note.createdAt)}</p>{note.status === "rejected" && note.rejectionReason && <div className="rejection-reason"><strong>Review feedback</strong><span>{note.rejectionReason}</span></div>}</div>
          <div className="personal-note-actions"><button className="quiet-link" onClick={() => setPreviewNote(note)} title="Preview"><BookOpen size={17} /></button><button className="quiet-link" onClick={() => download(note)} title="Download"><ArrowDownToLine size={17} /></button><button className="quiet-link danger-text" onClick={() => remove(note)} title="Delete note"><Trash2 size={17} /></button></div>
        </Card>)}</div> : <EmptyState title={query || filter !== "all" ? "No matching notes" : "Your notes start here"} description={query || filter !== "all" ? "Try changing the search or status filter." : "Upload a study guide or class summary to share it with others."} action={!(query || filter !== "all") && <Button onClick={() => setUploadOpen(true)}><Plus size={16} /> Upload your first note</Button>} />}
      </>}
      <UploadNoteModal open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={resource.refresh} />
      {previewNote && <Suspense fallback={<LoadingState label="Loading preview..." />}><NotePreview note={previewNote} open onOpenChange={(open) => { if (!open) setPreviewNote(null); }} /></Suspense>}
    </div>
  );
}

export function BookmarksPage() {
  const resource = useApiResource(async () => (await notesApi.bookmarks()).data.bookmarks || []);
  const records = resource.data || [];
  const toggle = async (record) => {
    const note = record.noteId;
    try { await notesApi.bookmark(note._id); toast.success("Bookmark removed."); resource.refresh(); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  return (
    <div>
      <PageHeading eyebrow="Saved for later" title="Bookmarks" description="A personal reading list of notes you want to revisit." />
      {resource.loading ? <LoadingState label="Loading bookmarks..." /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refresh} /> : records.filter((record) => record.noteId).length ?
        <div className="note-grid">{records.filter((record) => record.noteId).map((record) => <NoteCard key={record._id} note={record.noteId} isBookmarked onBookmark={() => toggle(record)} />)}</div> :
        <EmptyState title="No bookmarks yet" description="Save a note from the public library and it will appear here." action={<Link to="/library" className="button button-primary">Explore notes <ArrowRight size={16} /></Link>} />}
    </div>
  );
}

export function AcademicPage() {
  const resource = useApiResource(async () => (await academicApi.hierarchy()).data);
  const [expanded, setExpanded] = useState("");
  return (
    <div>
      <PageHeading eyebrow="Browse by subject" title="Academic paths" description="Explore the course and subject structure available on StudyStudent." />
      {resource.loading ? <LoadingState label="Loading academic paths..." /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refresh} /> : resource.data?.courses?.length ?
        <div className="academic-tree">{resource.data.courses.map((course) => <Card key={course._id} className="academic-course">
          <button className="academic-course-heading" onClick={() => setExpanded(expanded === course._id ? "" : course._id)}><span className="course-symbol"><BookOpen size={19} /></span><span><strong>{course.name}</strong><small>{course.subjects?.length || 0} subjects</small></span><span className={`tree-chevron ${expanded === course._id ? "tree-chevron-open" : ""}`}><ArrowRight size={16} /></span></button>
          {expanded === course._id && <div className="academic-subjects">{course.subjects?.length ? course.subjects.map((subject) => <div key={subject._id} className="academic-subject"><div><strong>{subject.name}</strong><small>{subject.code || "Subject"}{subject.semester ? ` · Semester ${subject.semester}` : ""}</small></div><div className="academic-units">{subject.units?.length ? subject.units.map((unit) => <div key={unit._id} className="academic-unit"><strong>{unit.name}</strong><span>{unit.topics?.map((topic) => topic.name).join(" · ") || "No topics listed"}</span></div>) : <span className="academic-no-topics">No units listed</span>}</div><Link to={`/library?courseId=${course._id}&subjectId=${subject._id}`} className="subtle-link">Find notes <ArrowRight size={14} /></Link></div>) : <p className="academic-empty">No subjects have been added to this course.</p>}</div>}
        </Card>)}</div> : <EmptyState title="Academic paths are not set up yet" description="Courses and subjects will appear here when the administrator adds them." />}
    </div>
  );
}

export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const resource = useApiResource(async () => (await notificationsApi.list({ unreadOnly })).data);
  const firstFilterEffect = useRef(true);
  const notifications = resource.data?.notifications || [];
  useEffect(() => {
    if (firstFilterEffect.current) {
      firstFilterEffect.current = false;
      return;
    }
    resource.refresh();
  }, [unreadOnly, resource.refresh]);
  const markRead = async (id) => {
    try { await notificationsApi.markRead(id); resource.refresh(); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  const markAll = async () => {
    try { await notificationsApi.markAllRead(); toast.success("All notifications marked as read."); resource.refresh(); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  const createWelcome = async () => {
    try { await notificationsApi.seedSystem(); toast.success("Welcome notification added."); resource.refresh(); }
    catch (error) { toast.error(errorMessage(error)); }
  };
  return (
    <div>
      <PageHeading eyebrow="Stay up to date" title="Notifications" description="Note reviews, account updates, and other important messages." action={<div className="notification-heading-actions">{!notifications.length && <Button variant="secondary" onClick={createWelcome}>Add welcome notification</Button>}{notifications.some((item) => !item.isRead) && <Button variant="secondary" onClick={markAll}>Mark all as read</Button>}</div>} />
      <div className="notification-filters"><Button variant={unreadOnly ? "secondary" : "primary"} onClick={() => setUnreadOnly(false)}>All updates</Button><Button variant={unreadOnly ? "primary" : "secondary"} onClick={() => setUnreadOnly(true)}>Unread only</Button></div>
      {resource.loading ? <LoadingState label="Loading notifications..." /> : resource.error ? <ErrorState message={resource.error} onRetry={resource.refresh} /> : notifications.length ?
        <div className="notification-list">{notifications.map((item) => <Card key={item._id} className={`notification-card ${item.isRead ? "" : "notification-unread"}`}><span className="notification-icon"><Bell size={18} /></span><div className="notification-body"><div className="notification-title"><h3>{item.title}</h3>{!item.isRead && <span className="unread-label">New</span>}</div><p>{item.message}</p><small>{formatDate(item.createdAt)}</small></div>{!item.isRead && <button className="text-link" onClick={() => markRead(item._id)}>Mark read</button>}</Card>)}</div> :
        <EmptyState title={unreadOnly ? "No unread updates" : "You’re all caught up"} description={unreadOnly ? "You have read all your notifications." : "When something needs your attention, you’ll find it here."} />}
    </div>
  );
}

export function AccountSettingsPage() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const [profile, setProfile] = useState({
    name: user?.name || "",
    bio: user?.profile?.bio || "",
    avatarUrl: user?.profile?.avatarUrl || "",
    phone: user?.profile?.phone || "",
  });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);

  const updateProfile = async (event) => {
    event.preventDefault();
    setProfileBusy(true);
    try {
      const { data } = await authApi.updateProfile(profile);
      dispatch(setUser(data.user));
      toast.success(data.message || "Profile updated.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setProfileBusy(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    if (password.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (password.newPassword !== password.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    setPasswordBusy(true);
    try {
      const { data } = await authApi.changePassword({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      toast.success(data.message || "Password updated.");
      setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <div>
      <PageHeading eyebrow="Your account" title="Account settings" description="Update your profile and keep your sign-in details secure." />
      {!user?.emailVerified && <Card className="settings-verification"><ShieldCheck size={18} /><div><strong>Verify your email address</strong><p>Confirm your email to complete account setup.</p></div><Link to="/verify-email" className="button button-secondary">Verify email <ArrowRight size={14} /></Link></Card>}
      <div className="settings-grid">
        <Card className="settings-card">
          <div className="settings-card-heading"><span className="feature-icon"><UserRound size={18} /></span><div><h2>Profile information</h2><p>Your details shown across StudyStudent.</p></div></div>
          <form className="upload-form" onSubmit={updateProfile}>
            <label className="field"><span>Full name</span><input className="input" value={profile.name} onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))} autoComplete="name" required /></label>
            <label className="field"><span>Short bio <em>Optional</em></span><textarea className="input textarea" rows="3" maxLength="300" value={profile.bio} onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))} placeholder="What are you studying?" /></label>
            <label className="field"><span>Avatar URL <em>Optional</em></span><input className="input" type="url" value={profile.avatarUrl} onChange={(event) => setProfile((current) => ({ ...current, avatarUrl: event.target.value }))} placeholder="https://example.com/avatar.png" /></label>
            <label className="field"><span>Phone <em>Optional</em></span><input className="input" type="tel" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} autoComplete="tel" /></label>
            <Button type="submit" disabled={profileBusy}><ShieldCheck size={15} />{profileBusy ? "Saving..." : "Save profile"}</Button>
          </form>
        </Card>
        <Card className="settings-card">
          <div className="settings-card-heading"><span className="feature-icon feature-icon-2"><LockKeyhole size={18} /></span><div><h2>Change password</h2><p>Use a unique password with at least 8 characters.</p></div></div>
          <form className="upload-form" onSubmit={updatePassword}>
            <label className="field"><span>Current password</span><input className="input" type="password" autoComplete="current-password" value={password.currentPassword} onChange={(event) => setPassword((current) => ({ ...current, currentPassword: event.target.value }))} required /></label>
            <label className="field"><span>New password</span><input className="input" type="password" autoComplete="new-password" minLength={8} value={password.newPassword} onChange={(event) => setPassword((current) => ({ ...current, newPassword: event.target.value }))} required /></label>
            <label className="field"><span>Confirm new password</span><input className="input" type="password" autoComplete="new-password" minLength={8} value={password.confirmPassword} onChange={(event) => setPassword((current) => ({ ...current, confirmPassword: event.target.value }))} required /></label>
            <Button type="submit" variant="secondary" disabled={passwordBusy}><LockKeyhole size={15} />{passwordBusy ? "Updating..." : "Update password"}</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
