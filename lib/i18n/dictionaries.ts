import type { Language } from "@/types";

export const LANGUAGES: { value: Language; label: string; native: string }[] = [
  { value: "en", label: "English", native: "English" },
  { value: "bn", label: "Bangla", native: "বাংলা" },
];

export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_COOKIE = "desco-language";

/**
 * Central translation dictionary.
 *
 * Every user-facing string lives here — components call `t("key")` rather than
 * embedding literals, so adding a language is a single-file change.
 *
 * `en` is the source of truth; `bn` is typed against it so a missing Bangla key
 * is a compile-time error, not a runtime fallback to English.
 */
export const en = {
  // ---- Brand / global -------------------------------------------------------
  "app.name": "DESCO SMART",
  "app.tagline": "Prepaid Balance Monitor",
  "app.description":
    "Monitor DESCO prepaid electricity balances, manage multiple meters, and receive automated low-balance alerts.",

  // ---- Navigation -----------------------------------------------------------
  "nav.home": "Home",
  "nav.about": "About",
  "nav.features": "Features",
  "nav.aiForecaster": "AI Forecaster",
  "nav.reviews": "Customer Reviews",
  "nav.faq": "FAQ",
  "nav.contact": "Contact",
  "nav.signIn": "Sign In",
  "nav.registerMeter": "Register Meter",
  "nav.dashboard": "Dashboard",
  "nav.myMeters": "My Meters",
  "nav.analytics": "Analytics",
  "nav.reports": "Reports",
  "nav.notifications": "Notifications",
  "nav.profile": "Profile",
  "nav.settings": "Settings",
  "nav.logout": "Log out",
  "nav.openMenu": "Open menu",
  "nav.closeMenu": "Close menu",
  "nav.main": "Main",
  "nav.account": "Account",
  "nav.toggleSidebar": "Toggle sidebar",

  // ---- Landing: hero --------------------------------------------------------
  "hero.badge": "DESCO Prepaid Meter Monitoring",
  "hero.title1": "Never get disconnected",
  "hero.title2": "in the dark.",
  "hero.subtitle":
    "DESCO Smart helps you monitor prepaid electricity balances, manage multiple meters, track balance history, and receive automated low-balance alerts.",
  "hero.ctaPrimary": "Register Meter",
  "hero.ctaSecondary": "Sign In to Dashboard",
  "hero.point1": "Multi-Meter Monitoring",
  "hero.point2": "Automated Balance Alerts",
  "hero.point3": "Balance History",
  "hero.point4": "Secure Account",
  "hero.point5": "No Hardware Required",
  "hero.previewTitle": "How protection works",
  "hero.previewEmpty": "Private by design",
  "hero.previewHint":
    "Balances are private — sign in to see your own meters. Nothing is shown here without login.",
  "hero.previewCta": "Connect a meter",
  "hero.cardStep1Title": "1. Add your meters",
  "hero.cardStep1Desc": "Home, office, shop — unlimited meters per account.",
  "hero.cardStep2Title": "2. Set thresholds",
  "hero.cardStep2Desc": "Per-meter low + critical levels in taka.",
  "hero.cardStep3Title": "3. Get emailed",
  "hero.cardStep3Desc": "Auto email to your account address before cutoff.",

  // ---- Landing: how it works ------------------------------------------------
  "how.eyebrow": "How It Works",
  "how.title": "Monitoring in four steps",
  "how.subtitle":
    "From sign-up to your first automated alert — no hardware, no manual checking.",
  "how.step1.title": "Create Account",
  "how.step1.desc":
    "Register in seconds with your email. Your data is isolated to your account from the very first request.",
  "how.step2.title": "Add DESCO Meter",
  "how.step2.desc":
    "Enter your meter and account number. Add as many meters as you own — home, office, or shop.",
  "how.step3.title": "Set Balance Threshold",
  "how.step3.desc":
    "Choose the low and critical balance levels that matter for each meter individually.",
  "how.step4.title": "Receive Automatic Alerts",
  "how.step4.desc":
    "A scheduled worker checks every active meter and emails you before the power runs out.",

  // ---- Landing: features ----------------------------------------------------
  "features.eyebrow": "Features",
  "features.title": "Everything you need to stay powered",
  "features.subtitle":
    "Built around the real DESCO prepaid API — not a mock-up.",
  "features.multiMeter.title": "Multi-Meter Monitoring",
  "features.multiMeter.desc":
    "Track unlimited DESCO prepaid meters from one dashboard, each with independent settings.",
  "features.alerts.title": "Low Balance Alerts",
  "features.alerts.desc":
    "Per-meter low and critical thresholds trigger alerts before your balance runs out.",
  "features.automated.title": "Automated Checking",
  "features.automated.desc":
    "A scheduled GitHub Actions worker polls every active meter on a single shared schedule.",
  "features.history.title": "Balance History",
  "features.history.desc":
    "Every reading is stored as an immutable time series you can chart and export.",
  "features.analytics.title": "Analytics",
  "features.analytics.desc":
    "Daily burn rate, consumption trends and runway estimates from your real usage data.",
  "features.email.title": "Email Notifications",
  "features.email.desc":
    "Professional HTML alert emails delivered over your own SMTP credentials.",
  "features.bilingual.title": "English + বাংলা",
  "features.bilingual.desc":
    "The entire interface, including validation messages, is fully bilingual.",
  "features.theme.title": "Dark + Light Mode",
  "features.theme.desc":
    "A considered dark theme by default, with an equally polished light theme.",
  "features.secure.title": "Secure Account",
  "features.secure.desc":
    "Database-level row security means your meters are never visible to another account.",

  // ---- Landing: multi-meter -------------------------------------------------
  "multi.eyebrow": "Multi-Meter",
  "multi.title": "Manage all your meters from one dashboard.",
  "multi.subtitle":
    "Home, office, shop or apartment — each meter keeps its own threshold, history and alert settings, and is processed independently by the monitoring worker.",
  "multi.illustrative": "Illustrative example — not real account data",
  "multi.home": "Home Meter",
  "multi.office": "Office Meter",
  "multi.shop": "Shop Meter",
  "multi.point1": "Independent thresholds per meter",
  "multi.point2": "Separate balance history and analytics",
  "multi.point3": "Only the owner is emailed about their meter",

  // ---- Landing: alerts ------------------------------------------------------
  "alertsec.eyebrow": "Alerting",
  "alertsec.title": "Know before the lights go out.",
  "alertsec.subtitle":
    "Configure a low-balance threshold per meter. Here is exactly what happens when it is crossed.",
  "alertsec.step1": "Balance drops below your threshold",
  "alertsec.step2": "Monitoring worker detects it on the next run",
  "alertsec.step3": "An alert record is created for that meter",
  "alertsec.step4": "Email notification is dispatched to the owner",
  "alertsec.dedupeTitle": "No duplicate spam",
  "alertsec.dedupeDesc":
    "While a meter stays in the same state you are re-notified at most once per cooldown window. A change in state — or a recovery — always notifies immediately.",

  // ---- Landing: analytics ---------------------------------------------------
  "analyticsec.eyebrow": "Analytics",
  "analyticsec.title": "Understand how you actually consume.",
  "analyticsec.subtitle":
    "Balance history, daily consumption, estimated remaining days and recharge history — charted from your own readings.",
  "analyticsec.illustrative":
    "Illustrative preview — your dashboard charts your own data",
  "analyticsec.item1": "Balance trajectory against your threshold",
  "analyticsec.item2": "Daily consumption and burn rate",
  "analyticsec.item3": "Estimated remaining days",
  "analyticsec.item4": "Recharge history from DESCO",

  // ---- Landing: AI forecaster -----------------------------------------------
  "ai.eyebrow": "AI Forecaster",
  "ai.title": "Forecasting built on your own readings.",
  "ai.subtitle":
    "The forecaster is a transparent statistical model over your recent balance history — not a black box.",
  "ai.metric1": "Average daily usage",
  "ai.metric1desc":
    "Mean taka consumed per day across the selected period, from stored readings.",
  "ai.metric2": "Estimated remaining days",
  "ai.metric2desc":
    "Current balance divided by the average daily burn rate.",
  "ai.metric3": "Projected depletion date",
  "ai.metric3desc":
    "The date your balance is expected to reach zero at the current rate.",
  "ai.metric4": "Recharge recommendation",
  "ai.metric4desc":
    "A suggested top-up so you stay above your threshold for the next cycle.",
  "ai.honesty":
    "Forecasts are estimates derived from historical averages. They cannot account for sudden changes in usage, tariff revisions, or DESCO-side adjustments, and are shown only once enough readings exist.",

  // ---- Landing: security ----------------------------------------------------
  "security.eyebrow": "Security",
  "security.title": "Your meter data stays yours.",
  "security.subtitle":
    "These are the controls actually implemented in this application.",
  "security.item1.title": "Secure authentication",
  "security.item1.desc":
    "Sessions are issued and verified by Supabase Auth on every server request.",
  "security.item2.title": "Database-level access control",
  "security.item2.desc":
    "PostgreSQL Row Level Security policies gate every table, not just the UI.",
  "security.item3.title": "User-specific meter isolation",
  "security.item3.desc":
    "Ownership is enforced in SQL, so one account can never read another's meters.",
  "security.item4.title": "Protected server operations",
  "security.item4.desc":
    "Mutations run in server actions that re-derive your identity from the session.",
  "security.item5.title": "Secrets in environment variables",
  "security.item5.desc":
    "SMTP and service-role credentials live in env vars and never reach the browser.",
  "security.item6.title": "Immutable audit trail",
  "security.item6.desc":
    "Sensitive actions are recorded server-side and cannot be edited by clients.",

  // ---- Landing: reviews -----------------------------------------------------
  "reviews.eyebrow": "Customer Reviews",
  "reviews.title": "What users say",
  "reviews.subtitle": "Verified reviews from real DESCO Smart accounts.",
  "reviews.emptyTitle": "No reviews published yet",
  "reviews.emptyDesc":
    "This section is content-ready and will display verified reviews once they are submitted. We do not display invented testimonials.",

  // ---- Landing: FAQ ---------------------------------------------------------
  "faq.eyebrow": "FAQ",
  "faq.title": "Frequently asked questions",
  "faq.subtitle": "Everything about how DESCO Smart monitors your meters.",
  "faq.q1": "What is DESCO Smart?",
  "faq.a1":
    "DESCO Smart is a prepaid balance monitoring dashboard for DESCO electricity meters. It records your balance over time, charts your consumption, and emails you when a meter drops below a threshold you set.",
  "faq.q2": "Can I monitor multiple meters?",
  "faq.a2":
    "Yes. A single account can register unlimited meters — home, office, shop or apartment. Each has its own name, thresholds, history and alert settings, and is checked independently.",
  "faq.q3": "How does the balance alert work?",
  "faq.a3":
    "A scheduled worker reads the balance of every active meter. If a balance is at or below your low threshold an alert is created, and if email alerts are enabled for that meter a notification email is dispatched to the owner.",
  "faq.q4": "Can I set different thresholds for different meters?",
  "faq.a4":
    "Yes. Both the low threshold and the critical threshold are configured per meter, so a small flat and a commercial unit can use appropriate levels.",
  "faq.q5": "Can I receive email alerts?",
  "faq.a5":
    "Yes, provided SMTP credentials are configured in the deployment environment. Emails are sent from the server-side worker — never from your browser.",
  "faq.q6": "How often is my meter checked?",
  "faq.a6":
    "On the schedule configured in the GitHub Actions workflow, which runs one job that processes all active meters. You can also trigger an immediate check at any time with the Check Now button.",
  "faq.q7": "Can I use Bangla?",
  "faq.a7":
    "Yes. The full interface, including navigation, dashboards and form validation messages, is available in English and বাংলা, and your preference is saved.",
  "faq.q8": "Is my meter information secure?",
  "faq.a8":
    "Your meters are protected by PostgreSQL Row Level Security, so the database itself refuses to return another account's rows. Credentials are stored in environment variables and are never exposed to the browser.",

  // ---- Landing: final CTA + footer ------------------------------------------
  "cta.title": "Stay ahead of your prepaid balance.",
  "cta.subtitle":
    "Register your DESCO meter and let the monitor watch it for you.",
  "footer.description":
    "Automated DESCO prepaid electricity balance monitoring with multi-meter support, analytics and low-balance alerts.",
  "footer.quickLinks": "Quick Links",
  "footer.product": "Product",
  "footer.legal": "Legal",
  "footer.connect": "Connect",
  "footer.developer": "Developer",
  "footer.privacy": "Privacy Policy",
  "footer.terms": "Terms of Service",
  "footer.rights": "All rights reserved.",
  "footer.builtBy": "Built by Md. Fazley Rabbi",
  "footer.sourceCode": "Monitoring source",

  // ---- Auth -----------------------------------------------------------------
  "auth.login.title": "Sign In to Monitor",
  "auth.login.subtitle":
    "Access your prepaid meters, balance history and alerts.",
  "auth.register.title": "Create Your Account",
  "auth.register.subtitle":
    "Register to connect your DESCO meters and start monitoring.",
  "auth.forgot.title": "Reset Your Password",
  "auth.forgot.subtitle":
    "Enter your account email and we'll send you a reset link.",
  "auth.reset.title": "Set a New Password",
  "auth.reset.subtitle": "Choose a new password for your account.",
  "auth.email": "Account Email",
  "auth.password": "Password",
  "auth.newPassword": "New Password",
  "auth.confirmPassword": "Confirm Password",
  "auth.fullName": "Full Name",
  "auth.rememberMe": "Keep me signed in",
  "auth.forgotPassword": "Forgot Password?",
  "auth.signIn": "Sign In to Dashboard",
  "auth.signingIn": "Signing in…",
  "auth.createAccount": "Create Account",
  "auth.creatingAccount": "Creating account…",
  "auth.sendResetLink": "Send Reset Link",
  "auth.sending": "Sending…",
  "auth.updatePassword": "Update Password",
  "auth.updating": "Updating…",
  "auth.noAccount": "Don't have an account?",
  "auth.hasAccount": "Already have an account?",
  "auth.registerNow": "Register Account",
  "auth.backToLogin": "Back to sign in",
  "auth.showPassword": "Show password",
  "auth.hidePassword": "Hide password",
  "auth.loginSuccess": "Signed in successfully",
  "auth.registerSuccess": "Account created. Check your email to confirm.",
  "auth.registerSuccessNoConfirm": "Account created successfully",
  "auth.resetSent": "If that email is registered, a reset link has been sent.",
  "auth.passwordUpdated": "Password updated successfully",
  "auth.logoutSuccess": "Signed out",
  "auth.invalidCredentials": "Incorrect email or password",
  "auth.emailNotConfirmed":
    "Email not confirmed yet — check your inbox for the confirmation link, then sign in.",
  "error.networkUnreachable":
    "Cannot reach the auth server. Check your Supabase URL/keys and internet connection.",
  "auth.checkEmail": "Check your email",
  "auth.checkEmailDesc":
    "We've sent a password reset link. The link expires shortly for security.",
  "auth.confirmEmailDesc":
    "We've sent a confirmation link to your email. Click it, then sign in to your dashboard.",

  // ---- Validation -----------------------------------------------------------
  "validation.required": "This field is required",
  "validation.email": "Enter a valid email address",
  "validation.passwordMin": "Password must be at least 8 characters",
  "validation.passwordMatch": "Passwords do not match",
  "validation.nameMin": "Name must be at least 2 characters",
  "validation.nameMax": "Name must be under 80 characters",
  "validation.meterNameRequired": "Meter name is required",
  "validation.meterNumberFormat": "Meter number must be 4–32 digits",
  "validation.accountNumberFormat": "Account number must be 4–32 digits",
  "validation.thresholdRange": "Threshold must be between 0 and 100,000",
  "validation.thresholdOrder":
    "Critical threshold must be lower than the low threshold",
  "validation.invalidNumber": "Enter a valid number",

  // ---- Dashboard ------------------------------------------------------------
  "dash.title": "Dashboard",
  "dash.welcome": "Welcome back",
  "dash.overview": "Fleet overview across all your connected meters",
  "dash.totalMeters": "Total Meters",
  "dash.healthy": "Healthy",
  "dash.lowBalance": "Low Balance",
  "dash.critical": "Critical",
  "dash.totalBalance": "Combined Balance",
  "dash.connectedMeters": "Connected Meters",
  "dash.connectedMetersDesc":
    "Monitor balances, manage thresholds and check meters across all your properties",
  "dash.addMeter": "Add New Meter",
  "dash.viewAll": "View all meters",
  "dash.recentActivity": "Recent Activity",
  "dash.recentActivityDesc": "Latest balance readings across your fleet",
  "dash.needsAttention": "Needs Attention",

  // ---- Meters ---------------------------------------------------------------
  "meters.title": "My Meters",
  "meters.subtitle":
    "Monitor, manage thresholds, and check balances across all your meters",
  "meters.search": "Search by meter name or number…",
  "meters.filter": "Filter",
  "meters.all": "All",
  "meters.meterNumber": "Meter Number",
  "meters.accountNumber": "Account Number",
  "meters.prepaidBalance": "Prepaid Balance",
  "meters.balance": "Balance",
  "meters.threshold": "Low Threshold",
  "meters.criticalThreshold": "Critical Threshold",
  "meters.low": "Low",
  "meters.lastChecked": "Last checked",
  "meters.neverChecked": "Never checked",
  "meters.monitoring": "Monitoring",
  "meters.emailAlerts": "Email Alerts",
  "meters.enabled": "Enabled",
  "meters.disabled": "Disabled",
  "meters.tariffPlan": "Tariff Plan",
  "meters.sanctionedLoad": "Sanctioned Load",
  "meters.customerName": "Customer Name",
  "meters.installationAddress": "Installation Address",
  "meters.phaseType": "Phase Type",
  "meters.monthConsumption": "This Month's Consumption",
  "meters.readingTime": "DESCO Reading Time",
  "meters.view": "View",
  "meters.checkNow": "Check Now",
  "meters.checking": "Checking…",
  "meters.edit": "Edit",
  "meters.delete": "Delete",
  "meters.actions": "Actions",
  "meters.overview": "Overview",
  "meters.balanceHistory": "Balance History",
  "meters.alerts": "Alerts",
  "meters.settings": "Settings",
  "meters.backToMeters": "Back to meters",

  // ---- Meter forms ----------------------------------------------------------
  "meterForm.addTitle": "Add New Meter",
  "meterForm.addDesc":
    "Connect a DESCO prepaid meter to start monitoring its balance.",
  "meterForm.editTitle": "Edit Meter",
  "meterForm.editDesc": "Update this meter's details and alert thresholds.",
  "meterForm.name": "Meter Name",
  "meterForm.namePlaceholder": "e.g. Home Meter",
  "meterForm.nameHint": "A label to identify this meter in your dashboard",
  "meterForm.meterNumber": "Meter Number",
  "meterForm.meterNumberPlaceholder": "e.g. 066120003770",
  "meterForm.accountNumber": "Account Number",
  "meterForm.accountNumberPlaceholder": "e.g. 21000736",
  "meterForm.numbersHint":
    "Both numbers are printed on your DESCO prepaid meter and recharge receipts.",
  "meterForm.threshold": "Low Balance Threshold (৳)",
  "meterForm.thresholdHint": "Alert when the balance falls to or below this",
  "meterForm.criticalThreshold": "Critical Threshold (৳)",
  "meterForm.criticalHint": "Escalates to a critical alert. Must be lower.",
  "meterForm.monitoringEnabled": "Monitoring Enabled",
  "meterForm.monitoringHint": "Include this meter in scheduled balance checks",
  "meterForm.emailAlertEnabled": "Email Alerts Enabled",
  "meterForm.emailHint": "Send alert emails when thresholds are crossed",
  "meterForm.cancel": "Cancel",
  "meterForm.submit": "Add Meter",
  "meterForm.submitting": "Adding…",
  "meterForm.save": "Save Changes",
  "meterForm.saving": "Saving…",
  "meterForm.verifyHint":
    "We'll verify these numbers against DESCO before saving.",

  // ---- Meter actions / toasts -----------------------------------------------
  "meterToast.added": "Meter added successfully",
  "meterToast.updated": "Meter updated successfully",
  "meterToast.deleted": "Meter deleted successfully",
  "meterToast.balanceUpdated": "Balance updated successfully",
  "meterToast.checkFailed": "Unable to check meter",
  "meterToast.deleteTitle": "Delete this meter?",
  "meterToast.deleteDesc":
    "This will remove the meter and its entire balance history from your monitoring dashboard. This action cannot be undone.",
  "meterToast.deleteConfirm": "Delete Meter",
  "meterToast.duplicate": "You have already registered this meter number",
  "meterToast.notFound": "Meter not found",
  "meterToast.verifyFailed":
    "DESCO could not find this meter. Check the meter and account numbers.",

  // ---- Analytics ------------------------------------------------------------
  "analytics.title": "Consumption & Balance Analytics",
  "analytics.subtitle":
    "Balance trends, daily burn rate and recharge analytics from your recorded readings",
  "analytics.period7": "Past 7 Days",
  "analytics.period14": "Past 14 Days",
  "analytics.period30": "Past Month",
  "analytics.periodCustom": "Custom Range",
  "analytics.allMeters": "All Meters",
  "analytics.selectMeter": "Select meter",
  "analytics.avgDailyUsage": "Avg Daily Usage",
  "analytics.avgDailyUsageHint": "Mean burn per day",
  "analytics.highestUsage": "Highest Usage",
  "analytics.highestUsageHint": "Peak recorded day",
  "analytics.lowestUsage": "Lowest Usage",
  "analytics.lowestUsageHint": "Minimum recorded day",
  "analytics.recharges": "Recharges",
  "analytics.rechargesHint": "In selected period",
  "analytics.estRecharge": "Est. Depletion",
  "analytics.estRechargeHint": "Projected at current rate",
  "analytics.remainingDays": "Remaining Days",
  "analytics.remainingDaysHint": "Runway at current rate",
  "analytics.chart1": "Balance Trajectory",
  "analytics.chart1desc": "Recorded balance over time against your threshold",
  "analytics.chart2": "Daily Trend",
  "analytics.chart2desc": "Balance movement as a volume curve",
  "analytics.chart3": "Daily Burn Rate",
  "analytics.chart3desc": "Taka consumed per day, reported by DESCO",
  "analytics.chart4": "Weekly Comparison",
  "analytics.chart4desc": "Day-by-day consumption, this week vs last",
  "analytics.chart5": "Consumption Ratio",
  "analytics.chart5desc": "Share of consumption by day band",
  "analytics.chart6": "Balance Capacity",
  "analytics.chart6desc": "Current balance against your threshold",
  "analytics.chart7": "Activity Intensity",
  "analytics.chart7desc": "Relative consumption intensity by day",
  "analytics.thisWeek": "This Week",
  "analytics.lastWeek": "Last Week",
  "analytics.noData": "No balance history available yet.",
  "analytics.noDataDesc":
    "Charts will appear here once your meters have been checked at least twice.",
  "analytics.capacityLabel": "of threshold",
  "analytics.dataSource": "Consumption data from DESCO",

  // ---- Reports --------------------------------------------------------------
  "reports.title": "Reports",
  "reports.subtitle":
    "Export balance history, alert history and meter health records",
  "reports.type": "Report Type",
  "reports.balanceHistory": "Balance History",
  "reports.alertHistory": "Alert History",
  "reports.meterHealth": "Meter Health",
  "reports.dateRange": "Date Range",
  "reports.from": "From",
  "reports.to": "To",
  "reports.status": "Status",
  "reports.meter": "Meter",
  "reports.allStatuses": "All statuses",
  "reports.exportCsv": "Export CSV",
  "reports.exporting": "Exporting…",
  "reports.rows": "records",
  "reports.generated": "Report generated",
  "reports.exported": "Report exported successfully",
  "reports.noRecords": "No records match these filters",
  "reports.noRecordsDesc":
    "Try widening the date range or selecting a different meter.",
  "reports.colDate": "Date",
  "reports.colType": "Type",
  "reports.colConsumption": "Consumption",
  "reports.allMeters": "All meters",
  "reports.preview": "Preview",

  // ---- Notifications --------------------------------------------------------
  "notif.title": "Notifications",
  "notif.subtitle":
    "Balance alerts, threshold warnings and system updates",
  "notif.all": "All",
  "notif.unread": "Unread",
  "notif.lowBalance": "Low Balance",
  "notif.criticalBalance": "Critical",
  "notif.recovery": "Recovery",
  "notif.system": "System",
  "notif.monitoringError": "Monitoring Error",
  "notif.markRead": "Mark as read",
  "notif.markAllRead": "Mark all as read",
  "notif.markedRead": "Notification marked as read",
  "notif.allMarkedRead": "All notifications marked as read",
  "notif.empty": "No notifications yet.",
  "notif.emptyDesc":
    "You're all caught up. Alerts about your meters will appear here.",
  "notif.viewAll": "View all notifications",
  "notif.unreadCount": "unread",
  "notif.openNotifications": "Open notifications",

  // ---- Profile --------------------------------------------------------------
  "profile.title": "Profile",
  "profile.subtitle": "Manage your identity, contact details and password",
  "profile.accountDetails": "Account Details",
  "profile.fullName": "Full Name",
  "profile.email": "Email Address",
  "profile.emailLocked": "Email cannot be changed here",
  "profile.phone": "Contact Phone",
  "profile.address": "Address",
  "profile.designation": "Designation",
  "profile.memberSince": "Member since",
  "profile.linkedMeters": "Linked meters",
  "profile.role": "Role",
  "profile.saveChanges": "Save Changes",
  "profile.updated": "Profile updated successfully",
  "profile.security": "Password & Security",
  "profile.securityDesc": "Update your account password",
  "profile.currentPassword": "Current Password",
  "profile.changePassword": "Change Password",
  "profile.avatar": "Avatar",
  "profile.avatarHint": "Paste an image URL, or upload a photo",
  "profile.avatarUrl": "Avatar image URL",
  "profile.uploadPhoto": "Upload photo",
  "profile.uploading": "Uploading…",
  "profile.uploadSuccess": "Photo uploaded",
  "profile.uploadTypeError": "Use a JPG, PNG, or WebP image",
  "profile.uploadSizeError": "Image must be 5 MB or smaller",
  "profile.removePhoto": "Remove photo",

  // ---- Settings -------------------------------------------------------------
  "settings.title": "Settings",
  "settings.subtitle": "Appearance, language and notification preferences",
  "settings.appearance": "Appearance",
  "settings.appearanceDesc": "Choose how DESCO Smart looks on this device",
  "settings.theme": "Theme",
  "settings.themeLight": "Light",
  "settings.themeDark": "Dark",
  "settings.themeSystem": "System",
  "settings.language": "Language",
  "settings.languageDesc": "Interface language across the application",
  "settings.notifications": "Notification Preferences",
  "settings.notificationsDesc": "Choose which alerts you want to receive",
  "settings.emailAlerts": "Email alerts",
  "settings.emailAlertsDesc": "Master switch for all outgoing alert emails",
  "settings.lowBalanceAlerts": "Low balance alerts",
  "settings.lowBalanceAlertsDesc":
    "Notify when a meter falls to its low threshold",
  "settings.criticalAlerts": "Critical balance alerts",
  "settings.criticalAlertsDesc":
    "Notify when a meter falls to its critical threshold",
  "settings.recoveryAlerts": "Recovery alerts",
  "settings.recoveryAlertsDesc":
    "Notify when a meter recovers above its threshold",
  "settings.dailySummary": "Daily summary",
  "settings.dailySummaryDesc":
    "A once-daily digest of your fleet (requires the summary workflow)",
  "settings.security": "Security",
  "settings.securityDesc": "Session and account protection",
  "settings.monitoring": "Monitoring Preferences",
  "settings.monitoringDesc": "How your meters are checked",
  "settings.saved": "Settings saved",
  "settings.scheduleNote":
    "The monitoring schedule is controlled by the GitHub Actions workflow in the repository, not from this screen.",

  // ---- Admin ----------------------------------------------------------------
  "admin.badge": "Super Admin",
  "admin.title": "Executive Control",
  "admin.subtitle": "System-wide monitoring, governance and configuration",
  "admin.governance": "Executive Governance",
  "admin.administration": "Administration",
  "admin.superAdmin": "Super Admin",
  "admin.executiveControl": "Executive Control",
  "admin.fleetOverview": "Fleet Overview",
  "admin.reportsLedger": "Reports & Ledger",
  "admin.usersDirectory": "Users Directory",
  "admin.meterManagement": "Meter Management",
  "admin.auditLogs": "Audit Logs",
  "admin.adminGovernance": "Admin Governance",
  "admin.emailConfig": "Email Configuration",
  "admin.systemSettings": "System Settings",
  "admin.totalUsers": "Total Users",
  "admin.totalMeters": "Total Meters",
  "admin.activeMeters": "Active Meters",
  "admin.alertsToday": "Alerts Today",
  "admin.failedChecks": "Failed Checks",
  "admin.checksToday": "Checks Today",
  "admin.systemHealth": "System Health",
  "admin.backToUserDashboard": "User dashboard",

  "admin.users.title": "Users Directory",
  "admin.users.subtitle": "All registered accounts and their meter counts",
  "admin.users.search": "Search by name or email…",
  "admin.users.name": "Name",
  "admin.users.email": "Email",
  "admin.users.role": "Role",
  "admin.users.meters": "Meters",
  "admin.users.status": "Status",
  "admin.users.created": "Created",
  "admin.users.active": "Active",
  "admin.users.inactive": "Inactive",
  "admin.users.empty": "No users found",
  "admin.users.emptyDesc": "Registered accounts will be listed here.",
  "admin.users.promote": "Make Super Admin",
  "admin.users.demote": "Revoke Super Admin",
  "admin.users.roleUpdated": "User role updated",
  "admin.users.cannotDemoteSelf": "You cannot change your own role",
  "admin.users.you": "You",

  "admin.meters.title": "System-Wide Meter Management",
  "admin.meters.subtitle":
    "Operational view of meter telemetry, thresholds and sync health",
  "admin.meters.search": "Search by meter name, number or owner…",
  "admin.meters.details": "Meter Details",
  "admin.meters.owner": "Owner Account",
  "admin.meters.currentBalance": "Current Balance",
  "admin.meters.thresholds": "Thresholds (Low / Crit)",
  "admin.meters.lastSync": "Last Sync",
  "admin.meters.configured": "Meters Configured",
  "admin.meters.empty": "No meters registered",
  "admin.meters.emptyDesc":
    "Meters added by any user will appear here.",

  "admin.analytics.title": "System Analytics",
  "admin.analytics.subtitle":
    "Monitoring throughput, alert volume and fleet distribution",
  "admin.analytics.totalChecks": "Total Checks",
  "admin.analytics.successfulChecks": "Successful Checks",
  "admin.analytics.failedChecks": "Failed Checks",
  "admin.analytics.successRate": "Success Rate",
  "admin.analytics.lowAlerts": "Low Balance Alerts",
  "admin.analytics.criticalAlerts": "Critical Alerts",
  "admin.analytics.metersByStatus": "Meters by Status",
  "admin.analytics.checkVolume": "Check Volume (14 days)",
  "admin.analytics.alertVolume": "Alert Volume (14 days)",
  "admin.analytics.topUsers": "Most Active Accounts",

  "admin.audit.title": "Audit Logs",
  "admin.audit.subtitle": "Immutable record of security-relevant actions",
  "admin.audit.timestamp": "Timestamp",
  "admin.audit.user": "User",
  "admin.audit.action": "Action",
  "admin.audit.entity": "Entity",
  "admin.audit.result": "Result",
  "admin.audit.empty": "No audit entries yet",
  "admin.audit.emptyDesc":
    "Actions such as meter creation and balance checks will be recorded here.",

  "admin.email.title": "Email Gateway Configuration",
  "admin.email.subtitle":
    "Status of the SMTP relay used to dispatch alert emails",
  "admin.email.status": "Gateway Status",
  "admin.email.configured": "Configured",
  "admin.email.notConfigured": "Not Configured",
  "admin.email.host": "SMTP Host",
  "admin.email.port": "SMTP Port",
  "admin.email.sender": "Sender Address",
  "admin.email.senderName": "Sender Display Name",
  "admin.email.username": "SMTP Username",
  "admin.email.secretsNotice":
    "Credentials are read from server environment variables and are never transmitted to the browser. Passwords cannot be viewed or edited from this screen.",
  "admin.email.envNotice":
    "To change these values, update the environment variables in your deployment and in the repository's GitHub Actions secrets.",
  "admin.email.test": "Send Test Email",
  "admin.email.testing": "Sending…",
  "admin.email.testDesc":
    "Sends a verification email to your account address to confirm the relay works.",
  "admin.email.testSuccess": "Test email dispatched successfully",
  "admin.email.testFailed": "Test email failed",
  "admin.email.lastTest": "Last successful test",
  "admin.email.never": "Never tested",
  "admin.email.testNote":
    "Alert emails are dispatched using these active database SMTP credentials. Test here to verify your connection.",
  "admin.email.appPassword": "Email / App Password",
  "admin.email.appPasswordHint":
    "16-character Google App Password (e.g. abcd efgh ijkl mnop) generated in Google Account security.",
  "admin.email.settingsSaved": "SMTP credentials saved successfully",
  "admin.email.testSentSuccess": "Test email sent successfully!",
  "admin.email.secureSsl": "SSL Encryption (Port 465)",
  "admin.email.serviceEnabled": "Enable SMTP Gateway",
  "admin.email.saveBtn": "Save SMTP Settings",
  "admin.email.recipientEmail": "Recipient Email",
  "meterForm.alertEmail": "Alert Notification Email",
  "meterForm.alertEmailHint":
    "Defaults to your account email. You can change this to any email to receive low-balance notifications.",
  "meterForm.alertEmailPlaceholder": "e.g. family@example.com",
  "admin.users.addUser": "Add New User",
  "admin.users.editUser": "Edit User",
  "admin.users.deleteUser": "Delete User",
  "admin.users.blockUser": "Block User",
  "admin.users.unblockUser": "Unblock User",
  "admin.users.blocked": "Blocked",
  "admin.users.actions": "Actions",
  "admin.users.createdSuccess": "User created successfully",
  "admin.users.updatedSuccess": "User updated successfully",
  "admin.users.deletedSuccess": "User deleted successfully",
  "admin.users.cannotBlockSelf": "You cannot block yourself",
  "admin.users.cannotDeleteSelf": "You cannot delete yourself",
  "admin.users.admin": "Admin",

  "admin.settings.title": "Global System Parameters",
  "admin.settings.subtitle":
    "Defaults applied to new meters and system-wide behaviour",
  "admin.settings.defaults": "Default Pre-configuration for New Meters",
  "admin.settings.defaultLow": "Default Low Threshold (৳)",
  "admin.settings.defaultCritical": "Default Critical Threshold (৳)",
  "admin.settings.cooldown": "Alert Cooldown (hours)",
  "admin.settings.cooldownHint":
    "Minimum gap between repeat emails while a meter stays in the same state",
  "admin.settings.maintenance": "Maintenance Mode",
  "admin.settings.maintenanceHint":
    "Shows a maintenance advisory banner to non-admin users",
  "admin.settings.defaultLanguage": "Default Language",
  "admin.settings.defaultTheme": "Default Theme",
  "admin.settings.save": "Save Parameters",
  "admin.settings.saved": "System parameters saved",
  "admin.settings.schedule": "Monitoring Schedule",
  "admin.settings.scheduleValue": "Controlled by GitHub Actions",
  "admin.settings.scheduleNotice":
    "The polling cadence is defined by the cron expression in .github/workflows/desco-monitor.yml. Changing it requires editing that file — this screen does not alter the workflow schedule.",
  "admin.settings.storage": "Database",
  "admin.settings.gateway": "DESCO Gateway",

  "admin.governance.title": "Administrator Governance",
  "admin.governance.subtitle":
    "Manage administrative privileges across the platform",
  "admin.governance.currentAdmins": "Current Administrators",
  "admin.governance.adminOfficer": "Admin Officer",
  "admin.governance.designation": "Designation",
  "admin.governance.clearance": "Clearance Role",
  "admin.governance.noAdmins": "No additional administrators",
  "admin.governance.noAdminsDesc":
    "Promote a user from the Users Directory to grant Super Admin clearance.",
  "admin.governance.warning":
    "Super Admin clearance grants read access to every account's meters and system configuration. Grant it sparingly.",

  "admin.notif.title": "System Notifications",
  "admin.notif.subtitle": "Platform-wide alert and notification overview",
  "admin.notif.recent": "Recent System Alerts",

  "admin.reports.title": "Reports & Ledger",
  "admin.reports.subtitle":
    "System-level reporting across all accounts and meters",

  // ---- Status labels --------------------------------------------------------
  "status.healthy": "Healthy",
  "status.low": "Low Alert",
  "status.critical": "Critical",
  "status.checking": "Checking",
  "status.error": "Error",
  "status.disabled": "Disabled",
  "status.active": "Active",
  "status.sent": "Sent",
  "status.failed": "Failed",
  "status.pending": "Pending",
  "status.skipped": "Skipped",
  "status.success": "Success",

  // ---- Empty / error / loading ---------------------------------------------
  "empty.noMeters": "No meters connected yet",
  "empty.noMetersDesc":
    "Add your first DESCO meter to start monitoring your prepaid balance.",
  "empty.noResults": "No results found",
  "empty.noResultsDesc": "Try adjusting your search or filters.",
  "empty.noHistory": "No balance history yet",
  "empty.noHistoryDesc":
    "History appears here after this meter has been checked.",
  "empty.noAlerts": "No alerts yet",
  "empty.noAlertsDesc":
    "Alerts appear here when a balance crosses one of your thresholds.",
  "error.title": "Something went wrong",
  "error.generic": "An unexpected error occurred. Please try again.",
  "error.loadMeters": "Unable to load your meters.",
  "error.loadAnalytics": "Unable to load analytics data.",
  "error.tryAgain": "Try Again",
  "error.notFound": "Page not found",
  "error.notFoundDesc":
    "The page you're looking for doesn't exist or has moved.",
  "error.goHome": "Go to home",
  "error.goDashboard": "Go to dashboard",
  "error.unauthorized": "Access denied",
  "error.unauthorizedDesc":
    "You don't have permission to view this area. Super Admin clearance is required.",
  "error.sessionExpired": "Your session expired. Please sign in again.",
  "error.rateLimited": "Too many requests. Please wait a moment and try again.",
  "error.uploadFailed": "Image upload failed. Please try again.",
  "error.uploadNotConfigured":
    "Image uploads are not configured on the server.",
  "loading.default": "Loading…",

  // ---- Common ---------------------------------------------------------------
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.edit": "Edit",
  "common.close": "Close",
  "common.search": "Search",
  "common.filter": "Filter",
  "common.export": "Export",
  "common.refresh": "Refresh",
  "common.refreshing": "Refreshing…",
  "common.previous": "Previous",
  "common.next": "Next",
  "common.page": "Page",
  "common.of": "of",
  "common.showing": "Showing",
  "common.results": "results",
  "common.language": "Language",
  "common.theme": "Theme",
  "common.toggleTheme": "Toggle theme",
  "common.selectLanguage": "Select language",
  "common.optional": "optional",
  "common.required": "required",
  "common.never": "Never",
  "common.today": "Today",
  "common.yes": "Yes",
  "common.no": "No",
  "common.learnMore": "Learn more",
  "common.getStarted": "Get Started",
  "common.comingSoon": "Coming soon",
  "common.notConfigured": "Not configured",
  "common.viewDetails": "View details",

  // ---- About / contact ------------------------------------------------------
  "about.title": "About DESCO Smart",
  "about.subtitle":
    "Automated prepaid electricity monitoring for DESCO customers in Dhaka.",
  "about.missionTitle": "Why this exists",
  "about.missionBody":
    "DESCO prepaid customers lose power when their balance silently reaches zero — often at night or during a holiday when recharging is inconvenient. DESCO Smart watches your balance continuously and warns you while there is still time to act.",
  "about.originTitle": "From a script to a platform",
  "about.originBody":
    "This project began as a single Python script that checked one meter and emailed a warning. It has been rebuilt as a multi-user platform with per-user meter isolation, stored history, analytics and an administration console — while keeping the same proven balance-checking logic at its core.",
  "about.stackTitle": "How it is built",
  "about.stackBody":
    "A Next.js application handles the interface and server actions, Supabase provides authentication and a PostgreSQL database with row-level security, and a scheduled Python worker on GitHub Actions polls the DESCO API and dispatches alerts.",
  "about.openSource": "View the monitoring source",
  "contact.title": "Contact",
  "contact.subtitle":
    "Questions about DESCO Smart, or want to report an issue?",
  "contact.developerTitle": "Developer",
  "contact.developerRole": "Full-stack developer",
  "contact.connectTitle": "Connect",
  "contact.connectDesc":
    "The fastest way to reach the developer is through any of these profiles.",
  "contact.issueTitle": "Report an issue",
  "contact.issueDesc":
    "Bug reports and feature requests are best raised on the project repository.",
  "contact.openRepo": "Open repository",
  "contact.descoTitle": "DESCO customer support",
  "contact.descoDesc":
    "For billing, metering or connection issues, contact DESCO directly — this is an independent monitoring tool, not an official DESCO service.",

  // ---- Legal ----------------------------------------------------------------
  "legal.privacyTitle": "Privacy Policy",
  "legal.termsTitle": "Terms of Service",
  "legal.lastUpdated": "Last updated",
  "legal.projectNotice":
    "DESCO Smart is an independent project and is not affiliated with, endorsed by, or operated by Dhaka Electric Supply Company Limited. This document describes the practices of this application only.",
  "legal.privacyIntro":
    "This Privacy Policy explains what information DESCO Smart collects, why it is collected, and how it is protected. By creating an account you agree to the practices described here.",
  "legal.privacy.collectTitle": "Information we collect",
  "legal.privacy.collectBody":
    "We collect the email address and password you register with (passwords are hashed and managed by our authentication provider — we never see or store them in plain text), the meter details you add (meter name, meter number and account number), the low-balance thresholds you configure, your notification and appearance preferences, and the balance readings retrieved from the DESCO service for the meters you monitor.",
  "legal.privacy.useTitle": "How we use your information",
  "legal.privacy.useBody":
    "Your information is used only to operate the service: to authenticate you, to check the balance of the meters you added on a schedule, to send you low-balance and recovery alerts, and to render your dashboard, analytics and history. We do not sell your data and we do not use it for advertising.",
  "legal.privacy.storageTitle": "Data storage and security",
  "legal.privacy.storageBody":
    "Data is stored in a PostgreSQL database managed by Supabase. Row Level Security is enforced at the database layer so that every row is scoped to its owner — one account can never read another account's meters, readings or alerts. All secrets (service keys, SMTP credentials and DESCO credentials) are held in server-side environment variables and are never exposed to the browser.",
  "legal.privacy.thirdPartyTitle": "Third-party services",
  "legal.privacy.thirdPartyBody":
    "The service relies on Supabase for authentication and database hosting, the DESCO balance service to retrieve meter readings, an SMTP email provider to deliver alerts, and GitHub Actions to run the scheduled balance checks. Each provider processes only the data required for its function.",
  "legal.privacy.rightsTitle": "Your rights",
  "legal.privacy.rightsBody":
    "You can view and edit your meters and preferences at any time from your dashboard, delete individual meters, or delete your account entirely. Deleting a meter or your account removes the associated readings and alerts from the database.",
  "legal.privacy.retentionTitle": "Data retention",
  "legal.privacy.retentionBody":
    "Balance readings and alert history are retained while the corresponding meter exists so that trends and analytics remain meaningful. When you delete a meter or your account, the related data is removed.",
  "legal.privacy.changesTitle": "Changes to this policy",
  "legal.privacy.changesBody":
    "This policy may be updated as the service evolves. Material changes will be reflected here with an updated revision date. Continued use of the service after an update constitutes acceptance of the revised policy.",
  "legal.termsIntro":
    "These Terms of Service govern your use of DESCO Smart. Please read them carefully before creating an account or monitoring a meter.",
  "legal.terms.acceptTitle": "Acceptance of terms",
  "legal.terms.acceptBody":
    "By creating an account and using DESCO Smart you agree to these Terms of Service. If you do not agree, please do not use the service.",
  "legal.terms.serviceTitle": "Description of the service",
  "legal.terms.serviceBody":
    "DESCO Smart is an independent tool that monitors DESCO prepaid electricity balances for meters you add and sends automated low-balance alerts. It is a convenience layer over publicly available balance information and does not process payments or recharges.",
  "legal.terms.accountTitle": "Accounts and responsibilities",
  "legal.terms.accountBody":
    "You are responsible for maintaining the confidentiality of your credentials and for the accuracy of the meter and account numbers you enter. You must have a legitimate interest in any meter you add for monitoring.",
  "legal.terms.useTitle": "Acceptable use",
  "legal.terms.useBody":
    "You agree not to misuse the service, attempt to access other users' data, overload the scheduled checks, or use the service to monitor meters you are not authorised to observe.",
  "legal.terms.accuracyTitle": "Accuracy and availability",
  "legal.terms.accuracyBody":
    "Balance data is retrieved from the DESCO service and is provided on an \"as is\" basis. Readings may be delayed, unavailable, or inaccurate if the upstream service changes or is down. Alerts are best-effort and should not be relied upon as the sole safeguard against disconnection.",
  "legal.terms.liabilityTitle": "Limitation of liability",
  "legal.terms.liabilityBody":
    "To the maximum extent permitted by law, the developer is not liable for any loss, disconnection, or damages arising from missed alerts, inaccurate balance data, or service downtime. The service is provided without warranty of any kind.",
  "legal.terms.thirdPartyTitle": "Third-party and DESCO relationship",
  "legal.terms.thirdPartyBody":
    "For all billing, metering, recharge and connection matters you must contact DESCO directly. DESCO Smart is not a substitute for official DESCO services and cannot resolve account issues on your behalf.",
  "legal.terms.changesTitle": "Changes to these terms",
  "legal.terms.changesBody":
    "These terms may be revised over time. The current version, with its revision date, always governs your use of the service. Continued use after changes indicates acceptance.",

  // ---- Maintenance ----------------------------------------------------------
  "maintenance.banner":
    "Scheduled maintenance is in progress. Some monitoring features may be temporarily unavailable.",
} as const;

