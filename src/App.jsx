import { lazy, Suspense, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast, Toaster } from "sonner";
import { authApi, errorMessage } from "./services/api";
import { clearSession, finishAuthCheck, setUser } from "./features/auth/authSlice";
import { RequireAuth, RequireRole } from "./routes/RouteGuards";
import SiteLayout from "./layouts/SiteLayout";
import WorkspaceLayout from "./layouts/WorkspaceLayout";

const LandingPage = lazy(() => import("./pages/MarketingPages").then((module) => ({ default: module.LandingPage })));
const AboutPage = lazy(() => import("./pages/MarketingPages").then((module) => ({ default: module.AboutPage })));
const ContactPage = lazy(() => import("./pages/MarketingPages").then((module) => ({ default: module.ContactPage })));
const LoginPage = lazy(() => import("./pages/MarketingPages").then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import("./pages/MarketingPages").then((module) => ({ default: module.RegisterPage })));
const VerifyEmailPage = lazy(() => import("./pages/MarketingPages").then((module) => ({ default: module.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import("./pages/MarketingPages").then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("./pages/MarketingPages").then((module) => ({ default: module.ResetPasswordPage })));
const DashboardPage = lazy(() => import("./pages/StudentPages").then((module) => ({ default: module.DashboardPage })));
const MyNotesPage = lazy(() => import("./pages/StudentPages").then((module) => ({ default: module.MyNotesPage })));
const BookmarksPage = lazy(() => import("./pages/StudentPages").then((module) => ({ default: module.BookmarksPage })));
const AcademicPage = lazy(() => import("./pages/StudentPages").then((module) => ({ default: module.AcademicPage })));
const NotificationsPage = lazy(() => import("./pages/StudentPages").then((module) => ({ default: module.NotificationsPage })));
const LibraryPage = lazy(() => import("./pages/LibraryPages").then((module) => ({ default: module.LibraryPage })));
const NoteDetailPage = lazy(() => import("./pages/LibraryPages").then((module) => ({ default: module.NoteDetailPage })));
const AdminOverviewPage = lazy(() => import("./pages/AdminPages").then((module) => ({ default: module.AdminOverviewPage })));
const ReviewQueuePage = lazy(() => import("./pages/AdminPages").then((module) => ({ default: module.ReviewQueuePage })));
const ReportsPage = lazy(() => import("./pages/AdminPages").then((module) => ({ default: module.ReportsPage })));
const AcademicAdminPage = lazy(() => import("./pages/AdminPages").then((module) => ({ default: module.AcademicAdminPage })));
const UserManagementPage = lazy(() => import("./pages/AdminPages").then((module) => ({ default: module.UserManagementPage })));
const AllNotesPage = lazy(() => import("./pages/AdminPages").then((module) => ({ default: module.AllNotesPage })));
const AccountSettingsPage = lazy(() => import("./pages/StudentPages").then((module) => ({ default: module.AccountSettingsPage })));

function PageMotion({ children }) {
  const reduced = useReducedMotion();
  return <motion.div initial={reduced ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={reduced ? undefined : { opacity: 0, y: -4 }} transition={{ duration: reduced ? 0 : 0.18 }}>{children}</motion.div>;
}

export default function App() {
  const dispatch = useDispatch();
  const location = useLocation();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    let active = true;
    if (!token) {
      dispatch(finishAuthCheck());
      return () => { active = false; };
    }
    authApi.me().then(({ data }) => {
      if (active) dispatch(setUser(data.user));
    }).catch((error) => {
      if (!active) return;
      if (error?.response?.status === 401 || error?.response?.status === 404) dispatch(clearSession());
      else {
        dispatch(finishAuthCheck());
        toast.error(errorMessage(error));
      }
    }).finally(() => {
      if (active) dispatch(finishAuthCheck());
    });
    return () => { active = false; };
  }, [dispatch, token]);

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <AnimatePresence mode="wait" initial={false}>
        <PageMotion key={location.pathname}>
          <Suspense fallback={<div className="full-page-loading"><span className="loading-dot" />Loading StudyStudent</div>}>
          <Routes location={location}>
            <Route element={<SiteLayout />}>
              <Route index element={<LandingPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="verify-email" element={<VerifyEmailPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="notes/:id" element={<NoteDetailPage />} />
            </Route>
            <Route element={<RequireAuth />}>
              <Route path="app" element={<WorkspaceLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="notes" element={<MyNotesPage />} />
                <Route path="bookmarks" element={<BookmarksPage />} />
                <Route path="academic" element={<AcademicPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<AccountSettingsPage />} />
              </Route>
              <Route element={<RequireRole roles={["ADMIN", "MODERATOR"]} />}>
                <Route path="admin" element={<WorkspaceLayout />}>
                  <Route index element={<AdminOverviewPage />} />
                  <Route path="review" element={<ReviewQueuePage />} />
                  <Route path="notes" element={<AllNotesPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                </Route>
              </Route>
              <Route element={<RequireRole roles={["ADMIN"]} />}>
                <Route path="admin/users" element={<WorkspaceLayout />}>
                  <Route index element={<UserManagementPage />} />
                </Route>
                <Route path="admin/academic" element={<WorkspaceLayout />}>
                  <Route index element={<AcademicAdminPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </PageMotion>
      </AnimatePresence>
    </>
  );
}
