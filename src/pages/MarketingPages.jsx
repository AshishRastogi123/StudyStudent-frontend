import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useSelector } from "react-redux";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Bookmark, BrainCircuit, Check, ChevronRight,
  Code2, Cpu, FileStack, HeartPulse, LibraryBig, LockKeyhole, Search, ShieldCheck, Sparkles,
  TrendingUp, UploadCloud, Users, Zap,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import NoteCard from "../components/NoteCard";
import { Button, Card, Field, LoadingState, ErrorState, NoteGridSkeleton } from "../components/ui";
import { authApi, errorMessage, notesApi } from "../services/api";
import { setSession, setUser } from "../features/auth/authSlice";

const reveal = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

function Reveal({ children, className = "" }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} variants={reveal} initial={reduced ? false : "hidden"} whileInView="show" viewport={{ once: true, amount: 0.18 }}>{children}</motion.div>;
}

export function LandingPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    notesApi.publicNotes({ limit: 3 }).then(({ data }) => {
      if (active) setNotes(data.notes || []);
    }).catch((err) => {
      if (active) setError(errorMessage(err));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <main>
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="hero-kicker"><span className="kicker-spark"><Sparkles size={14} /></span> A better way to study, together</div>
            <h1>Good notes make<br /><span>great things happen.</span></h1>
            <p className="hero-lede">Find trusted notes for your course, share what you know, and make your next study session count.</p>
            <div className="hero-actions">
              <Link to="/library" className="button button-primary button-large">Explore the library <ArrowRight size={17} /></Link>
              <Link to="/register" className="button button-secondary button-large">Share your notes <UploadCloud size={17} /></Link>
            </div>
            <div className="hero-trust"><div className="trust-avatars"><span>A</span><span>M</span><span>J</span><span><Users size={14} /></span></div><p><strong>A community that learns together</strong><br />Discover notes made by students, for students.</p></div>
          </div>
          <div className="hero-visual">
            <div className="hero-decoration decor-one" />
            <div className="hero-decoration decor-two" />
            <div className="hero-note-stack">
              <div className="hero-paper hero-paper-back"><span /><span /><span /></div>
              <div className="hero-paper hero-paper-front">
                <div className="paper-top"><span className="paper-icon"><BookOpen size={16} /></span><span className="paper-label">STUDY GUIDE</span><span className="paper-pill">Verified</span></div>
                <h3>Cell Biology<br />&amp; Genetics</h3>
                <p>Chapter 04 · Biology</p>
                <div className="paper-rule" /><span className="paper-line wide" /><span className="paper-line" /><span className="paper-line medium" />
                <div className="paper-callout"><span className="callout-check"><Check size={12} /></span><span>Shared by your study community</span></div>
              </div>
              <div className="floating-note float-top"><span className="float-icon"><Bookmark size={15} /></span><span><strong>Saved for later</strong><small>One-tap bookmarks</small></span></div>
              <div className="floating-note float-bottom"><span className="float-icon purple"><ShieldCheck size={15} /></span><span><strong>Reviewed &amp; ready</strong><small>Quality notes you can trust</small></span></div>
            </div>
          </div>
        </div>
        <div className="hero-bottom-line"><span>BUILT FOR STUDENTS WHO SHARE</span><span className="hero-line" /><span>LEARN MORE, TOGETHER <ArrowDownRight size={14} /></span></div>
      </section>

      <section className="feature-section" id="features">
        <Reveal className="section-heading centered">
          <p className="eyebrow">A calmer way to study</p>
          <h2>Everything you need to<br />learn with confidence.</h2>
          <p>Useful tools for finding the right material, staying organized, and helping your classmates.</p>
        </Reveal>
        <div className="feature-grid">
          {[
            { icon: Search, title: "Find your focus", copy: "Search notes by course, subject, topic, or the thing you need to understand." },
            { icon: ShieldCheck, title: "Study with confidence", copy: "Notes are reviewed before they’re shared with the public library." },
            { icon: UploadCloud, title: "Share what you know", copy: "Upload your study material and track it while it goes through review." },
            { icon: Bookmark, title: "Keep it organized", copy: "Save useful notes and come back to them whenever you need a refresher." },
          ].map(({ icon: Icon, title, copy }, index) => <Reveal key={title}><Card className="feature-card"><span className={`feature-icon feature-icon-${index}`}><Icon size={20} /></span><h3>{title}</h3><p>{copy}</p><span className="feature-arrow"><ArrowUpRight size={16} /></span></Card></Reveal>)}
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-copy"><Reveal><p className="eyebrow">Simple by design</p><h2>From searching to<br />studying in minutes.</h2><p className="section-copy">A shared library should feel easy to use. Find a starting point, make it yours, then share something helpful in return.</p><Link to="/library" className="text-link">Explore notes <ArrowRight size={16} /></Link></Reveal></div>
        <div className="steps-list">
          {[
            { n: "01", icon: Search, title: "Find the right notes", copy: "Browse the public library by course and subject or search a specific topic." },
            { n: "02", icon: LibraryBig, title: "Make learning yours", copy: "Preview and download authorized notes, then bookmark the ones you’ll revisit." },
            { n: "03", icon: Users, title: "Pass it forward", copy: "Share your own notes with the community after a quick review." },
          ].map(({ n, icon: Icon, title, copy }, index) => <Reveal key={n}><div className="step-row"><span className="step-number">{n}</span><span className="step-icon"><Icon size={20} /></span><div><h3>{title}</h3><p>{copy}</p></div><ChevronRight size={18} className="step-arrow" /></div></Reveal>)}
        </div>
      </section>

      <section className="latest-section">
        <div className="latest-heading"><div><p className="eyebrow">Community library</p><h2>Notes worth a closer look.</h2><p>Browse recently shared public study material.</p></div><Link to="/library" className="button button-secondary">Browse all notes <ArrowRight size={16} /></Link></div>
        {loading ? <NoteGridSkeleton count={3} /> : error ? <ErrorState message={error} /> : notes.length ? <div className="note-grid note-grid-three">{notes.map((note) => <NoteCard key={note._id} note={note} />)}</div> : <div className="inline-empty"><FileStack size={19} /><span>No public notes are available yet. Check back soon.</span></div>}
      </section>

      <section className="closing-cta">
        <div className="cta-pattern"><span /><span /><span /></div>
        <div><p className="eyebrow">Your next study session starts here</p><h2>Let’s make learning<br />a little more shared.</h2></div>
        <div className="cta-buttons"><Link to="/register" className="button button-white button-large">Create your free account <ArrowRight size={17} /></Link><span>No noise. Just notes that help.</span></div>
      </section>
    </main>
  );
}