export type TranslationKey = keyof typeof en;

/** Bangla dictionary — typed against `en` so no key can be omitted. */
export const bn: Record<TranslationKey, string> = {
  "app.name": "ডেসকো স্মার্ট",
  "app.tagline": "প্রিপেইড ব্যালেন্স মনিটর",
  "app.description":
    "ডেসকো প্রিপেইড বিদ্যুৎ ব্যালেন্স পর্যবেক্ষণ করুন, একাধিক মিটার পরিচালনা করুন এবং স্বয়ংক্রিয় লো-ব্যালেন্স সতর্কতা পান।",

  "nav.home": "হোম",
  "nav.about": "পরিচিতি",
  "nav.features": "ফিচার",
  "nav.aiForecaster": "এআই পূর্বাভাস",
  "nav.reviews": "গ্রাহক রিভিউ",
  "nav.faq": "সাধারণ প্রশ্ন",
  "nav.contact": "যোগাযোগ",
  "nav.signIn": "সাইন ইন",
  "nav.registerMeter": "মিটার নিবন্ধন",
  "nav.dashboard": "ড্যাশবোর্ড",
  "nav.myMeters": "আমার মিটার",
  "nav.analytics": "অ্যানালিটিক্স",
  "nav.reports": "রিপোর্ট",
  "nav.notifications": "নোটিফিকেশন",
  "nav.profile": "প্রোফাইল",
  "nav.settings": "সেটিংস",
  "nav.logout": "লগ আউট",
  "nav.openMenu": "মেনু খুলুন",
  "nav.closeMenu": "মেনু বন্ধ করুন",
  "nav.main": "প্রধান",
  "nav.account": "অ্যাকাউন্ট",
  "nav.toggleSidebar": "সাইডবার টগল করুন",

  "hero.badge": "ডেসকো প্রিপেইড মিটার মনিটরিং",
  "hero.title1": "অন্ধকারে আর",
  "hero.title2": "বিদ্যুৎ যাবে না।",
  "hero.subtitle":
    "ডেসকো স্মার্ট আপনাকে প্রিপেইড বিদ্যুৎ ব্যালেন্স পর্যবেক্ষণ, একাধিক মিটার পরিচালনা, ব্যালেন্স ইতিহাস সংরক্ষণ এবং স্বয়ংক্রিয় লো-ব্যালেন্স সতর্কতা পেতে সাহায্য করে।",
  "hero.ctaPrimary": "মিটার নিবন্ধন করুন",
  "hero.ctaSecondary": "ড্যাশবোর্ডে সাইন ইন",
  "hero.point1": "একাধিক মিটার মনিটরিং",
  "hero.point2": "স্বয়ংক্রিয় ব্যালেন্স সতর্কতা",
  "hero.point3": "ব্যালেন্স ইতিহাস",
  "hero.point4": "নিরাপদ অ্যাকাউন্ট",
  "hero.point5": "কোনো হার্ডওয়্যার লাগবে না",
  "hero.previewTitle": "সুরক্ষা যেভাবে কাজ করে",
  "hero.previewEmpty": "গোপনীয়তা সুরক্ষিত",
  "hero.previewHint":
    "ব্যালেন্স ব্যক্তিগত — নিজের মিটার দেখতে সাইন ইন করুন। লগইন ছাড়া এখানে কিছুই দেখানো হয় না।",
  "hero.previewCta": "মিটার সংযুক্ত করুন",
  "hero.cardStep1Title": "১. মিটার যোগ করুন",
  "hero.cardStep1Desc": "বাসা, অফিস, দোকান — এক অ্যাকাউন্টে সীমাহীন মিটার।",
  "hero.cardStep2Title": "২. সীমা নির্ধারণ করুন",
  "hero.cardStep2Desc": "প্রতি মিটারে টাকায় লো + ক্রিটিক্যাল সীমা।",
  "hero.cardStep3Title": "৩. ইমেইল পান",
  "hero.cardStep3Desc": "বিদ্যুৎ বন্ধের আগেই আপনার ঠিকানায় স্বয়ংক্রিয় ইমেইল।",

  "how.eyebrow": "যেভাবে কাজ করে",
  "how.title": "চারটি ধাপে মনিটরিং",
  "how.subtitle":
    "নিবন্ধন থেকে প্রথম স্বয়ংক্রিয় সতর্কতা পর্যন্ত — কোনো হার্ডওয়্যার বা ম্যানুয়াল চেক ছাড়াই।",
  "how.step1.title": "অ্যাকাউন্ট তৈরি করুন",
  "how.step1.desc":
    "ইমেইল দিয়ে কয়েক সেকেন্ডে নিবন্ধন করুন। প্রথম অনুরোধ থেকেই আপনার তথ্য আলাদা রাখা হয়।",
  "how.step2.title": "ডেসকো মিটার যুক্ত করুন",
  "how.step2.desc":
    "মিটার ও অ্যাকাউন্ট নম্বর দিন। বাসা, অফিস বা দোকান — যত খুশি মিটার যোগ করুন।",
  "how.step3.title": "ব্যালেন্স সীমা নির্ধারণ",
  "how.step3.desc":
    "প্রতিটি মিটারের জন্য আলাদাভাবে লো ও ক্রিটিক্যাল ব্যালেন্স সীমা নির্বাচন করুন।",
  "how.step4.title": "স্বয়ংক্রিয় সতর্কতা পান",
  "how.step4.desc":
    "নির্ধারিত সময়ে একটি ওয়ার্কার সব সক্রিয় মিটার পরীক্ষা করে এবং বিদ্যুৎ শেষ হওয়ার আগেই ইমেইল পাঠায়।",

  "features.eyebrow": "ফিচারসমূহ",
  "features.title": "নিরবচ্ছিন্ন বিদ্যুতের জন্য যা যা দরকার",
  "features.subtitle":
    "প্রকৃত ডেসকো প্রিপেইড এপিআই-এর উপর নির্মিত — কোনো নকল ডেটা নয়।",
  "features.multiMeter.title": "একাধিক মিটার মনিটরিং",
  "features.multiMeter.desc":
    "একটি ড্যাশবোর্ড থেকে সীমাহীন ডেসকো প্রিপেইড মিটার পর্যবেক্ষণ করুন, প্রতিটির আলাদা সেটিংস সহ।",
  "features.alerts.title": "লো ব্যালেন্স সতর্কতা",
  "features.alerts.desc":
    "প্রতি মিটারে আলাদা লো ও ক্রিটিক্যাল সীমা ব্যালেন্স শেষ হওয়ার আগেই সতর্ক করে।",
  "features.automated.title": "স্বয়ংক্রিয় পরীক্ষা",
  "features.automated.desc":
    "গিটহাব অ্যাকশনসের একটি নির্ধারিত ওয়ার্কার একটিমাত্র সময়সূচিতে সব সক্রিয় মিটার পরীক্ষা করে।",
  "features.history.title": "ব্যালেন্স ইতিহাস",
  "features.history.desc":
    "প্রতিটি রিডিং অপরিবর্তনীয় টাইম-সিরিজ হিসেবে সংরক্ষিত হয়, যা চার্ট ও এক্সপোর্ট করা যায়।",
  "features.analytics.title": "অ্যানালিটিক্স",
  "features.analytics.desc":
    "আপনার প্রকৃত ব্যবহারের তথ্য থেকে দৈনিক খরচ, প্রবণতা ও অবশিষ্ট দিনের হিসাব।",
  "features.email.title": "ইমেইল নোটিফিকেশন",
  "features.email.desc":
    "আপনার নিজস্ব এসএমটিপি ক্রেডেনশিয়াল ব্যবহার করে পেশাদার এইচটিএমএল সতর্কতা ইমেইল।",
  "features.bilingual.title": "English + বাংলা",
  "features.bilingual.desc":
    "ভ্যালিডেশন বার্তাসহ সম্পূর্ণ ইন্টারফেস দুই ভাষাতেই উপলব্ধ।",
  "features.theme.title": "ডার্ক + লাইট মোড",
  "features.theme.desc":
    "ডিফল্ট হিসেবে সুচিন্তিত ডার্ক থিম, সঙ্গে সমান পরিপাটি লাইট থিম।",
  "features.secure.title": "নিরাপদ অ্যাকাউন্ট",
  "features.secure.desc":
    "ডেটাবেস-স্তরের নিরাপত্তার কারণে আপনার মিটার অন্য কোনো অ্যাকাউন্ট থেকে দেখা যায় না।",

  "multi.eyebrow": "একাধিক মিটার",
  "multi.title": "একটি ড্যাশবোর্ড থেকেই সব মিটার পরিচালনা করুন।",
  "multi.subtitle":
    "বাসা, অফিস, দোকান বা অ্যাপার্টমেন্ট — প্রতিটি মিটারের নিজস্ব সীমা, ইতিহাস ও সতর্কতা সেটিংস থাকে এবং মনিটরিং ওয়ার্কার প্রতিটিকে আলাদাভাবে প্রক্রিয়া করে।",
  "multi.illustrative": "উদাহরণস্বরূপ — প্রকৃত অ্যাকাউন্টের তথ্য নয়",
  "multi.home": "বাসার মিটার",
  "multi.office": "অফিসের মিটার",
  "multi.shop": "দোকানের মিটার",
  "multi.point1": "প্রতিটি মিটারের জন্য আলাদা সীমা",
  "multi.point2": "পৃথক ব্যালেন্স ইতিহাস ও অ্যানালিটিক্স",
  "multi.point3": "শুধু মালিকই তার মিটারের ইমেইল পান",

  "alertsec.eyebrow": "সতর্কতা",
  "alertsec.title": "বাতি নেভার আগেই জেনে নিন।",
  "alertsec.subtitle":
    "প্রতিটি মিটারের জন্য লো-ব্যালেন্স সীমা নির্ধারণ করুন। সীমা অতিক্রম করলে ঠিক যা ঘটে।",
  "alertsec.step1": "ব্যালেন্স আপনার নির্ধারিত সীমার নিচে নামে",
  "alertsec.step2": "পরবর্তী রানে মনিটরিং ওয়ার্কার তা শনাক্ত করে",
  "alertsec.step3": "ওই মিটারের জন্য একটি অ্যালার্ট রেকর্ড তৈরি হয়",
  "alertsec.step4": "মালিকের কাছে ইমেইল নোটিফিকেশন পাঠানো হয়",
  "alertsec.dedupeTitle": "একই বার্তার পুনরাবৃত্তি নেই",
  "alertsec.dedupeDesc":
    "একটি মিটার একই অবস্থায় থাকলে নির্ধারিত কুলডাউন সময়ে সর্বোচ্চ একবার জানানো হয়। অবস্থার পরিবর্তন বা পুনরুদ্ধার হলে সঙ্গে সঙ্গে জানানো হয়।",

  "analyticsec.eyebrow": "অ্যানালিটিক্স",
  "analyticsec.title": "আপনার প্রকৃত ব্যবহার বুঝুন।",
  "analyticsec.subtitle":
    "ব্যালেন্স ইতিহাস, দৈনিক খরচ, আনুমানিক অবশিষ্ট দিন ও রিচার্জ ইতিহাস — আপনার নিজের রিডিং থেকে তৈরি।",
  "analyticsec.illustrative":
    "উদাহরণস্বরূপ প্রিভিউ — আপনার ড্যাশবোর্ড আপনার নিজের তথ্য দেখাবে",
  "analyticsec.item1": "সীমার বিপরীতে ব্যালেন্সের গতিপথ",
  "analyticsec.item2": "দৈনিক খরচ ও ব্যয়ের হার",
  "analyticsec.item3": "আনুমানিক অবশিষ্ট দিন",
  "analyticsec.item4": "ডেসকো থেকে রিচার্জ ইতিহাস",

  "ai.eyebrow": "এআই পূর্বাভাস",
  "ai.title": "আপনার নিজের রিডিং থেকেই পূর্বাভাস।",
  "ai.subtitle":
    "পূর্বাভাসটি আপনার সাম্প্রতিক ব্যালেন্স ইতিহাসের উপর একটি স্বচ্ছ পরিসংখ্যানগত মডেল — কোনো ব্ল্যাক বক্স নয়।",
  "ai.metric1": "গড় দৈনিক ব্যবহার",
  "ai.metric1desc":
    "সংরক্ষিত রিডিং থেকে নির্বাচিত সময়ে দৈনিক গড় খরচ (টাকায়)।",
  "ai.metric2": "আনুমানিক অবশিষ্ট দিন",
  "ai.metric2desc": "বর্তমান ব্যালেন্সকে গড় দৈনিক খরচ দিয়ে ভাগ করে নির্ণীত।",
  "ai.metric3": "সম্ভাব্য শেষ হওয়ার তারিখ",
  "ai.metric3desc":
    "বর্তমান হারে চলতে থাকলে যে তারিখে ব্যালেন্স শূন্য হবে বলে ধারণা করা হয়।",
  "ai.metric4": "রিচার্জ সুপারিশ",
  "ai.metric4desc":
    "পরবর্তী চক্রে সীমার উপরে থাকতে প্রস্তাবিত রিচার্জের পরিমাণ।",
  "ai.honesty":
    "পূর্বাভাস ঐতিহাসিক গড়ের ভিত্তিতে করা অনুমান। এটি ব্যবহারের হঠাৎ পরিবর্তন, ট্যারিফ সংশোধন বা ডেসকো-প্রান্তের সমন্বয় হিসাব করতে পারে না এবং পর্যাপ্ত রিডিং জমা হলেই কেবল দেখানো হয়।",

  "security.eyebrow": "নিরাপত্তা",
  "security.title": "আপনার মিটারের তথ্য আপনারই থাকে।",
  "security.subtitle":
    "এই অ্যাপ্লিকেশনে প্রকৃতপক্ষে বাস্তবায়িত নিরাপত্তা ব্যবস্থাগুলো।",
  "security.item1.title": "নিরাপদ প্রমাণীকরণ",
  "security.item1.desc":
    "প্রতিটি সার্ভার অনুরোধে সুপাবেস অথ সেশন যাচাই করে।",
  "security.item2.title": "ডেটাবেস-স্তরের অ্যাক্সেস নিয়ন্ত্রণ",
  "security.item2.desc":
    "পোস্টগ্রেএসকিউএল রো লেভেল সিকিউরিটি প্রতিটি টেবিল সুরক্ষিত রাখে, শুধু ইউআই নয়।",
  "security.item3.title": "ব্যবহারকারী-ভিত্তিক মিটার পৃথকীকরণ",
  "security.item3.desc":
    "মালিকানা এসকিউএল স্তরে নিশ্চিত হয়, তাই এক অ্যাকাউন্ট অন্যের মিটার দেখতে পারে না।",
  "security.item4.title": "সুরক্ষিত সার্ভার অপারেশন",
  "security.item4.desc":
    "সব পরিবর্তন সার্ভার অ্যাকশনে চলে, যা সেশন থেকে পরিচয় পুনরায় যাচাই করে।",
  "security.item5.title": "এনভায়রনমেন্ট ভেরিয়েবলে গোপন তথ্য",
  "security.item5.desc":
    "এসএমটিপি ও সার্ভিস-রোল ক্রেডেনশিয়াল এনভায়রনমেন্ট ভেরিয়েবলে থাকে, ব্রাউজারে যায় না।",
  "security.item6.title": "অপরিবর্তনীয় অডিট ট্রেইল",
  "security.item6.desc":
    "সংবেদনশীল কার্যক্রম সার্ভারে রেকর্ড হয় এবং ক্লায়েন্ট থেকে পরিবর্তন করা যায় না।",

  "reviews.eyebrow": "গ্রাহক রিভিউ",
  "reviews.title": "ব্যবহারকারীরা যা বলেন",
  "reviews.subtitle": "প্রকৃত ডেসকো স্মার্ট অ্যাকাউন্ট থেকে যাচাইকৃত রিভিউ।",
  "reviews.emptyTitle": "এখনো কোনো রিভিউ প্রকাশিত হয়নি",
  "reviews.emptyDesc":
    "এই অংশটি প্রস্তুত রয়েছে এবং রিভিউ জমা পড়লে সেগুলো এখানে দেখানো হবে। আমরা বানানো প্রশংসাপত্র প্রদর্শন করি না।",

  "faq.eyebrow": "সাধারণ প্রশ্ন",
  "faq.title": "প্রায়শই জিজ্ঞাসিত প্রশ্ন",
  "faq.subtitle": "ডেসকো স্মার্ট কীভাবে আপনার মিটার পর্যবেক্ষণ করে।",
  "faq.q1": "ডেসকো স্মার্ট কী?",
  "faq.a1":
    "ডেসকো স্মার্ট হলো ডেসকো বিদ্যুৎ মিটারের জন্য একটি প্রিপেইড ব্যালেন্স মনিটরিং ড্যাশবোর্ড। এটি সময়ের সাথে আপনার ব্যালেন্স সংরক্ষণ করে, খরচের চার্ট তৈরি করে এবং কোনো মিটার নির্ধারিত সীমার নিচে নামলে ইমেইল পাঠায়।",
  "faq.q2": "আমি কি একাধিক মিটার পর্যবেক্ষণ করতে পারি?",
  "faq.a2":
    "হ্যাঁ। একটি অ্যাকাউন্টে সীমাহীন মিটার নিবন্ধন করা যায় — বাসা, অফিস, দোকান বা অ্যাপার্টমেন্ট। প্রতিটির নিজস্ব নাম, সীমা, ইতিহাস ও সতর্কতা সেটিংস থাকে এবং আলাদাভাবে পরীক্ষা করা হয়।",
  "faq.q3": "ব্যালেন্স সতর্কতা কীভাবে কাজ করে?",
  "faq.a3":
    "একটি নির্ধারিত ওয়ার্কার প্রতিটি সক্রিয় মিটারের ব্যালেন্স পড়ে। ব্যালেন্স আপনার লো সীমায় বা তার নিচে নামলে একটি অ্যালার্ট তৈরি হয় এবং ওই মিটারে ইমেইল সতর্কতা চালু থাকলে মালিকের কাছে ইমেইল পাঠানো হয়।",
  "faq.q4": "বিভিন্ন মিটারের জন্য কি আলাদা সীমা দেওয়া যায়?",
  "faq.a4":
    "হ্যাঁ। লো সীমা ও ক্রিটিক্যাল সীমা উভয়ই প্রতিটি মিটারের জন্য আলাদাভাবে নির্ধারণ করা যায়, তাই ছোট ফ্ল্যাট ও বাণিজ্যিক ইউনিট উপযুক্ত মান ব্যবহার করতে পারে।",
  "faq.q5": "আমি কি ইমেইল সতর্কতা পেতে পারি?",
  "faq.a5":
    "হ্যাঁ, যদি ডিপ্লয়মেন্ট এনভায়রনমেন্টে এসএমটিপি ক্রেডেনশিয়াল কনফিগার করা থাকে। ইমেইল সার্ভার-সাইড ওয়ার্কার থেকে পাঠানো হয় — কখনোই আপনার ব্রাউজার থেকে নয়।",
  "faq.q6": "আমার মিটার কত ঘন ঘন পরীক্ষা করা হয়?",
  "faq.a6":
    "গিটহাব অ্যাকশনস ওয়ার্কফ্লোতে নির্ধারিত সময়সূচি অনুযায়ী, যেখানে একটি জব সব সক্রিয় মিটার প্রক্রিয়া করে। এছাড়া “এখনই পরীক্ষা করুন” বোতাম দিয়ে যেকোনো সময় তাৎক্ষণিক পরীক্ষা করা যায়।",
  "faq.q7": "আমি কি বাংলা ব্যবহার করতে পারি?",
  "faq.a7":
    "হ্যাঁ। নেভিগেশন, ড্যাশবোর্ড ও ফর্ম ভ্যালিডেশন বার্তাসহ সম্পূর্ণ ইন্টারফেস ইংরেজি ও বাংলায় পাওয়া যায় এবং আপনার পছন্দ সংরক্ষিত থাকে।",
  "faq.q8": "আমার মিটারের তথ্য কি নিরাপদ?",
  "faq.a8":
    "আপনার মিটার পোস্টগ্রেএসকিউএল রো লেভেল সিকিউরিটি দ্বারা সুরক্ষিত, তাই ডেটাবেস নিজেই অন্য অ্যাকাউন্টের তথ্য ফেরত দিতে অস্বীকার করে। ক্রেডেনশিয়াল এনভায়রনমেন্ট ভেরিয়েবলে থাকে এবং ব্রাউজারে প্রকাশ করা হয় না।",

  "cta.title": "প্রিপেইড ব্যালেন্সে সবসময় এগিয়ে থাকুন।",
  "cta.subtitle":
    "আপনার ডেসকো মিটার নিবন্ধন করুন এবং মনিটরকে দায়িত্ব দিন।",
  "footer.description":
    "একাধিক মিটার, অ্যানালিটিক্স ও লো-ব্যালেন্স সতর্কতাসহ স্বয়ংক্রিয় ডেসকো প্রিপেইড বিদ্যুৎ ব্যালেন্স মনিটরিং।",
  "footer.quickLinks": "দ্রুত লিঙ্ক",
  "footer.product": "প্রোডাক্ট",
  "footer.legal": "আইনগত",
  "footer.connect": "সংযোগ",
  "footer.developer": "ডেভেলপার",
  "footer.privacy": "গোপনীয়তা নীতি",
  "footer.terms": "সেবার শর্তাবলী",
  "footer.rights": "সর্বস্বত্ব সংরক্ষিত।",
  "footer.builtBy": "নির্মাতা মোঃ ফজলে রাব্বি",
  "footer.sourceCode": "মনিটরিং সোর্স",

  "auth.login.title": "মনিটরে সাইন ইন",
  "auth.login.subtitle":
    "আপনার প্রিপেইড মিটার, ব্যালেন্স ইতিহাস ও সতর্কতা দেখুন।",
  "auth.register.title": "অ্যাকাউন্ট তৈরি করুন",
  "auth.register.subtitle":
    "ডেসকো মিটার সংযুক্ত করে মনিটরিং শুরু করতে নিবন্ধন করুন।",
  "auth.forgot.title": "পাসওয়ার্ড রিসেট করুন",
  "auth.forgot.subtitle":
    "আপনার অ্যাকাউন্টের ইমেইল দিন, আমরা রিসেট লিঙ্ক পাঠাব।",
  "auth.reset.title": "নতুন পাসওয়ার্ড দিন",
  "auth.reset.subtitle": "আপনার অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড নির্বাচন করুন।",
  "auth.email": "অ্যাকাউন্ট ইমেইল",
  "auth.password": "পাসওয়ার্ড",
  "auth.newPassword": "নতুন পাসওয়ার্ড",
  "auth.confirmPassword": "পাসওয়ার্ড নিশ্চিত করুন",
  "auth.fullName": "পূর্ণ নাম",
  "auth.rememberMe": "আমাকে সাইন ইন রাখুন",
  "auth.forgotPassword": "পাসওয়ার্ড ভুলে গেছেন?",
  "auth.signIn": "ড্যাশবোর্ডে সাইন ইন",
  "auth.signingIn": "সাইন ইন হচ্ছে…",
  "auth.createAccount": "অ্যাকাউন্ট তৈরি করুন",
  "auth.creatingAccount": "অ্যাকাউন্ট তৈরি হচ্ছে…",
  "auth.sendResetLink": "রিসেট লিঙ্ক পাঠান",
  "auth.sending": "পাঠানো হচ্ছে…",
  "auth.updatePassword": "পাসওয়ার্ড হালনাগাদ",
  "auth.updating": "হালনাগাদ হচ্ছে…",
  "auth.noAccount": "অ্যাকাউন্ট নেই?",
  "auth.hasAccount": "ইতিমধ্যে অ্যাকাউন্ট আছে?",
  "auth.registerNow": "অ্যাকাউন্ট নিবন্ধন",
  "auth.backToLogin": "সাইন ইনে ফিরুন",
  "auth.showPassword": "পাসওয়ার্ড দেখান",
  "auth.hidePassword": "পাসওয়ার্ড লুকান",
  "auth.loginSuccess": "সফলভাবে সাইন ইন হয়েছে",
  "auth.registerSuccess":
    "অ্যাকাউন্ট তৈরি হয়েছে। নিশ্চিত করতে ইমেইল দেখুন।",
  "auth.registerSuccessNoConfirm": "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে",
  "auth.resetSent":
    "ইমেইলটি নিবন্ধিত থাকলে একটি রিসেট লিঙ্ক পাঠানো হয়েছে।",
  "auth.passwordUpdated": "পাসওয়ার্ড সফলভাবে হালনাগাদ হয়েছে",
  "auth.logoutSuccess": "সাইন আউট হয়েছে",
  "auth.invalidCredentials": "ইমেইল বা পাসওয়ার্ড সঠিক নয়",
  "auth.emailNotConfirmed":
    "ইমেইল এখনো নিশ্চিত হয়নি — ইনবক্সে নিশ্চিতকরণ লিঙ্ক দেখুন, তারপর সাইন ইন করুন।",
  "error.networkUnreachable":
    "অথ সার্ভারে পৌঁছানো যাচ্ছে না। Supabase URL/keys ও ইন্টারনেট সংযোগ দেখুন।",
  "auth.checkEmail": "ইমেইল দেখুন",
  "auth.checkEmailDesc":
    "আমরা একটি পাসওয়ার্ড রিসেট লিঙ্ক পাঠিয়েছি। নিরাপত্তার জন্য লিঙ্কটির মেয়াদ স্বল্প।",
  "auth.confirmEmailDesc":
    "আপনার ইমেইলে একটি নিশ্চিতকরণ লিঙ্ক পাঠিয়েছি। লিঙ্কে ক্লিক করে তারপর ড্যাশবোর্ডে সাইন ইন করুন।",

  "validation.required": "এই ঘরটি পূরণ করা আবশ্যক",
  "validation.email": "সঠিক ইমেইল ঠিকানা দিন",
  "validation.passwordMin": "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে",
  "validation.passwordMatch": "পাসওয়ার্ড দুটি মিলছে না",
  "validation.nameMin": "নাম কমপক্ষে ২ অক্ষরের হতে হবে",
  "validation.nameMax": "নাম ৮০ অক্ষরের কম হতে হবে",
  "validation.meterNameRequired": "মিটারের নাম আবশ্যক",
  "validation.meterNumberFormat": "মিটার নম্বর ৪–৩২ অঙ্কের হতে হবে",
  "validation.accountNumberFormat": "অ্যাকাউন্ট নম্বর ৪–৩২ অঙ্কের হতে হবে",
  "validation.thresholdRange": "সীমা ০ থেকে ১,০০,০০০ এর মধ্যে হতে হবে",
  "validation.thresholdOrder":
    "ক্রিটিক্যাল সীমা লো সীমার চেয়ে কম হতে হবে",
  "validation.invalidNumber": "সঠিক সংখ্যা দিন",

  "dash.title": "ড্যাশবোর্ড",
  "dash.welcome": "স্বাগতম",
  "dash.overview": "আপনার সব সংযুক্ত মিটারের সারসংক্ষেপ",
  "dash.totalMeters": "মোট মিটার",
  "dash.healthy": "সুস্থ",
  "dash.lowBalance": "কম ব্যালেন্স",
  "dash.critical": "সংকটজনক",
  "dash.totalBalance": "সম্মিলিত ব্যালেন্স",
  "dash.connectedMeters": "সংযুক্ত মিটার",
  "dash.connectedMetersDesc":
    "আপনার সব সম্পত্তির ব্যালেন্স পর্যবেক্ষণ, সীমা নির্ধারণ ও মিটার পরীক্ষা করুন",
  "dash.addMeter": "নতুন মিটার যোগ করুন",
  "dash.viewAll": "সব মিটার দেখুন",
  "dash.recentActivity": "সাম্প্রতিক কার্যক্রম",
  "dash.recentActivityDesc": "আপনার মিটারগুলোর সর্বশেষ ব্যালেন্স রিডিং",
  "dash.needsAttention": "নজর প্রয়োজন",

  "meters.title": "আমার মিটার",
  "meters.subtitle":
    "সব মিটারের ব্যালেন্স পর্যবেক্ষণ, সীমা নির্ধারণ ও পরীক্ষা করুন",
  "meters.search": "মিটারের নাম বা নম্বর দিয়ে খুঁজুন…",
  "meters.filter": "ফিল্টার",
  "meters.all": "সব",
  "meters.meterNumber": "মিটার নম্বর",
  "meters.accountNumber": "অ্যাকাউন্ট নম্বর",
  "meters.prepaidBalance": "প্রিপেইড ব্যালেন্স",
  "meters.balance": "ব্যালেন্স",
  "meters.threshold": "লো সীমা",
  "meters.criticalThreshold": "ক্রিটিক্যাল সীমা",
  "meters.low": "লো",
  "meters.lastChecked": "সর্বশেষ পরীক্ষা",
  "meters.neverChecked": "কখনো পরীক্ষা হয়নি",
  "meters.monitoring": "মনিটরিং",
  "meters.emailAlerts": "ইমেইল সতর্কতা",
  "meters.enabled": "চালু",
  "meters.disabled": "বন্ধ",
  "meters.tariffPlan": "ট্যারিফ প্ল্যান",
  "meters.sanctionedLoad": "অনুমোদিত লোড",
  "meters.customerName": "গ্রাহকের নাম",
  "meters.installationAddress": "স্থাপনার ঠিকানা",
  "meters.phaseType": "ফেজ ধরন",
  "meters.monthConsumption": "চলতি মাসের খরচ",
  "meters.readingTime": "ডেসকো রিডিং সময়",
  "meters.view": "দেখুন",
  "meters.checkNow": "এখনই পরীক্ষা করুন",
  "meters.checking": "পরীক্ষা চলছে…",
  "meters.edit": "সম্পাদনা",
  "meters.delete": "মুছুন",
  "meters.actions": "কার্যক্রম",
  "meters.overview": "সারসংক্ষেপ",
  "meters.balanceHistory": "ব্যালেন্স ইতিহাস",
  "meters.alerts": "সতর্কতা",
  "meters.settings": "সেটিংস",
  "meters.backToMeters": "মিটারে ফিরুন",

  "meterForm.addTitle": "নতুন মিটার যোগ করুন",
  "meterForm.addDesc":
    "ব্যালেন্স পর্যবেক্ষণ শুরু করতে একটি ডেসকো প্রিপেইড মিটার সংযুক্ত করুন।",
  "meterForm.editTitle": "মিটার সম্পাদনা",
  "meterForm.editDesc": "এই মিটারের তথ্য ও সতর্কতা সীমা হালনাগাদ করুন।",
  "meterForm.name": "মিটারের নাম",
  "meterForm.namePlaceholder": "যেমন: বাসার মিটার",
  "meterForm.nameHint": "ড্যাশবোর্ডে এই মিটার চেনার জন্য একটি নাম",
  "meterForm.meterNumber": "মিটার নম্বর",
  "meterForm.meterNumberPlaceholder": "যেমন: ০৬৬১২০০০৩৭৭০",
  "meterForm.accountNumber": "অ্যাকাউন্ট নম্বর",
  "meterForm.accountNumberPlaceholder": "যেমন: ২১০০০৭৩৬",
  "meterForm.numbersHint":
    "উভয় নম্বর আপনার ডেসকো প্রিপেইড মিটার ও রিচার্জ রসিদে মুদ্রিত থাকে।",
  "meterForm.threshold": "লো ব্যালেন্স সীমা (৳)",
  "meterForm.thresholdHint": "ব্যালেন্স এই মানে বা নিচে নামলে সতর্ক করুন",
  "meterForm.criticalThreshold": "ক্রিটিক্যাল সীমা (৳)",
  "meterForm.criticalHint":
    "ক্রিটিক্যাল সতর্কতায় উন্নীত হয়। অবশ্যই কম হতে হবে।",
  "meterForm.monitoringEnabled": "মনিটরিং চালু",
  "meterForm.monitoringHint":
    "নির্ধারিত ব্যালেন্স পরীক্ষায় এই মিটার অন্তর্ভুক্ত করুন",
  "meterForm.emailAlertEnabled": "ইমেইল সতর্কতা চালু",
  "meterForm.emailHint": "সীমা অতিক্রম করলে সতর্কতা ইমেইল পাঠান",
  "meterForm.cancel": "বাতিল",
  "meterForm.submit": "মিটার যোগ করুন",
  "meterForm.submitting": "যোগ করা হচ্ছে…",
  "meterForm.save": "পরিবর্তন সংরক্ষণ",
  "meterForm.saving": "সংরক্ষণ হচ্ছে…",
  "meterForm.verifyHint":
    "সংরক্ষণের আগে আমরা এই নম্বরগুলো ডেসকোতে যাচাই করব।",

  "meterToast.added": "মিটার সফলভাবে যোগ হয়েছে",
  "meterToast.updated": "মিটার সফলভাবে হালনাগাদ হয়েছে",
  "meterToast.deleted": "মিটার সফলভাবে মুছে ফেলা হয়েছে",
  "meterToast.balanceUpdated": "ব্যালেন্স সফলভাবে হালনাগাদ হয়েছে",
  "meterToast.checkFailed": "মিটার পরীক্ষা করা যায়নি",
  "meterToast.deleteTitle": "এই মিটার মুছে ফেলবেন?",
  "meterToast.deleteDesc":
    "এটি মিটার ও তার সম্পূর্ণ ব্যালেন্স ইতিহাস আপনার ড্যাশবোর্ড থেকে মুছে ফেলবে। এই কাজ ফেরানো যাবে না।",
  "meterToast.deleteConfirm": "মিটার মুছুন",
  "meterToast.duplicate": "আপনি ইতিমধ্যে এই মিটার নম্বর নিবন্ধন করেছেন",
  "meterToast.notFound": "মিটার পাওয়া যায়নি",
  "meterToast.verifyFailed":
    "ডেসকো এই মিটার খুঁজে পায়নি। মিটার ও অ্যাকাউন্ট নম্বর যাচাই করুন।",

  "analytics.title": "খরচ ও ব্যালেন্স অ্যানালিটিক্স",
  "analytics.subtitle":
    "আপনার সংরক্ষিত রিডিং থেকে ব্যালেন্স প্রবণতা, দৈনিক খরচ ও রিচার্জ বিশ্লেষণ",
  "analytics.period7": "গত ৭ দিন",
  "analytics.period14": "গত ১৪ দিন",
  "analytics.period30": "গত এক মাস",
  "analytics.periodCustom": "নির্দিষ্ট সময়",
  "analytics.allMeters": "সব মিটার",
  "analytics.selectMeter": "মিটার নির্বাচন",
  "analytics.avgDailyUsage": "গড় দৈনিক খরচ",
  "analytics.avgDailyUsageHint": "প্রতিদিনের গড় ব্যয়",
  "analytics.highestUsage": "সর্বোচ্চ খরচ",
  "analytics.highestUsageHint": "সর্বোচ্চ রেকর্ডকৃত দিন",
  "analytics.lowestUsage": "সর্বনিম্ন খরচ",
  "analytics.lowestUsageHint": "সর্বনিম্ন রেকর্ডকৃত দিন",
  "analytics.recharges": "রিচার্জ",
  "analytics.rechargesHint": "নির্বাচিত সময়ে",
  "analytics.estRecharge": "সম্ভাব্য শেষ",
  "analytics.estRechargeHint": "বর্তমান হারে প্রক্ষেপিত",
  "analytics.remainingDays": "অবশিষ্ট দিন",
  "analytics.remainingDaysHint": "বর্তমান হারে চলার সময়",
  "analytics.chart1": "ব্যালেন্স গতিপথ",
  "analytics.chart1desc": "সীমার বিপরীতে সময়ভিত্তিক ব্যালেন্স",
  "analytics.chart2": "দৈনিক প্রবণতা",
  "analytics.chart2desc": "ভলিউম কার্ভ হিসেবে ব্যালেন্সের গতিবিধি",
  "analytics.chart3": "দৈনিক ব্যয়ের হার",
  "analytics.chart3desc": "ডেসকো অনুযায়ী দৈনিক খরচ (টাকা)",
  "analytics.chart4": "সাপ্তাহিক তুলনা",
  "analytics.chart4desc": "এই সপ্তাহ বনাম গত সপ্তাহের দৈনিক খরচ",
  "analytics.chart5": "খরচের অনুপাত",
  "analytics.chart5desc": "দিনের ভাগ অনুযায়ী খরচের ভাগ",
  "analytics.chart6": "ব্যালেন্স ধারণক্ষমতা",
  "analytics.chart6desc": "সীমার বিপরীতে বর্তমান ব্যালেন্স",
  "analytics.chart7": "কার্যক্রমের তীব্রতা",
  "analytics.chart7desc": "দিন অনুযায়ী আপেক্ষিক খরচের তীব্রতা",
  "analytics.thisWeek": "এই সপ্তাহ",
  "analytics.lastWeek": "গত সপ্তাহ",
  "analytics.noData": "এখনো কোনো ব্যালেন্স ইতিহাস নেই।",
  "analytics.noDataDesc":
    "আপনার মিটার অন্তত দুইবার পরীক্ষা হলে এখানে চার্ট দেখা যাবে।",
  "analytics.capacityLabel": "সীমার তুলনায়",
  "analytics.dataSource": "খরচের তথ্য ডেসকো থেকে",

  "reports.title": "রিপোর্ট",
  "reports.subtitle":
    "ব্যালেন্স ইতিহাস, সতর্কতা ইতিহাস ও মিটার স্বাস্থ্য রেকর্ড এক্সপোর্ট করুন",
  "reports.type": "রিপোর্টের ধরন",
  "reports.balanceHistory": "ব্যালেন্স ইতিহাস",
  "reports.alertHistory": "সতর্কতা ইতিহাস",
  "reports.meterHealth": "মিটার স্বাস্থ্য",
  "reports.dateRange": "সময়সীমা",
  "reports.from": "থেকে",
  "reports.to": "পর্যন্ত",
  "reports.status": "অবস্থা",
  "reports.meter": "মিটার",
  "reports.allStatuses": "সব অবস্থা",
  "reports.exportCsv": "সিএসভি এক্সপোর্ট",
  "reports.exporting": "এক্সপোর্ট হচ্ছে…",
  "reports.rows": "রেকর্ড",
  "reports.generated": "রিপোর্ট তৈরি হয়েছে",
  "reports.exported": "রিপোর্ট সফলভাবে এক্সপোর্ট হয়েছে",
  "reports.noRecords": "এই ফিল্টারে কোনো রেকর্ড নেই",
  "reports.noRecordsDesc":
    "সময়সীমা বাড়িয়ে দেখুন বা অন্য মিটার নির্বাচন করুন।",
  "reports.colDate": "তারিখ",
  "reports.colType": "ধরন",
  "reports.colConsumption": "খরচ",
  "reports.allMeters": "সব মিটার",
  "reports.preview": "প্রিভিউ",

  "notif.title": "নোটিফিকেশন",
  "notif.subtitle": "ব্যালেন্স সতর্কতা, সীমা সংক্রান্ত বার্তা ও সিস্টেম আপডেট",
  "notif.all": "সব",
  "notif.unread": "অপঠিত",
  "notif.lowBalance": "কম ব্যালেন্স",
  "notif.criticalBalance": "সংকটজনক",
  "notif.recovery": "পুনরুদ্ধার",
  "notif.system": "সিস্টেম",
  "notif.monitoringError": "মনিটরিং ত্রুটি",
  "notif.markRead": "পঠিত হিসেবে চিহ্নিত করুন",
  "notif.markAllRead": "সব পঠিত হিসেবে চিহ্নিত করুন",
  "notif.markedRead": "নোটিফিকেশন পঠিত হিসেবে চিহ্নিত হয়েছে",
  "notif.allMarkedRead": "সব নোটিফিকেশন পঠিত হিসেবে চিহ্নিত হয়েছে",
  "notif.empty": "এখনো কোনো নোটিফিকেশন নেই।",
  "notif.emptyDesc":
    "আপনি সব দেখে ফেলেছেন। আপনার মিটার সংক্রান্ত সতর্কতা এখানে দেখা যাবে।",
  "notif.viewAll": "সব নোটিফিকেশন দেখুন",
  "notif.unreadCount": "অপঠিত",
  "notif.openNotifications": "নোটিফিকেশন খুলুন",

  "profile.title": "প্রোফাইল",
  "profile.subtitle": "আপনার পরিচয়, যোগাযোগ তথ্য ও পাসওয়ার্ড পরিচালনা করুন",
  "profile.accountDetails": "অ্যাকাউন্টের তথ্য",
  "profile.fullName": "পূর্ণ নাম",
  "profile.email": "ইমেইল ঠিকানা",
  "profile.emailLocked": "এখান থেকে ইমেইল পরিবর্তন করা যায় না",
  "profile.phone": "যোগাযোগ ফোন",
  "profile.address": "ঠিকানা",
  "profile.designation": "পদবি",
  "profile.memberSince": "সদস্য হয়েছেন",
  "profile.linkedMeters": "সংযুক্ত মিটার",
  "profile.role": "ভূমিকা",
  "profile.saveChanges": "পরিবর্তন সংরক্ষণ",
  "profile.updated": "প্রোফাইল সফলভাবে হালনাগাদ হয়েছে",
  "profile.security": "পাসওয়ার্ড ও নিরাপত্তা",
  "profile.securityDesc": "আপনার অ্যাকাউন্টের পাসওয়ার্ড হালনাগাদ করুন",
  "profile.currentPassword": "বর্তমান পাসওয়ার্ড",
  "profile.changePassword": "পাসওয়ার্ড পরিবর্তন",
  "profile.avatar": "অবতার",
  "profile.avatarHint": "একটি ছবির লিঙ্ক দিন, অথবা ছবি আপলোড করুন",
  "profile.avatarUrl": "অবতার ছবির লিঙ্ক",
  "profile.uploadPhoto": "ছবি আপলোড করুন",
  "profile.uploading": "আপলোড হচ্ছে…",
  "profile.uploadSuccess": "ছবি আপলোড হয়েছে",
  "profile.uploadTypeError": "JPG, PNG বা WebP ছবি ব্যবহার করুন",
  "profile.uploadSizeError": "ছবি সর্বোচ্চ ৫ MB হতে হবে",
  "profile.removePhoto": "ছবি সরান",

  "settings.title": "সেটিংস",
  "settings.subtitle": "চেহারা, ভাষা ও নোটিফিকেশন পছন্দ",
  "settings.appearance": "চেহারা",
  "settings.appearanceDesc": "এই ডিভাইসে ডেসকো স্মার্ট কেমন দেখাবে",
  "settings.theme": "থিম",
  "settings.themeLight": "লাইট",
  "settings.themeDark": "ডার্ক",
  "settings.themeSystem": "সিস্টেম",
  "settings.language": "ভাষা",
  "settings.languageDesc": "অ্যাপ্লিকেশনজুড়ে ইন্টারফেসের ভাষা",
  "settings.notifications": "নোটিফিকেশন পছন্দ",
  "settings.notificationsDesc": "কোন সতর্কতাগুলো পেতে চান তা নির্বাচন করুন",
  "settings.emailAlerts": "ইমেইল সতর্কতা",
  "settings.emailAlertsDesc": "সব ইমেইল সতর্কতার প্রধান সুইচ",
  "settings.lowBalanceAlerts": "কম ব্যালেন্স সতর্কতা",
  "settings.lowBalanceAlertsDesc":
    "কোনো মিটার লো সীমায় নামলে জানান",
  "settings.criticalAlerts": "ক্রিটিক্যাল ব্যালেন্স সতর্কতা",
  "settings.criticalAlertsDesc":
    "কোনো মিটার ক্রিটিক্যাল সীমায় নামলে জানান",
  "settings.recoveryAlerts": "পুনরুদ্ধার সতর্কতা",
  "settings.recoveryAlertsDesc":
    "কোনো মিটার সীমার উপরে ফিরে এলে জানান",
  "settings.dailySummary": "দৈনিক সারসংক্ষেপ",
  "settings.dailySummaryDesc":
    "আপনার মিটারগুলোর দৈনিক সারসংক্ষেপ (সামারি ওয়ার্কফ্লো প্রয়োজন)",
  "settings.security": "নিরাপত্তা",
  "settings.securityDesc": "সেশন ও অ্যাকাউন্ট সুরক্ষা",
  "settings.monitoring": "মনিটরিং পছন্দ",
  "settings.monitoringDesc": "আপনার মিটার কীভাবে পরীক্ষা করা হয়",
  "settings.saved": "সেটিংস সংরক্ষিত হয়েছে",
  "settings.scheduleNote":
    "মনিটরিং সময়সূচি রিপোজিটরির গিটহাব অ্যাকশনস ওয়ার্কফ্লো দ্বারা নিয়ন্ত্রিত, এই স্ক্রিন থেকে নয়।",

  "admin.badge": "সুপার অ্যাডমিন",
  "admin.title": "এক্সিকিউটিভ কন্ট্রোল",
  "admin.subtitle": "সিস্টেমব্যাপী পর্যবেক্ষণ, পরিচালনা ও কনফিগারেশন",
  "admin.governance": "এক্সিকিউটিভ গভর্ন্যান্স",
  "admin.administration": "প্রশাসন",
  "admin.superAdmin": "সুপার অ্যাডমিন",
  "admin.executiveControl": "এক্সিকিউটিভ কন্ট্রোল",
  "admin.fleetOverview": "ফ্লিট সারসংক্ষেপ",
  "admin.reportsLedger": "রিপোর্ট ও লেজার",
  "admin.usersDirectory": "ব্যবহারকারী তালিকা",
  "admin.meterManagement": "মিটার ব্যবস্থাপনা",
  "admin.auditLogs": "অডিট লগ",
  "admin.adminGovernance": "অ্যাডমিন গভর্ন্যান্স",
  "admin.emailConfig": "ইমেইল কনফিগারেশন",
  "admin.systemSettings": "সিস্টেম সেটিংস",
  "admin.totalUsers": "মোট ব্যবহারকারী",
  "admin.totalMeters": "মোট মিটার",
  "admin.activeMeters": "সক্রিয় মিটার",
  "admin.alertsToday": "আজকের সতর্কতা",
  "admin.failedChecks": "ব্যর্থ পরীক্ষা",
  "admin.checksToday": "আজকের পরীক্ষা",
  "admin.systemHealth": "সিস্টেম স্বাস্থ্য",
  "admin.backToUserDashboard": "ব্যবহারকারী ড্যাশবোর্ড",

  "admin.users.title": "ব্যবহারকারী তালিকা",
  "admin.users.subtitle": "সব নিবন্ধিত অ্যাকাউন্ট ও তাদের মিটার সংখ্যা",
  "admin.users.search": "নাম বা ইমেইল দিয়ে খুঁজুন…",
  "admin.users.name": "নাম",
  "admin.users.email": "ইমেইল",
  "admin.users.role": "ভূমিকা",
  "admin.users.meters": "মিটার",
  "admin.users.status": "অবস্থা",
  "admin.users.created": "তৈরি",
  "admin.users.active": "সক্রিয়",
  "admin.users.inactive": "নিষ্ক্রিয়",
  "admin.users.empty": "কোনো ব্যবহারকারী পাওয়া যায়নি",
  "admin.users.emptyDesc": "নিবন্ধিত অ্যাকাউন্ট এখানে তালিকাভুক্ত হবে।",
  "admin.users.promote": "সুপার অ্যাডমিন করুন",
  "admin.users.demote": "সুপার অ্যাডমিন বাতিল",
  "admin.users.roleUpdated": "ব্যবহারকারীর ভূমিকা হালনাগাদ হয়েছে",
  "admin.users.cannotDemoteSelf": "আপনি নিজের ভূমিকা পরিবর্তন করতে পারবেন না",
  "admin.users.you": "আপনি",

  "admin.meters.title": "সিস্টেমব্যাপী মিটার ব্যবস্থাপনা",
  "admin.meters.subtitle":
    "মিটার টেলিমেট্রি, সীমা ও সিঙ্ক স্বাস্থ্যের পরিচালন দৃশ্য",
  "admin.meters.search": "মিটারের নাম, নম্বর বা মালিক দিয়ে খুঁজুন…",
  "admin.meters.details": "মিটারের বিবরণ",
  "admin.meters.owner": "মালিক অ্যাকাউন্ট",
  "admin.meters.currentBalance": "বর্তমান ব্যালেন্স",
  "admin.meters.thresholds": "সীমা (লো / ক্রিটিক্যাল)",
  "admin.meters.lastSync": "সর্বশেষ সিঙ্ক",
  "admin.meters.configured": "মিটার কনফিগার করা",
  "admin.meters.empty": "কোনো মিটার নিবন্ধিত নেই",
  "admin.meters.emptyDesc":
    "যেকোনো ব্যবহারকারীর যোগ করা মিটার এখানে দেখা যাবে।",

  "admin.analytics.title": "সিস্টেম অ্যানালিটিক্স",
  "admin.analytics.subtitle":
    "মনিটরিং কার্যক্রম, সতর্কতার পরিমাণ ও মিটার বণ্টন",
  "admin.analytics.totalChecks": "মোট পরীক্ষা",
  "admin.analytics.successfulChecks": "সফল পরীক্ষা",
  "admin.analytics.failedChecks": "ব্যর্থ পরীক্ষা",
  "admin.analytics.successRate": "সাফল্যের হার",
  "admin.analytics.lowAlerts": "কম ব্যালেন্স সতর্কতা",
  "admin.analytics.criticalAlerts": "ক্রিটিক্যাল সতর্কতা",
  "admin.analytics.metersByStatus": "অবস্থা অনুযায়ী মিটার",
  "admin.analytics.checkVolume": "পরীক্ষার পরিমাণ (১৪ দিন)",
  "admin.analytics.alertVolume": "সতর্কতার পরিমাণ (১৪ দিন)",
  "admin.analytics.topUsers": "সবচেয়ে সক্রিয় অ্যাকাউন্ট",

  "admin.audit.title": "অডিট লগ",
  "admin.audit.subtitle": "নিরাপত্তা-সংক্রান্ত কার্যক্রমের অপরিবর্তনীয় রেকর্ড",
  "admin.audit.timestamp": "সময়",
  "admin.audit.user": "ব্যবহারকারী",
  "admin.audit.action": "কার্যক্রম",
  "admin.audit.entity": "এনটিটি",
  "admin.audit.result": "ফলাফল",
  "admin.audit.empty": "এখনো কোনো অডিট এন্ট্রি নেই",
  "admin.audit.emptyDesc":
    "মিটার তৈরি ও ব্যালেন্স পরীক্ষার মতো কার্যক্রম এখানে রেকর্ড হবে।",

  "admin.email.title": "ইমেইল গেটওয়ে কনফিগারেশন",
  "admin.email.subtitle":
    "সতর্কতা ইমেইল পাঠাতে ব্যবহৃত এসএমটিপি রিলের অবস্থা",
  "admin.email.status": "গেটওয়ে অবস্থা",
  "admin.email.configured": "কনফিগার করা",
  "admin.email.notConfigured": "কনফিগার করা নেই",
  "admin.email.host": "এসএমটিপি হোস্ট",
  "admin.email.port": "এসএমটিপি পোর্ট",
  "admin.email.sender": "প্রেরকের ঠিকানা",
  "admin.email.senderName": "প্রেরকের প্রদর্শিত নাম",
  "admin.email.username": "এসএমটিপি ইউজারনেম",
  "admin.email.secretsNotice":
    "ক্রেডেনশিয়াল সার্ভার এনভায়রনমেন্ট ভেরিয়েবল থেকে পড়া হয় এবং কখনোই ব্রাউজারে পাঠানো হয় না। এই স্ক্রিন থেকে পাসওয়ার্ড দেখা বা সম্পাদনা করা যায় না।",
  "admin.email.envNotice":
    "এই মানগুলো পরিবর্তন করতে আপনার ডিপ্লয়মেন্ট ও রিপোজিটরির গিটহাব অ্যাকশনস সিক্রেটে এনভায়রনমেন্ট ভেরিয়েবল হালনাগাদ করুন।",
  "admin.email.test": "পরীক্ষামূলক ইমেইল পাঠান",
  "admin.email.testing": "পাঠানো হচ্ছে…",
  "admin.email.testDesc":
    "রিলে কাজ করছে কিনা নিশ্চিত করতে আপনার অ্যাকাউন্টের ঠিকানায় একটি যাচাই ইমেইল পাঠায়।",
  "admin.email.testSuccess": "পরীক্ষামূলক ইমেইল সফলভাবে পাঠানো হয়েছে",
  "admin.email.testFailed": "পরীক্ষামূলক ইমেইল ব্যর্থ হয়েছে",
  "admin.email.lastTest": "সর্বশেষ সফল পরীক্ষা",
  "admin.email.never": "কখনো পরীক্ষা হয়নি",
  "admin.email.testNote":
    "সতর্কতা ইমেইল ডাটাবেজে সক্রিয় এই এসএমটিপি সেটিংস ব্যবহার করে পাঠানো হয়। সংযোগ পরীক্ষা করতে টেস্ট ইমেইল পাঠান।",
  "admin.email.appPassword": "ইমেইল / অ্যাপ পাসওয়ার্ড",
  "admin.email.appPasswordHint":
    "গুগল অ্যাকাউন্ট সিকিউরিটি থেকে প্রস্তুতকৃত ১৬ অক্ষরের গুগল অ্যাপ পাসওয়ার্ড (যেমন abcd efgh ijkl mnop)।",
  "admin.email.settingsSaved": "এসএমটিপি কনফিগারেশন সফলভাবে সংরক্ষিত হয়েছে",
  "admin.email.testSentSuccess": "টেস্ট ইমেইল সফলভাবে পাঠানো হয়েছে!",
  "admin.email.secureSsl": "এসএসএল এনক্রিপশন (পোর্ট ৪৬৫)",
  "admin.email.serviceEnabled": "এসএমটিপি গেটওয়ে সক্রিয় করুন",
  "admin.email.saveBtn": "এসএমটিপি সেটিংস সংরক্ষণ করুন",
  "admin.email.recipientEmail": "প্রাপকের ইমেইল",
  "meterForm.alertEmail": "অ্যালার্ট নোটিফিকেশন ইমেইল",
  "meterForm.alertEmailHint":
    "আপনার অ্যাকাউন্টের ইমেইল ডিফল্ট থাকবে। চাইলে যেকোনো ইমেইল দিয়ে কম ব্যালেন্সের নোটিফিকেশন পেতে পারেন।",
  "meterForm.alertEmailPlaceholder": "যেমন: family@example.com",
  "admin.users.addUser": "নতুন ইউজার যোগ করুন",
  "admin.users.editUser": "ইউজার সম্পাদনা",
  "admin.users.deleteUser": "ইউজার মুছুন",
  "admin.users.blockUser": "ইউজার ব্লক করুন",
  "admin.users.unblockUser": "ইউজার আনব্লক করুন",
  "admin.users.blocked": "ব্লকড",
  "admin.users.actions": "অ্যাকশন",
  "admin.users.createdSuccess": "ইউজার সফলভাবে তৈরি হয়েছে",
  "admin.users.updatedSuccess": "ইউজার সফলভাবে হালনাগাদ হয়েছে",
  "admin.users.deletedSuccess": "ইউজার সফলভাবে মুছে ফেলা হয়েছে",
  "admin.users.cannotBlockSelf": "আপনি নিজেকে ব্লক করতে পারবেন না",
  "admin.users.cannotDeleteSelf": "আপনি নিজেকে মুছতে পারবেন না",
  "admin.users.admin": "অ্যাডমিন",

  "admin.settings.title": "গ্লোবাল সিস্টেম প্যারামিটার",
  "admin.settings.subtitle":
    "নতুন মিটারে প্রযোজ্য ডিফল্ট ও সিস্টেমব্যাপী আচরণ",
  "admin.settings.defaults": "নতুন মিটারের ডিফল্ট কনফিগারেশন",
  "admin.settings.defaultLow": "ডিফল্ট লো সীমা (৳)",
  "admin.settings.defaultCritical": "ডিফল্ট ক্রিটিক্যাল সীমা (৳)",
  "admin.settings.cooldown": "সতর্কতা কুলডাউন (ঘণ্টা)",
  "admin.settings.cooldownHint":
    "একই অবস্থায় থাকা মিটারের পুনরাবৃত্ত ইমেইলের মধ্যে ন্যূনতম বিরতি",
  "admin.settings.maintenance": "রক্ষণাবেক্ষণ মোড",
  "admin.settings.maintenanceHint":
    "অ্যাডমিন ছাড়া ব্যবহারকারীদের রক্ষণাবেক্ষণ বার্তা দেখায়",
  "admin.settings.defaultLanguage": "ডিফল্ট ভাষা",
  "admin.settings.defaultTheme": "ডিফল্ট থিম",
  "admin.settings.save": "প্যারামিটার সংরক্ষণ",
  "admin.settings.saved": "সিস্টেম প্যারামিটার সংরক্ষিত হয়েছে",
  "admin.settings.schedule": "মনিটরিং সময়সূচি",
  "admin.settings.scheduleValue": "গিটহাব অ্যাকশনস দ্বারা নিয়ন্ত্রিত",
  "admin.settings.scheduleNotice":
    "পোলিং সময়সূচি .github/workflows/desco-monitor.yml ফাইলের ক্রন এক্সপ্রেশন দিয়ে নির্ধারিত। পরিবর্তন করতে ওই ফাইল সম্পাদনা করতে হবে — এই স্ক্রিন ওয়ার্কফ্লোর সময়সূচি পরিবর্তন করে না।",
  "admin.settings.storage": "ডেটাবেস",
  "admin.settings.gateway": "ডেসকো গেটওয়ে",

  "admin.governance.title": "প্রশাসক গভর্ন্যান্স",
  "admin.governance.subtitle":
    "প্ল্যাটফর্মজুড়ে প্রশাসনিক অধিকার পরিচালনা করুন",
  "admin.governance.currentAdmins": "বর্তমান প্রশাসকগণ",
  "admin.governance.adminOfficer": "প্রশাসনিক কর্মকর্তা",
  "admin.governance.designation": "পদবি",
  "admin.governance.clearance": "ক্লিয়ারেন্স ভূমিকা",
  "admin.governance.noAdmins": "অতিরিক্ত কোনো প্রশাসক নেই",
  "admin.governance.noAdminsDesc":
    "সুপার অ্যাডমিন ক্লিয়ারেন্স দিতে ব্যবহারকারী তালিকা থেকে কাউকে উন্নীত করুন।",
  "admin.governance.warning":
    "সুপার অ্যাডমিন ক্লিয়ারেন্স প্রতিটি অ্যাকাউন্টের মিটার ও সিস্টেম কনফিগারেশনে পড়ার অধিকার দেয়। সতর্কতার সাথে প্রদান করুন।",

  "admin.notif.title": "সিস্টেম নোটিফিকেশন",
  "admin.notif.subtitle": "প্ল্যাটফর্মব্যাপী সতর্কতা ও নোটিফিকেশন সারসংক্ষেপ",
  "admin.notif.recent": "সাম্প্রতিক সিস্টেম সতর্কতা",

  "admin.reports.title": "রিপোর্ট ও লেজার",
  "admin.reports.subtitle":
    "সব অ্যাকাউন্ট ও মিটারজুড়ে সিস্টেম-স্তরের রিপোর্টিং",

  "status.healthy": "সুস্থ",
  "status.low": "লো সতর্কতা",
  "status.critical": "সংকটজনক",
  "status.checking": "পরীক্ষা চলছে",
  "status.error": "ত্রুটি",
  "status.disabled": "বন্ধ",
  "status.active": "সক্রিয়",
  "status.sent": "পাঠানো হয়েছে",
  "status.failed": "ব্যর্থ",
  "status.pending": "অপেক্ষমাণ",
  "status.skipped": "এড়ানো হয়েছে",
  "status.success": "সফল",

  "empty.noMeters": "এখনো কোনো মিটার সংযুক্ত নেই",
  "empty.noMetersDesc":
    "প্রিপেইড ব্যালেন্স পর্যবেক্ষণ শুরু করতে আপনার প্রথম ডেসকো মিটার যোগ করুন।",
  "empty.noResults": "কোনো ফলাফল পাওয়া যায়নি",
  "empty.noResultsDesc": "আপনার অনুসন্ধান বা ফিল্টার পরিবর্তন করে দেখুন।",
  "empty.noHistory": "এখনো কোনো ব্যালেন্স ইতিহাস নেই",
  "empty.noHistoryDesc":
    "এই মিটার পরীক্ষা করার পর এখানে ইতিহাস দেখা যাবে।",
  "empty.noAlerts": "এখনো কোনো সতর্কতা নেই",
  "empty.noAlertsDesc":
    "ব্যালেন্স কোনো সীমা অতিক্রম করলে এখানে সতর্কতা দেখা যাবে।",
  "error.title": "কিছু একটা ভুল হয়েছে",
  "error.generic": "একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন।",
  "error.loadMeters": "আপনার মিটার লোড করা যায়নি।",
  "error.loadAnalytics": "অ্যানালিটিক্স তথ্য লোড করা যায়নি।",
  "error.tryAgain": "আবার চেষ্টা করুন",
  "error.notFound": "পৃষ্ঠা পাওয়া যায়নি",
  "error.notFoundDesc":
    "আপনি যে পৃষ্ঠাটি খুঁজছেন তা নেই বা স্থানান্তরিত হয়েছে।",
  "error.goHome": "হোমে যান",
  "error.goDashboard": "ড্যাশবোর্ডে যান",
  "error.unauthorized": "প্রবেশাধিকার নেই",
  "error.unauthorizedDesc":
    "এই অংশ দেখার অনুমতি আপনার নেই। সুপার অ্যাডমিন ক্লিয়ারেন্স প্রয়োজন।",
  "error.sessionExpired": "আপনার সেশনের মেয়াদ শেষ। আবার সাইন ইন করুন।",
  "error.rateLimited": "অনেক বেশি অনুরোধ। একটু পরে আবার চেষ্টা করুন।",
  "error.uploadFailed": "ছবি আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
  "error.uploadNotConfigured": "সার্ভারে ছবি আপলোড কনফিগার করা নেই।",
  "loading.default": "লোড হচ্ছে…",

  "common.save": "সংরক্ষণ",
  "common.cancel": "বাতিল",
  "common.delete": "মুছুন",
  "common.edit": "সম্পাদনা",
  "common.close": "বন্ধ",
  "common.search": "খুঁজুন",
  "common.filter": "ফিল্টার",
  "common.export": "এক্সপোর্ট",
  "common.refresh": "রিফ্রেশ",
  "common.refreshing": "রিফ্রেশ হচ্ছে…",
  "common.previous": "পূর্ববর্তী",
  "common.next": "পরবর্তী",
  "common.page": "পৃষ্ঠা",
  "common.of": "এর",
  "common.showing": "দেখানো হচ্ছে",
  "common.results": "ফলাফল",
  "common.language": "ভাষা",
  "common.theme": "থিম",
  "common.toggleTheme": "থিম পরিবর্তন",
  "common.selectLanguage": "ভাষা নির্বাচন",
  "common.optional": "ঐচ্ছিক",
  "common.required": "আবশ্যক",
  "common.never": "কখনো নয়",
  "common.today": "আজ",
  "common.yes": "হ্যাঁ",
  "common.no": "না",
  "common.learnMore": "আরও জানুন",
  "common.getStarted": "শুরু করুন",
  "common.comingSoon": "শীঘ্রই আসছে",
  "common.notConfigured": "কনফিগার করা নেই",
  "common.viewDetails": "বিস্তারিত দেখুন",

  "about.title": "ডেসকো স্মার্ট সম্পর্কে",
  "about.subtitle":
    "ঢাকার ডেসকো গ্রাহকদের জন্য স্বয়ংক্রিয় প্রিপেইড বিদ্যুৎ মনিটরিং।",
  "about.missionTitle": "কেন এই প্রকল্প",
  "about.missionBody":
    "ডেসকো প্রিপেইড গ্রাহকদের ব্যালেন্স নীরবে শূন্য হয়ে গেলে বিদ্যুৎ চলে যায় — প্রায়শই রাতে বা ছুটির দিনে, যখন রিচার্জ করা কঠিন। ডেসকো স্মার্ট ক্রমাগত আপনার ব্যালেন্স পর্যবেক্ষণ করে এবং সময় থাকতেই সতর্ক করে।",
  "about.originTitle": "স্ক্রিপ্ট থেকে প্ল্যাটফর্ম",
  "about.originBody":
    "এই প্রকল্পটি শুরু হয়েছিল একটি পাইথন স্ক্রিপ্ট দিয়ে, যা একটি মিটার পরীক্ষা করে ইমেইল পাঠাত। এটিকে বহু-ব্যবহারকারী প্ল্যাটফর্ম হিসেবে পুনর্নির্মাণ করা হয়েছে — ব্যবহারকারী-ভিত্তিক পৃথকীকরণ, সংরক্ষিত ইতিহাস, অ্যানালিটিক্স ও প্রশাসনিক কনসোলসহ — একই পরীক্ষিত ব্যালেন্স-যাচাই যুক্তি বজায় রেখে।",
  "about.stackTitle": "যেভাবে তৈরি",
  "about.stackBody":
    "একটি নেক্সট.জেএস অ্যাপ্লিকেশন ইন্টারফেস ও সার্ভার অ্যাকশন পরিচালনা করে, সুপাবেস প্রমাণীকরণ ও রো লেভেল সিকিউরিটিসহ পোস্টগ্রেএসকিউএল ডেটাবেস দেয়, এবং গিটহাব অ্যাকশনসে একটি নির্ধারিত পাইথন ওয়ার্কার ডেসকো এপিআই থেকে তথ্য নিয়ে সতর্কতা পাঠায়।",
  "about.openSource": "মনিটরিং সোর্স দেখুন",
  "contact.title": "যোগাযোগ",
  "contact.subtitle":
    "ডেসকো স্মার্ট নিয়ে প্রশ্ন আছে, বা কোনো সমস্যা জানাতে চান?",
  "contact.developerTitle": "ডেভেলপার",
  "contact.developerRole": "ফুল-স্ট্যাক ডেভেলপার",
  "contact.connectTitle": "সংযোগ",
  "contact.connectDesc":
    "ডেভেলপারের সাথে যোগাযোগের দ্রুততম উপায় এই প্রোফাইলগুলো।",
  "contact.issueTitle": "সমস্যা জানান",
  "contact.issueDesc":
    "বাগ রিপোর্ট ও ফিচার অনুরোধ প্রকল্পের রিপোজিটরিতে জানানোই উত্তম।",
  "contact.openRepo": "রিপোজিটরি খুলুন",
  "contact.descoTitle": "ডেসকো গ্রাহক সেবা",
  "contact.descoDesc":
    "বিলিং, মিটারিং বা সংযোগ সংক্রান্ত বিষয়ে সরাসরি ডেসকোর সাথে যোগাযোগ করুন — এটি একটি স্বাধীন মনিটরিং টুল, ডেসকোর দাপ্তরিক সেবা নয়।",

  "legal.privacyTitle": "গোপনীয়তা নীতি",
  "legal.termsTitle": "সেবার শর্তাবলী",
  "legal.lastUpdated": "সর্বশেষ হালনাগাদ",
  "legal.projectNotice":
    "ডেসকো স্মার্ট একটি স্বাধীন প্রকল্প এবং ঢাকা ইলেকট্রিক সাপ্লাই কোম্পানি লিমিটেডের সাথে সংশ্লিষ্ট, অনুমোদিত বা পরিচালিত নয়। এই নথি কেবল এই অ্যাপ্লিকেশনের চর্চা বর্ণনা করে।",
  "legal.privacyIntro":
    "এই গোপনীয়তা নীতি ব্যাখ্যা করে ডেসকো স্মার্ট কী তথ্য সংগ্রহ করে, কেন করে এবং কীভাবে তা সুরক্ষিত রাখা হয়। অ্যাকাউন্ট তৈরি করলে আপনি এখানে বর্ণিত চর্চাগুলোতে সম্মত হচ্ছেন।",
  "legal.privacy.collectTitle": "আমরা যে তথ্য সংগ্রহ করি",
  "legal.privacy.collectBody":
    "আমরা আপনার নিবন্ধনের ইমেইল ও পাসওয়ার্ড সংগ্রহ করি (পাসওয়ার্ড হ্যাশ করা হয় ও আমাদের প্রমাণীকরণ সেবা দ্বারা পরিচালিত হয় — আমরা তা কখনো সাধারণ টেক্সটে দেখি বা সংরক্ষণ করি না), আপনি যোগ করা মিটারের তথ্য (মিটারের নাম, মিটার নম্বর ও অ্যাকাউন্ট নম্বর), আপনার নির্ধারিত কম-ব্যালেন্স সীমা, আপনার নোটিফিকেশন ও অ্যাপিয়ারেন্স পছন্দ, এবং আপনি মনিটর করা মিটারের জন্য ডেসকো সেবা থেকে পাওয়া ব্যালেন্স রিডিং সংগ্রহ করি।",
  "legal.privacy.useTitle": "আপনার তথ্য কীভাবে ব্যবহার করি",
  "legal.privacy.useBody":
    "আপনার তথ্য কেবল সেবা পরিচালনায় ব্যবহৃত হয়: আপনাকে প্রমাণীকরণ করতে, আপনার যোগ করা মিটারের ব্যালেন্স নির্ধারিত সময়ে যাচাই করতে, কম-ব্যালেন্স ও পুনরুদ্ধার সতর্কতা পাঠাতে, এবং আপনার ড্যাশবোর্ড, অ্যানালিটিক্স ও ইতিহাস দেখাতে। আমরা আপনার তথ্য বিক্রি করি না এবং বিজ্ঞাপনের জন্য ব্যবহার করি না।",
  "legal.privacy.storageTitle": "তথ্য সংরক্ষণ ও নিরাপত্তা",
  "legal.privacy.storageBody":
    "তথ্য সুপাবেস পরিচালিত একটি পোস্টগ্রেএসকিউএল ডেটাবেসে সংরক্ষিত হয়। ডেটাবেস স্তরে রো লেভেল সিকিউরিটি প্রয়োগ করা হয়, যাতে প্রতিটি সারি তার মালিকের সাথে সীমাবদ্ধ থাকে — একটি অ্যাকাউন্ট কখনো অন্য অ্যাকাউন্টের মিটার, রিডিং বা সতর্কতা দেখতে পারে না। সব গোপন তথ্য (সার্ভিস কী, এসএমটিপি ও ডেসকো ক্রেডেনশিয়াল) সার্ভার-সাইড এনভায়রনমেন্ট ভেরিয়েবলে রাখা হয় এবং কখনো ব্রাউজারে প্রকাশ করা হয় না।",
  "legal.privacy.thirdPartyTitle": "তৃতীয় পক্ষের সেবা",
  "legal.privacy.thirdPartyBody":
    "সেবাটি প্রমাণীকরণ ও ডেটাবেস হোস্টিংয়ের জন্য সুপাবেস, মিটার রিডিং সংগ্রহের জন্য ডেসকো ব্যালেন্স সেবা, সতর্কতা পাঠাতে একটি এসএমটিপি ইমেইল সেবা এবং নির্ধারিত ব্যালেন্স যাচাই চালাতে গিটহাব অ্যাকশনসের উপর নির্ভর করে। প্রতিটি সেবা কেবল তার কাজের জন্য প্রয়োজনীয় তথ্যই প্রক্রিয়া করে।",
  "legal.privacy.rightsTitle": "আপনার অধিকার",
  "legal.privacy.rightsBody":
    "আপনি যেকোনো সময় ড্যাশবোর্ড থেকে আপনার মিটার ও পছন্দ দেখতে ও সম্পাদনা করতে, পৃথক মিটার মুছতে, বা সম্পূর্ণ অ্যাকাউন্ট মুছে ফেলতে পারেন। মিটার বা অ্যাকাউন্ট মুছলে সংশ্লিষ্ট রিডিং ও সতর্কতা ডেটাবেস থেকে সরে যায়।",
  "legal.privacy.retentionTitle": "তথ্য সংরক্ষণকাল",
  "legal.privacy.retentionBody":
    "সংশ্লিষ্ট মিটার বিদ্যমান থাকা পর্যন্ত ব্যালেন্স রিডিং ও সতর্কতার ইতিহাস রাখা হয়, যাতে প্রবণতা ও অ্যানালিটিক্স অর্থবহ থাকে। মিটার বা অ্যাকাউন্ট মুছলে সংশ্লিষ্ট তথ্য সরে যায়।",
  "legal.privacy.changesTitle": "নীতির পরিবর্তন",
  "legal.privacy.changesBody":
    "সেবার বিকাশের সাথে এই নীতি হালনাগাদ হতে পারে। গুরুত্বপূর্ণ পরিবর্তন এখানে হালনাগাদ তারিখসহ প্রতিফলিত হবে। হালনাগাদের পর সেবা ব্যবহার অব্যাহত রাখলে তা সংশোধিত নীতির প্রতি সম্মতি হিসেবে গণ্য হবে।",
  "legal.termsIntro":
    "এই সেবার শর্তাবলী ডেসকো স্মার্ট ব্যবহার নিয়ন্ত্রণ করে। অ্যাকাউন্ট তৈরি বা মিটার মনিটর করার আগে অনুগ্রহ করে এগুলো মনোযোগ দিয়ে পড়ুন।",
  "legal.terms.acceptTitle": "শর্ত গ্রহণ",
  "legal.terms.acceptBody":
    "অ্যাকাউন্ট তৈরি করে ও ডেসকো স্মার্ট ব্যবহার করে আপনি এই সেবার শর্তাবলীতে সম্মত হচ্ছেন। সম্মত না হলে অনুগ্রহ করে সেবাটি ব্যবহার করবেন না।",
  "legal.terms.serviceTitle": "সেবার বিবরণ",
  "legal.terms.serviceBody":
    "ডেসকো স্মার্ট একটি স্বাধীন টুল যা আপনার যোগ করা মিটারের ডেসকো প্রিপেইড বিদ্যুৎ ব্যালেন্স মনিটর করে ও স্বয়ংক্রিয় কম-ব্যালেন্স সতর্কতা পাঠায়। এটি প্রকাশ্যে উপলব্ধ ব্যালেন্স তথ্যের উপর একটি সুবিধা স্তর মাত্র এবং কোনো পেমেন্ট বা রিচার্জ প্রক্রিয়া করে না।",
  "legal.terms.accountTitle": "অ্যাকাউন্ট ও দায়িত্ব",
  "legal.terms.accountBody":
    "আপনার ক্রেডেনশিয়ালের গোপনীয়তা রক্ষা এবং প্রবেশ করানো মিটার ও অ্যাকাউন্ট নম্বরের সঠিকতার জন্য আপনি দায়ী। মনিটরিংয়ের জন্য যোগ করা যেকোনো মিটারে আপনার বৈধ স্বার্থ থাকতে হবে।",
  "legal.terms.useTitle": "গ্রহণযোগ্য ব্যবহার",
  "legal.terms.useBody":
    "আপনি সেবার অপব্যবহার না করতে, অন্য ব্যবহারকারীর তথ্যে প্রবেশের চেষ্টা না করতে, নির্ধারিত যাচাই অতিরিক্ত চাপে না ফেলতে, এবং অনুমোদিত নয় এমন মিটার মনিটর করতে সেবা ব্যবহার না করতে সম্মত হচ্ছেন।",
  "legal.terms.accuracyTitle": "সঠিকতা ও উপলব্ধতা",
  "legal.terms.accuracyBody":
    "ব্যালেন্স তথ্য ডেসকো সেবা থেকে সংগৃহীত হয় এবং \"যেমন আছে\" ভিত্তিতে প্রদান করা হয়। উজানের সেবা পরিবর্তন হলে বা বন্ধ থাকলে রিডিং বিলম্বিত, অনুপলব্ধ বা ভুল হতে পারে। সতর্কতা সর্বোত্তম-প্রচেষ্টাভিত্তিক এবং সংযোগ বিচ্ছিন্নতার একমাত্র রক্ষাকবচ হিসেবে এর উপর নির্ভর করা উচিত নয়।",
  "legal.terms.liabilityTitle": "দায়ের সীমাবদ্ধতা",
  "legal.terms.liabilityBody":
    "আইন অনুমোদিত সর্বোচ্চ সীমা পর্যন্ত, সতর্কতা মিস হওয়া, ভুল ব্যালেন্স তথ্য বা সেবা বন্ধ থাকা থেকে উদ্ভূত কোনো ক্ষতি, সংযোগ বিচ্ছিন্নতা বা লোকসানের জন্য ডেভেলপার দায়ী নন। সেবাটি কোনো ধরনের ওয়ারেন্টি ছাড়াই প্রদান করা হয়।",
  "legal.terms.thirdPartyTitle": "তৃতীয় পক্ষ ও ডেসকো সম্পর্ক",
  "legal.terms.thirdPartyBody":
    "সব বিলিং, মিটারিং, রিচার্জ ও সংযোগ সংক্রান্ত বিষয়ে আপনাকে সরাসরি ডেসকোর সাথে যোগাযোগ করতে হবে। ডেসকো স্মার্ট ডেসকোর দাপ্তরিক সেবার বিকল্প নয় এবং আপনার পক্ষে অ্যাকাউন্ট সমস্যা সমাধান করতে পারে না।",
  "legal.terms.changesTitle": "শর্তের পরিবর্তন",
  "legal.terms.changesBody":
    "এই শর্তাবলী সময়ে সময়ে সংশোধিত হতে পারে। বর্তমান সংস্করণ, তার সংশোধন তারিখসহ, সর্বদা আপনার সেবা ব্যবহার নিয়ন্ত্রণ করে। পরিবর্তনের পর ব্যবহার অব্যাহত রাখলে তা সম্মতি নির্দেশ করে।",

  "maintenance.banner":
    "নির্ধারিত রক্ষণাবেক্ষণ চলছে। কিছু মনিটরিং সুবিধা সাময়িকভাবে অনুপলব্ধ থাকতে পারে।",
};

export const dictionaries = { en, bn } as const;

/** Resolves a key for a language, falling back to English then the key itself. */
export function translate(lang: Language, key: TranslationKey): string {
  return dictionaries[lang]?.[key] ?? en[key] ?? key;
}
