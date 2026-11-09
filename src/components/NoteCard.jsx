import { motion, useReducedMotion } from "motion/react";
import { ArrowDownToLine, Bookmark, Eye, FileText, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "./ui";
import { formatBytes, formatDate } from "../utils/format";

export default function NoteCard({ note, onBookmark, isBookmarked = false, onDownload, showStatus = false }) {
  const reduced = useReducedMotion();
  const course = typeof note.courseId === "object" ? note.courseId?.name : "";
  const subject = typeof note.subjectId === "object" ? note.subjectId?.name : "";
  return (
    <motion.article layout initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="note-card">
      <div className="note-card-top">
        <span className="file-icon"><FileText size={19} /></span>
        <div className="note-actions">
          {showStatus && <StatusBadge status={note.status} />}
          {onBookmark && <button className={`icon-button ${isBookmarked ? "is-saved" : ""}`} onClick={() => onBookmark(note)} title={isBookmarked ? "Remove bookmark" : "Bookmark"}><Bookmark size={17} fill={isBookmarked ? "currentColor" : "none"} /></button>}
          {!onBookmark && <MoreHorizontal size={18} className="text-muted" />}
        </div>
      </div>
      <div className="note-card-content">
        <h3><Link to={`/notes/${note._id}`}>{note.title}</Link></h3>
        <p>{note.description || "Shared study material from the StudyStudent community."}</p>
        <div className="note-meta">
          {course && <span>{course}</span>}
          {subject && <span>{subject}</span>}
        </div>
      </div>
      <div className="note-card-footer">
        <span>{formatBytes(note.fileSize)} <span className="meta-dot">·</span> {formatDate(note.createdAt)}</span>
        <div className="note-card-links">
          <Link className="quiet-link" to={`/notes/${note._id}`} aria-label="View note"><Eye size={16} /></Link>
          {onDownload && <button className="quiet-link" onClick={() => onDownload(note)} aria-label="Download note"><ArrowDownToLine size={16} /></button>}
        </div>
      </div>
    </motion.article>
  );
}