export function AboutPage() {
  const reducedMotion = useReducedMotion();
  const introduction = [
    "I am Ashish Kumar Rastogi, a technology enthusiast and Computer Science professional with a strong interest in Artificial Intelligence, Machine Learning, and Software Development.",
    "I am passionate about building innovative technology solutions that make learning more accessible, organized, and effective.",
    "My technical interests include Python, JavaScript, React.js, Node.js, MongoDB, Artificial Intelligence, Machine Learning, and Deep Learning.",
    "Through StudyStudent, my vision is to create a collaborative educational platform where students can upload, discover, share, and access quality study materials in one place.",
    "I believe that knowledge becomes more valuable when it is shared.",
  ];
  const skills = [
    "Python", "JavaScript", "React.js", "Node.js", "Express.js", "MongoDB",
    "Artificial Intelligence", "Machine Learning", "Deep Learning", "TensorFlow",
    "Scikit-Learn", "Full-Stack Development", "Educational Technology", "Software Engineering",
  ];
  const projects = [
    {
      icon: HeartPulse,
      name: "SwasthaLife",
      type: "Healthcare technology",
      description: "A healthcare technology platform focused on practical digital experiences.",
    },
    {
      icon: TrendingUp,
      name: "Retail Sales Prediction",
      type: "Machine learning",
      description: "A machine learning project exploring retail sales prediction.",
    },
    {
      icon: Code2,
      name: "Technology-driven projects",
      type: "Software development",
      description: "Exploring software solutions across development and learning experiences.",
    },
  ];

  return (
    <AnimatePresence initial={false}>
      <motion.main
        key="founder-about"
        className="content-page founder-page"
        initial={reducedMotion ? false : { opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
        transition={{ duration: reducedMotion ? 0 : 0.5, ease: "easeOut" }}
      >
        <section className="founder-profile">
          <motion.div
            className="founder-portrait-frame"
            initial={reducedMotion ? false : { opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            whileHover={reducedMotion ? undefined : { y: -4 }}
            transition={{ duration: reducedMotion ? 0 : 0.45, ease: "easeOut" }}
          >
            <img
              className="founder-portrait"
              src="/images/ashish-profile.jpg"
              alt="Ashish Kumar Rastogi – Founder of StudyStudent"
              width="520"
              height="600"
            />
            <div className="founder-portrait-caption">
              <span className="founder-caption-mark"><BookOpen size={16} /></span>
              <span><strong>Built around shared knowledge</strong><small>Technology with a learning-first purpose</small></span>
            </div>
          </motion.div>

          <div className="founder-intro">
            <p className="eyebrow">The person behind the platform</p>
            <h1>Ashish Kumar Rastogi</h1>
            <p className="founder-designation">Founder &amp; Creator of StudyStudent</p>
            <p className="founder-identity">Technology Enthusiast <span>·</span> AI &amp; Software Development Professional</p>
            <div className="founder-biography">
              {introduction.map((paragraph, index) => (
                <motion.p
                  key={paragraph}
                  initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: reducedMotion ? 0 : 0.35, delay: reducedMotion ? 0 : index * 0.07 }}
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>
            <div className="founder-mission">
              <span className="mission-icon"><BrainCircuit size={19} /></span>
              <div><strong>Our mission</strong><p>To make quality educational resources accessible to every student through technology and knowledge sharing.</p></div>
            </div>
          </div>
        </section>

        <section className="founder-skills" aria-labelledby="founder-skills-heading">
          <div className="founder-section-heading">
            <span className="founder-section-icon"><Cpu size={17} /></span>
            <div><p className="eyebrow">Areas of focus</p><h2 id="founder-skills-heading">Interests &amp; technical skills</h2></div>
          </div>
          <motion.ul
            className="skill-badges"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{ visible: { transition: { staggerChildren: reducedMotion ? 0 : 0.035 } } }}
          >
            {skills.map((skill) => (
              <motion.li
                key={skill}
                variants={{
                  hidden: reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0, transition: { duration: reducedMotion ? 0 : 0.25 } },
                }}
              >
                {skill}
              </motion.li>
            ))}
          </motion.ul>
        </section>

        <section className="founder-projects" aria-labelledby="founder-projects-heading">
          <div className="founder-section-heading">
            <span className="founder-section-icon"><Code2 size={17} /></span>
            <div><p className="eyebrow">Selected work</p><h2 id="founder-projects-heading">Building useful technology</h2></div>
          </div>
          <div className="founder-project-grid">
            {projects.map(({ icon: Icon, name, type, description }, index) => (
              <motion.article
                key={name}
                className="founder-project-card"
                initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                whileHover={reducedMotion ? undefined : { y: -4 }}
                transition={{ duration: reducedMotion ? 0 : 0.32, delay: reducedMotion ? 0 : index * 0.06 }}
              >
                <span className="founder-project-icon"><Icon size={18} /></span>
                <span className="founder-project-type">{type}</span>
                <h3>{name}</h3>
                <p>{description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <div className="about-cta founder-cta">
          <div><p className="eyebrow">StudyStudent</p><h2>Knowledge grows when it’s shared.</h2><p>Discover and share useful learning resources with the community.</p></div>
          <Link to="/register" className="button button-primary">Join the community <ArrowRight size={16} /></Link>
        </div>
      </motion.main>
    </AnimatePresence>
  );
}

export function ContactPage() {
  return (
    <main className="content-page narrow-content">
      <section className="simple-hero"><p className="eyebrow">Contact</p><h1>We’re here to<br /><span>help you learn.</span></h1><p>For account access, note reviews, or content concerns, use the relevant in-product tools or contact your institution’s StudyStudent administrator.</p></section>
      <Card className="contact-card"><span className="feature-icon"><Users size={20} /></span><h2>Need to report a note?</h2><p>Open the note details and use “Report note.” Reports are routed to authorized moderators for review.</p><Link to="/library" className="text-link">Browse the public library <ArrowRight size={16} /></Link></Card>
      <p className="backend-note">There is no public contact-submission endpoint configured for this service.</p>
    </main>
  );
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  confirmPassword: z.string(),
}).refine((value) => value.password === value.confirmPassword, { message: "Passwords do not match.", path: ["confirmPassword"] });

function AuthShell({ title, subtitle, linkText, linkTo, children }) {
  return (
    <main className="auth-page">
      <div className="auth-decoration"><span /><span /><span /></div>
      <div className="auth-card">
        <Link to="/" className="brand auth-brand"><span className="brand-mark"><BookOpen size={18} /></span><span>Study<span className="brand-accent">Student</span></span></Link>
        <h1>{title}</h1><p className="auth-subtitle">{subtitle}</p>
        {children}
        <p className="auth-switch">{linkText} <Link to={linkTo}>{linkTo === "/login" ? "Sign in" : "Create account"}</Link></p>
        <div className="auth-secure"><LockKeyhole size={13} /> Your account is protected with secure sign-in</div>
      </div>
      <div className="auth-side-copy"><span><Zap size={17} /></span><p>Knowledge grows<br />when it’s shared.</p><small>StudyStudent · Learn together</small></div>
    </main>
  );
}

function useGoogleSignIn() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useCallback(async (credential) => {
    try {
      const { data } = await authApi.google({ credential });
      dispatch(setSession({ user: data.user, token: data.token }));
      toast.success(data.message || "Google sign-in successful.");
      navigate("/app", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }, [dispatch, navigate]);
}

function GoogleSignInSection({ onCredential }) {
  const buttonRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    const scriptUrl = "https://accounts.google.com/gsi/client";
    const loadGoogleScript = () => {
      if (window.google?.accounts?.id) return Promise.resolve();
      return new Promise((resolve, reject) => {
        let script = document.querySelector("script[data-google-identity]");
        if (!script) {
          script = document.createElement("script");
          script.src = scriptUrl;
          script.async = true;
          script.defer = true;
          script.dataset.googleIdentity = "true";
        }
        script.addEventListener("load", resolve, { once: true });
        script.addEventListener("error", () => {
          script.remove();
          reject(new Error("Google sign-in script failed to load."));
        }, { once: true });
        if (!script.isConnected) document.head.appendChild(script);
      });
    };

    authApi.googleConfig().then(({ data }) => {
      if (!data.clientId) {
        if (active) setStatus("unconfigured");
        return null;
      }
      return loadGoogleScript().then(() => data.clientId);
    }).then((clientId) => {
      if (!active || !clientId || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          if (!credential) {
            toast.error("Google did not return a sign-in credential.");
            return;
          }
          setBusy(true);
          try {
            await onCredential(credential);
          } finally {
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: Math.floor(buttonRef.current.getBoundingClientRect().width),
      });
      setStatus("ready");
    }).catch((error) => {
      if (!active) return;
      setStatus("error");
      toast.error(errorMessage(error) === "Network Error"
        ? "Unable to load Google sign-in. Check your connection and try again."
        : "Unable to load Google sign-in. Please try again later.");
    });

    return () => { active = false; };
  }, [onCredential]);

  return (
    <div className="google-signin-section">
      <div className="auth-divider"><span>or continue with</span></div>
      <div className={`google-signin-button${busy ? " google-signin-busy" : ""}`}>
        <div ref={buttonRef} />
        {status === "loading" && <span className="google-signin-message">Loading Google sign-in...</span>}
        {status === "error" && <span className="google-signin-message">Google sign-in could not be loaded.</span>}
        {status === "unconfigured" && <span className="google-signin-message">Google sign-in is not configured.</span>}
      </div>
      {busy && <span className="google-signin-message">Signing in...</span>}
    </div>
  );
}

export function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const googleSignIn = useGoogleSignIn();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(loginSchema) });
  const onSubmit = async (body) => {
    try {
      const { data } = await authApi.login(body);
      dispatch(setSession({ user: data.user, token: data.token }));
      toast.success(data.message || "Welcome back.");
      navigate("/app", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to pick up where you left off." linkText="New to StudyStudent?" linkTo="/register">
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Email address" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Field label="Password" type="password" placeholder="Your password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
        <Link to="/forgot-password" className="text-link auth-help-link">Forgot your password?</Link>
        <Button type="submit" className="auth-submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"} <ArrowRight size={16} /></Button>
      </form>
      <GoogleSignInSection onCredential={googleSignIn} />
    </AuthShell>
  );
}

export function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const googleSignIn = useGoogleSignIn();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(registerSchema) });
  const onSubmit = async ({ confirmPassword, ...body }) => {
    try {
      const { data } = await authApi.register(body);
      dispatch(setSession({ user: data.user, token: data.token }));
      toast.success(data.message || "Your account is ready. Verify your email to finish setup.");
      navigate(`/verify-email?token=${encodeURIComponent(data.verificationToken || "")}`, { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };
  return (
    <AuthShell title="Create your account" subtitle="Join students sharing better ways to learn." linkText="Already have an account?" linkTo="/login">
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="Full name" placeholder="Your name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Field label="Email address" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Field label="Password" type="password" placeholder="At least 8 characters" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
        <Field label="Confirm password" type="password" placeholder="Enter your password again" autoComplete="new-password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
        <p className="form-hint">Student accounts are created with the STUDENT role.</p>
        <Button type="submit" className="auth-submit" disabled={isSubmitting}>{isSubmitting ? "Creating account..." : "Create account"} <ArrowRight size={16} /></Button>
      </form>
      <GoogleSignInSection onCredential={googleSignIn} />
    </AuthShell>
  );
}

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sessionToken = useSelector((state) => state.auth.token);

  const verify = async (event) => {
    event.preventDefault();
    if (!token.trim()) {
      toast.error("Enter your email verification token.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await authApi.verifyEmail({ token: token.trim() });
      dispatch(setUser(data.user));
      toast.success(data.message || "Email verified.");
      navigate(sessionToken ? "/app" : "/login", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Verify your email" subtitle="Confirm your email address to finish setting up your account." linkText="Already verified?" linkTo="/login">
      <form className="auth-form" onSubmit={verify}>
        <Field label="Verification token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste your verification token" autoComplete="one-time-code" />
        <p className="form-hint">If your account was just created, its verification token is included in the registration response. If you did not receive one, contact your administrator.</p>
        <Button type="submit" className="auth-submit" disabled={busy}>{busy ? "Verifying..." : "Verify email"} <ArrowRight size={16} /></Button>
      </form>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const { data } = await authApi.forgotPassword({ email: email.trim() });
      setMessage(data.message || "If the account exists, password reset can be completed with its reset token.");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Request a reset for the email address on your account." linkText="Remembered your password?" linkTo="/login">
      <form className="auth-form" onSubmit={submit}>
        <Field label="Email address" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
        <Button type="submit" className="auth-submit" disabled={busy}>{busy ? "Requesting..." : "Request reset"} <ArrowRight size={16} /></Button>
        {message && <p className="form-hint auth-feedback" role="status">{message}</p>}
      </form>
      <div className="auth-flow-note"><strong>Reset email delivery is not configured.</strong><span>The backend accepts reset requests but does not send reset links. You’ll need a valid reset token from your configured delivery channel before continuing.</span><Link to="/reset-password" className="text-link">I already have a reset token <ArrowRight size={14} /></Link></div>
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get("token") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { data } = await authApi.resetPassword({ token: token.trim(), newPassword: password });
      toast.success(data.message || "Password reset successfully.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Choose a new password" subtitle="Use the reset token provided for your account." linkText="Back to sign in?" linkTo="/login">
      <form className="auth-form" onSubmit={submit}>
        <Field label="Reset token" value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste your reset token" required />
        <Field label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
        <Field label="Confirm new password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required />
        <Button type="submit" className="auth-submit" disabled={busy}>{busy ? "Updating password..." : "Update password"} <ArrowRight size={16} /></Button>
      </form>
    </AuthShell>
  );
}
