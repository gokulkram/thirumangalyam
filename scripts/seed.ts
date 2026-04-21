/**
 * Seed script — populates MongoDB with sample data
 * Run: npx tsx scripts/seed.ts
 */

import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb+srv://thirumangalyam:QA6FQv80xRG0Zh83@cluster0.t1qnu90.mongodb.net/thirumangalyam?appName=Cluster0";

/* ============================================================
   Inline Schemas (standalone script, no path aliases)
   ============================================================ */

const userSchema = new mongoose.Schema(
  {
    phone: String,
    email: String,
    password: { type: String, default: "" },
    role: { type: String, default: "individual" },
    gender: { type: String, required: true },
    isPremium: { type: Boolean, default: false },
    plan: { type: String, default: "free" },
    status: { type: String, default: "active" },
    profileComplete: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fullName: { type: String, required: true },
    dateOfBirth: String,
    age: Number,
    height: String,
    motherTongue: String,
    community: String,
    subCaste: String,
    maritalStatus: { type: String, default: "never_married" },
    hasChildren: { type: Boolean, default: false },
    religion: { type: String, default: "Hindu" },
    gothra: String,
    star: String,
    rashi: String,
    hasDosham: { type: mongoose.Schema.Types.Mixed, default: null },
    familyType: { type: String, default: "nuclear" },
    familyStatus: String,
    fatherOccupation: String,
    motherOccupation: String,
    brothersMarried: { type: Number, default: 0 },
    brothersUnmarried: { type: Number, default: 0 },
    sistersMarried: { type: Number, default: 0 },
    sistersUnmarried: { type: Number, default: 0 },
    highestDegree: String,
    institution: String,
    occupation: String,
    employer: String,
    annualIncome: String,
    workLocation: String,
    diet: { type: String, default: "vegetarian" },
    smoking: { type: String, default: "no" },
    drinking: { type: String, default: "no" },
    hobbies: [String],
    aboutMe: String,
    lookingFor: String,
    photos: [{ url: String, isPrimary: Boolean, order: Number }],
    horoscopeUrl: String,
    verificationStatus: { type: String, default: "unverified" },
    isOnline: { type: Boolean, default: false },
    lastActive: Date,
    profileViews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const partnerPreferencesSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  ageRange: [Number],
  heightRange: [String],
  education: [String],
  occupation: [String],
  communities: [String],
  locations: [String],
  starCompatibility: { type: String, default: "preferred" },
  dosham: { type: String, default: "doesnt_matter" },
  diet: { type: String, default: "doesnt_matter" },
  maritalStatus: [String],
});

const interestSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, default: "pending" },
    note: String,
    respondedAt: Date,
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lastMessage: String,
    lastMessageAt: Date,
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation" },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: String,
    type: { type: String, default: "text" },
    isRead: { type: Boolean, default: false },
    status: { type: String, default: "sent" },
  },
  { timestamps: true }
);

const shortlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    shortlistedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const profileViewSchema = new mongoose.Schema(
  {
    viewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    viewedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const verificationRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: String,
    documentType: String,
    documentUrl: String,
    selfieUrl: String,
    status: { type: String, default: "pending" },
    reviewedAt: Date,
    reviewedBy: String,
    rejectionReason: String,
  },
  { timestamps: true }
);

const reportSchema = new mongoose.Schema(
  {
    reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reportedUserName: String,
    reportedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reportedByUserName: String,
    reason: String,
    description: String,
    status: { type: String, default: "open" },
    resolvedAt: Date,
    resolution: String,
  },
  { timestamps: true }
);

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: String,
    plan: String,
    amount: Number,
    startDate: Date,
    endDate: Date,
    status: { type: String, default: "active" },
    paymentMethod: String,
  },
  { timestamps: true }
);

const adminSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: { type: String, default: "" },
    role: { type: String, default: "super_admin" },
    avatarUrl: String,
    lastLogin: Date,
  },
  { timestamps: true }
);

const activityLogSchema = new mongoose.Schema(
  {
    action: String,
    description: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: String,
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Profile = mongoose.model("Profile", profileSchema);
const PartnerPreferences = mongoose.model("PartnerPreferences", partnerPreferencesSchema);
const Interest = mongoose.model("Interest", interestSchema);
const Conversation = mongoose.model("Conversation", conversationSchema);
const Message = mongoose.model("Message", messageSchema);
const Shortlist = mongoose.model("Shortlist", shortlistSchema);
const ProfileView = mongoose.model("ProfileView", profileViewSchema);
const VerificationRequest = mongoose.model("VerificationRequest", verificationRequestSchema);
const Report = mongoose.model("Report", reportSchema);
const Subscription = mongoose.model("Subscription", subscriptionSchema);
const Admin = mongoose.model("Admin", adminSchema);
const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

/* ============================================================
   Seed Data
   ============================================================ */

const USERS_DATA = [
  { email: "priya.s@email.com", phone: "+91 98765 43210", gender: "female", isPremium: true, plan: "premium_6", status: "active", profileComplete: 95 },
  { email: "karthik.r@email.com", phone: "+91 87654 32109", gender: "male", isPremium: false, plan: "free", status: "active", profileComplete: 80 },
  { email: "meenakshi.v@email.com", phone: "+91 76543 21098", gender: "female", isPremium: true, plan: "premium_3", status: "active", profileComplete: 100 },
  { email: "arun.k@email.com", phone: "+91 65432 10987", gender: "male", isPremium: false, plan: "free", status: "suspended", profileComplete: 60 },
  { email: "divya.k@email.com", phone: "+91 54321 09876", gender: "female", isPremium: true, plan: "premium_12", status: "active", profileComplete: 90 },
  { email: "rajesh.i@email.com", phone: "+91 43210 98765", gender: "male", isPremium: false, plan: "free", status: "banned", profileComplete: 45 },
  { email: "lakshmi.n@email.com", phone: "+91 32109 87654", gender: "female", isPremium: true, plan: "premium_6", status: "active", profileComplete: 88 },
  { email: "senthil.m@email.com", phone: "+91 21098 76543", gender: "male", isPremium: false, plan: "free", status: "active", profileComplete: 70 },
  { email: "anitha.b@email.com", phone: "+91 91234 56789", gender: "female", isPremium: false, plan: "free", status: "active", profileComplete: 55 },
  { email: "vijay.s@email.com", phone: "+91 82345 67890", gender: "male", isPremium: true, plan: "premium_3", status: "active", profileComplete: 92 },
  { email: "deepa.r@email.com", phone: "+91 73456 78901", gender: "female", isPremium: false, plan: "free", status: "active", profileComplete: 65 },
  { email: "ramesh.s@email.com", phone: "+91 64567 89012", gender: "male", isPremium: true, plan: "premium_6", status: "active", profileComplete: 85 },
  { email: "kavitha.m@email.com", phone: "+91 55678 90123", gender: "female", isPremium: false, plan: "free", status: "active", profileComplete: 72 },
  { email: "suresh.b@email.com", phone: "+91 46789 01234", gender: "male", isPremium: false, plan: "free", status: "active", profileComplete: 50 },
  { email: "sangeetha.r@email.com", phone: "+91 37890 12345", gender: "female", isPremium: true, plan: "premium_3", status: "active", profileComplete: 97 },
  { email: "manoj.p@email.com", phone: "+91 28901 23456", gender: "male", isPremium: false, plan: "free", status: "inactive", profileComplete: 30 },
  { email: "nithya.g@email.com", phone: "+91 19012 34567", gender: "female", isPremium: true, plan: "premium_12", status: "active", profileComplete: 98 },
  { email: "prakash.t@email.com", phone: "+91 90123 45678", gender: "male", isPremium: false, plan: "free", status: "active", profileComplete: 68 },
  { email: "vani.k@email.com", phone: "+91 81234 56780", gender: "female", isPremium: true, plan: "premium_6", status: "active", profileComplete: 91 },
  { email: "ganesh.r@email.com", phone: "+91 72345 67891", gender: "male", isPremium: false, plan: "free", status: "active", profileComplete: 58 },
  { email: "revathi.s@email.com", phone: "+91 63456 78902", gender: "female", isPremium: false, plan: "free", status: "active", profileComplete: 42 },
  { email: "balaji.n@email.com", phone: "+91 54567 89013", gender: "male", isPremium: true, plan: "premium_3", status: "active", profileComplete: 82 },
  { email: "sowmya.v@email.com", phone: "+91 45678 90124", gender: "female", isPremium: false, plan: "free", status: "suspended", profileComplete: 75 },
  { email: "harish.c@email.com", phone: "+91 36789 01235", gender: "male", isPremium: false, plan: "free", status: "active", profileComplete: 63 },
];

const PROFILES_DATA = [
  { idx: 0, fullName: "Priya Subramanian", age: 27, height: "5'4\"", motherTongue: "Tamil", community: "Iyer", star: "Ashwini", rashi: "Mesha", occupation: "Software Engineer", employer: "Infosys", annualIncome: "8-10 Lakhs", workLocation: "Chennai", highestDegree: "B.E./B.Tech", institution: "Anna University", diet: "vegetarian", hobbies: ["Music", "Reading", "Travel", "Yoga", "Cooking"], aboutMe: "I am a cheerful and grounded person who values family traditions while embracing modern perspectives.", lookingFor: "Looking for someone who shares similar values and has a positive outlook on life.", familyType: "nuclear", familyStatus: "Upper Middle Class", fatherOccupation: "Retired Government Officer", motherOccupation: "Homemaker", verificationStatus: "verified", isOnline: true, profileViews: 318, maritalStatus: "never_married" },
  { idx: 1, fullName: "Karthik Rajan", age: 30, height: "5'10\"", motherTongue: "Tamil", community: "Iyengar", star: "Bharani", rashi: "Mesha", occupation: "IT Manager", employer: "TCS", annualIncome: "12-15 Lakhs", workLocation: "Bangalore", highestDegree: "M.Tech", institution: "IIT Madras", diet: "vegetarian", hobbies: ["Cricket", "Photography", "Travel"], aboutMe: "A tech enthusiast who loves exploring new places. Grounded in traditions but open-minded.", lookingFor: "Someone who is educated, independent, and values family.", familyType: "nuclear", familyStatus: "Upper Middle Class", fatherOccupation: "Professor", motherOccupation: "Teacher", verificationStatus: "unverified", isOnline: false, profileViews: 120, maritalStatus: "never_married" },
  { idx: 2, fullName: "Meenakshi Venkat", age: 25, height: "5'3\"", motherTongue: "Tamil", community: "Mudaliar", star: "Rohini", rashi: "Vrishabha", occupation: "Doctor", employer: "Apollo Hospital", annualIncome: "10-12 Lakhs", workLocation: "Coimbatore", highestDegree: "MBBS", institution: "Madras Medical College", diet: "vegetarian", hobbies: ["Carnatic Music", "Dancing", "Reading"], aboutMe: "A doctor by profession and an artist at heart. I believe in balancing career and family.", lookingFor: "A well-settled professional who respects traditions.", familyType: "joint", familyStatus: "Rich", fatherOccupation: "Businessman", motherOccupation: "Homemaker", verificationStatus: "verified", isOnline: true, profileViews: 410, maritalStatus: "never_married" },
  { idx: 3, fullName: "Arun Kumar", age: 32, height: "5'9\"", motherTongue: "Tamil", community: "Nadar", star: "Mrigashirsha", rashi: "Mithuna", occupation: "Business/Entrepreneur", annualIncome: "15-20 Lakhs", workLocation: "Madurai", highestDegree: "MBA", institution: "PSG College", diet: "non_vegetarian", hobbies: ["Business", "Cars", "Gym"], aboutMe: "Self-made entrepreneur running a textile business.", lookingFor: "Someone supportive who understands business life.", familyType: "joint", familyStatus: "Rich", fatherOccupation: "Retired Textile Merchant", motherOccupation: "Homemaker", verificationStatus: "unverified", isOnline: false, profileViews: 35, maritalStatus: "never_married" },
  { idx: 4, fullName: "Divya Krishnan", age: 28, height: "5'5\"", motherTongue: "Tamil", community: "Pillai", star: "Punarvasu", rashi: "Karkata", occupation: "Chartered Accountant", employer: "Deloitte", annualIncome: "12-15 Lakhs", workLocation: "Trichy", highestDegree: "CA", institution: "ICAI", diet: "vegetarian", hobbies: ["Bharatanatyam", "Travel", "Cooking"], aboutMe: "A CA who loves art and culture. Family-oriented with a modern outlook.", lookingFor: "An ambitious, well-educated partner from a good family.", familyType: "nuclear", familyStatus: "Upper Middle Class", fatherOccupation: "Bank Manager", motherOccupation: "Teacher", verificationStatus: "verified", isOnline: true, profileViews: 520, maritalStatus: "never_married" },
  { idx: 5, fullName: "Rajesh Iyer", age: 35, height: "5'8\"", motherTongue: "Tamil", community: "Iyer", star: "Pushya", rashi: "Karkata", occupation: "Freelancer", annualIncome: "3-5 Lakhs", workLocation: "Hyderabad", highestDegree: "B.Com", institution: "Loyola College", diet: "vegetarian", hobbies: ["Movies", "Gaming"], aboutMe: "Simple person looking for a life partner.", lookingFor: "Someone kind and understanding.", familyType: "nuclear", familyStatus: "Middle Class", fatherOccupation: "Clerk", motherOccupation: "Homemaker", verificationStatus: "unverified", isOnline: false, profileViews: 15, maritalStatus: "divorced" },
  { idx: 6, fullName: "Lakshmi Narayanan", age: 26, height: "5'6\"", motherTongue: "Tamil", community: "Chettiar", star: "Magha", rashi: "Simha", occupation: "Banking Professional", employer: "SBI", annualIncome: "6-8 Lakhs", workLocation: "Salem", highestDegree: "MBA", institution: "Bharathiar University", diet: "vegetarian", hobbies: ["Reading", "Gardening", "Yoga"], aboutMe: "Banking professional who loves nature and reading. Values honesty and simplicity.", lookingFor: "A sincere and family-oriented partner.", familyType: "nuclear", familyStatus: "Upper Middle Class", fatherOccupation: "School Principal", motherOccupation: "Homemaker", verificationStatus: "verified", isOnline: false, profileViews: 275, maritalStatus: "never_married" },
  { idx: 7, fullName: "Senthil Murugan", age: 29, height: "5'11\"", motherTongue: "Tamil", community: "Gounder", star: "Uttara Phalguni", rashi: "Kanya", occupation: "Software Engineer", employer: "Wipro", annualIncome: "8-10 Lakhs", workLocation: "Erode", highestDegree: "B.E./B.Tech", institution: "PSG Tech", diet: "non_vegetarian", hobbies: ["Football", "Movies", "Cooking"], aboutMe: "Software engineer who loves sports and cooking. Believes in equality.", lookingFor: "An understanding and adventurous partner.", familyType: "joint", familyStatus: "Middle Class", fatherOccupation: "Farmer", motherOccupation: "Homemaker", verificationStatus: "unverified", isOnline: false, profileViews: 65, maritalStatus: "never_married" },
  { idx: 8, fullName: "Anitha Balachander", age: 24, height: "5'2\"", motherTongue: "Tamil", community: "Iyer", star: "Hasta", rashi: "Kanya", occupation: "Teacher", employer: "DAV School", annualIncome: "3-5 Lakhs", workLocation: "Chennai", highestDegree: "M.Ed", institution: "University of Madras", diet: "vegetarian", hobbies: ["Teaching", "Kolam", "Singing"], aboutMe: "A teacher who is passionate about education and children.", lookingFor: "A kind-hearted, well-settled person.", familyType: "nuclear", familyStatus: "Middle Class", fatherOccupation: "Accountant", motherOccupation: "Homemaker", verificationStatus: "unverified", isOnline: true, profileViews: 88, maritalStatus: "never_married" },
  { idx: 9, fullName: "Vijay Shankar", age: 31, height: "5'10\"", motherTongue: "Tamil", community: "Iyengar", star: "Swati", rashi: "Tula", occupation: "Doctor", employer: "AIIMS", annualIncome: "15-20 Lakhs", workLocation: "Bangalore", highestDegree: "MD", institution: "JIPMER", diet: "vegetarian", hobbies: ["Tennis", "Music", "Travel"], aboutMe: "A doctor who believes in serving the community. Values family bonding.", lookingFor: "An educated partner who understands the demanding nature of medical profession.", familyType: "nuclear", familyStatus: "Upper Middle Class", fatherOccupation: "Retired Doctor", motherOccupation: "Professor", verificationStatus: "verified", isOnline: true, profileViews: 180, maritalStatus: "never_married" },
  { idx: 10, fullName: "Deepa Ranganathan", age: 29, height: "5'3\"", motherTongue: "Tamil", community: "Mudaliar", star: "Anuradha", rashi: "Vrischika", occupation: "Scientist/Researcher", employer: "ISRO", annualIncome: "10-12 Lakhs", workLocation: "Madurai", highestDegree: "Ph.D", institution: "IISc Bangalore", diet: "vegetarian", hobbies: ["Research", "Astronomy", "Trekking"], aboutMe: "A researcher who is passionate about space science. Love exploring nature.", lookingFor: "An intellectually curious partner.", familyType: "nuclear", familyStatus: "Upper Middle Class", fatherOccupation: "Engineer", motherOccupation: "Lecturer", verificationStatus: "unverified", isOnline: false, profileViews: 145, maritalStatus: "never_married" },
  { idx: 11, fullName: "Ramesh Sundaram", age: 34, height: "5'9\"", motherTongue: "Tamil", community: "Chettiar", star: "Jyeshtha", rashi: "Vrischika", occupation: "Business/Entrepreneur", employer: "Self-employed", annualIncome: "20-30 Lakhs", workLocation: "Coimbatore", highestDegree: "MBA", institution: "IIM Bangalore", diet: "vegetarian", hobbies: ["Business", "Golf", "Reading"], aboutMe: "Running a successful export business. Family-oriented and traditional.", lookingFor: "A cultured partner from a good family.", familyType: "joint", familyStatus: "Affluent", fatherOccupation: "Businessman", motherOccupation: "Homemaker", verificationStatus: "verified", isOnline: false, profileViews: 210, maritalStatus: "never_married" },
  { idx: 12, fullName: "Kavitha Moorthy", age: 27, height: "5'4\"", motherTongue: "Tamil", community: "Nadar", star: "Moola", rashi: "Dhanu", occupation: "Lawyer/Legal", annualIncome: "8-10 Lakhs", workLocation: "Tirunelveli", highestDegree: "LLB", institution: "NLS Bangalore", diet: "non_vegetarian", hobbies: ["Debate", "Reading", "Social Service"], aboutMe: "A lawyer passionate about justice. Believes in gender equality.", lookingFor: "A progressive, open-minded partner.", familyType: "nuclear", familyStatus: "Middle Class", fatherOccupation: "Advocate", motherOccupation: "Social Worker", verificationStatus: "unverified", isOnline: false, profileViews: 95, maritalStatus: "never_married" },
  { idx: 13, fullName: "Suresh Babu", age: 28, height: "5'8\"", motherTongue: "Tamil", community: "Pillai", star: "Uttara Ashadha", rashi: "Makara", occupation: "Government Employee", employer: "State Government", annualIncome: "5-8 Lakhs", workLocation: "Chennai", highestDegree: "B.Sc", institution: "Madras University", diet: "non_vegetarian", hobbies: ["Cricket", "Movies", "Gym"], aboutMe: "Government employee with a stable career. Simple and honest.", lookingFor: "A simple, homely partner.", familyType: "nuclear", familyStatus: "Middle Class", fatherOccupation: "Retired Army", motherOccupation: "Homemaker", verificationStatus: "unverified", isOnline: false, profileViews: 40, maritalStatus: "never_married" },
  { idx: 14, fullName: "Sangeetha Ravi", age: 26, height: "5'5\"", motherTongue: "Tamil", community: "Gounder", star: "Shravana", rashi: "Makara", occupation: "Architect", employer: "L&T", annualIncome: "10-12 Lakhs", workLocation: "Erode", highestDegree: "B.Arch", institution: "SPA Delhi", diet: "vegetarian", hobbies: ["Architecture", "Painting", "Travel"], aboutMe: "An architect who loves creating beautiful spaces. Creative and family-oriented.", lookingFor: "A creative, supportive partner.", familyType: "nuclear", familyStatus: "Upper Middle Class", fatherOccupation: "Civil Engineer", motherOccupation: "Homemaker", verificationStatus: "verified", isOnline: true, profileViews: 380, maritalStatus: "never_married" },
  { idx: 15, fullName: "Manoj Prabhu", age: 33, height: "5'7\"", motherTongue: "Tamil", community: "Iyer", star: "Dhanishta", rashi: "Makara", occupation: "Teacher/Professor", annualIncome: "3-5 Lakhs", workLocation: "Trichy", highestDegree: "M.A.", institution: "BHU", diet: "vegetarian", hobbies: ["Reading", "Writing"], aboutMe: "A Tamil literature professor. Quiet and thoughtful.", lookingFor: "An educated partner who values knowledge.", familyType: "nuclear", familyStatus: "Middle Class", fatherOccupation: "Priest", motherOccupation: "Homemaker", verificationStatus: "unverified", isOnline: false, profileViews: 8, maritalStatus: "never_married" },
  { idx: 16, fullName: "Nithya Ganesh", age: 25, height: "5'4\"", motherTongue: "Tamil", community: "Iyengar", star: "Shatabhisha", rashi: "Kumbha", occupation: "Software Engineer", employer: "Google", annualIncome: "25-30 Lakhs", workLocation: "Bangalore", highestDegree: "M.S.", institution: "Stanford University", diet: "vegetarian", hobbies: ["Coding", "Carnatic Music", "Travel", "Yoga"], aboutMe: "Software engineer at Google. Love technology and classical music equally.", lookingFor: "An ambitious, cultured partner from a good Brahmin family.", familyType: "nuclear", familyStatus: "Affluent", fatherOccupation: "IAS Officer", motherOccupation: "Doctor", verificationStatus: "verified", isOnline: true, profileViews: 640, maritalStatus: "never_married" },
  { idx: 17, fullName: "Prakash Thiagarajan", age: 30, height: "5'9\"", motherTongue: "Tamil", community: "Mudaliar", star: "Purva Bhadrapada", rashi: "Kumbha", occupation: "Civil Services (IAS/IPS)", annualIncome: "8-10 Lakhs", workLocation: "Salem", highestDegree: "B.E./B.Tech", institution: "NIT Trichy", diet: "vegetarian", hobbies: ["Politics", "Reading", "Running"], aboutMe: "Aspiring civil servant preparing for UPSC. Disciplined and goal-oriented.", lookingFor: "A supportive partner who understands public service.", familyType: "nuclear", familyStatus: "Middle Class", fatherOccupation: "Farmer", motherOccupation: "Homemaker", verificationStatus: "unverified", isOnline: false, profileViews: 52, maritalStatus: "never_married" },
  { idx: 18, fullName: "Vani Krishnamurthy", age: 30, height: "5'3\"", motherTongue: "Tamil", community: "Iyer", star: "Uttara Bhadrapada", rashi: "Meena", occupation: "Doctor", employer: "AIIMS", annualIncome: "15-20 Lakhs", workLocation: "Hyderabad", highestDegree: "MS (Surgery)", institution: "CMC Vellore", diet: "vegetarian", hobbies: ["Music", "Travel", "Cooking"], aboutMe: "A surgeon who loves music and travel. Family values are important to me.", lookingFor: "A well-settled professional from a Brahmin family.", familyType: "nuclear", familyStatus: "Upper Middle Class", fatherOccupation: "Professor", motherOccupation: "Musician", verificationStatus: "verified", isOnline: true, profileViews: 290, maritalStatus: "never_married" },
  { idx: 19, fullName: "Ganesh Ramanujam", age: 27, height: "5'10\"", motherTongue: "Tamil", community: "Chettiar", star: "Revati", rashi: "Meena", occupation: "Banking Professional", employer: "HDFC Bank", annualIncome: "6-8 Lakhs", workLocation: "Coimbatore", highestDegree: "MBA", institution: "XLRI", diet: "vegetarian", hobbies: ["Cricket", "Music", "Investing"], aboutMe: "A banking professional who loves cricket and music. Simple lifestyle.", lookingFor: "A partner who values honesty and simplicity.", familyType: "nuclear", familyStatus: "Middle Class", fatherOccupation: "Shopkeeper", motherOccupation: "Homemaker", verificationStatus: "unverified", isOnline: true, profileViews: 28, maritalStatus: "never_married" },
  { idx: 20, fullName: "Revathi Sundaresan", age: 23, height: "5'2\"", motherTongue: "Tamil", community: "Pillai", star: "Ashwini", rashi: "Mesha", occupation: "Student", annualIncome: "Not Working", workLocation: "Chennai", highestDegree: "B.E./B.Tech", institution: "SRM University", diet: "non_vegetarian", hobbies: ["Dancing", "Painting", "Social Media"], aboutMe: "Final year engineering student. Fun-loving and creative.", lookingFor: "A caring partner with a good sense of humour.", familyType: "nuclear", familyStatus: "Middle Class", fatherOccupation: "Police Inspector", motherOccupation: "Nurse", verificationStatus: "unverified", isOnline: false, profileViews: 55, maritalStatus: "never_married" },
  { idx: 21, fullName: "Balaji Natarajan", age: 36, height: "5'11\"", motherTongue: "Tamil", community: "Nadar", star: "Bharani", rashi: "Mesha", occupation: "Business/Entrepreneur", employer: "Self-employed", annualIncome: "20-30 Lakhs", workLocation: "Madurai", highestDegree: "MBA", institution: "IIM Calcutta", diet: "non_vegetarian", hobbies: ["Business", "Travel", "Cars"], aboutMe: "Successful businessman with a chain of hotels. Family-oriented.", lookingFor: "A cultured, well-educated partner.", familyType: "joint", familyStatus: "Affluent", fatherOccupation: "Hotelier", motherOccupation: "Homemaker", verificationStatus: "verified", isOnline: true, profileViews: 155, maritalStatus: "never_married" },
  { idx: 22, fullName: "Sowmya Venkatesh", age: 28, height: "5'4\"", motherTongue: "Tamil", community: "Gounder", star: "Krittika", rashi: "Vrishabha", occupation: "Teacher/Professor", employer: "Govt. College", annualIncome: "5-8 Lakhs", workLocation: "Erode", highestDegree: "M.Phil", institution: "Bharathiar University", diet: "vegetarian", hobbies: ["Teaching", "Writing", "Gardening"], aboutMe: "A college professor who loves sharing knowledge. Simple living, high thinking.", lookingFor: "A kind, family-oriented partner.", familyType: "nuclear", familyStatus: "Middle Class", fatherOccupation: "Teacher", motherOccupation: "Homemaker", verificationStatus: "unverified", isOnline: false, profileViews: 160, maritalStatus: "never_married" },
  { idx: 23, fullName: "Harish Chandran", age: 29, height: "5'8\"", motherTongue: "Tamil", community: "Iyer", star: "Rohini", rashi: "Vrishabha", occupation: "Software Engineer", employer: "Amazon", annualIncome: "15-20 Lakhs", workLocation: "Bangalore", highestDegree: "M.Tech", institution: "IIT Bombay", diet: "vegetarian", hobbies: ["Coding", "Chess", "Gym"], aboutMe: "A tech enthusiast working at Amazon. Love solving complex problems.", lookingFor: "An intelligent, ambitious partner.", familyType: "nuclear", familyStatus: "Upper Middle Class", fatherOccupation: "Retired Bank Manager", motherOccupation: "Homemaker", verificationStatus: "unverified", isOnline: false, profileViews: 38, maritalStatus: "never_married" },
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected!\n");

  // Drop existing collections
  const collections = await mongoose.connection.db!.listCollections().toArray();
  for (const col of collections) {
    await mongoose.connection.db!.dropCollection(col.name);
    console.log(`  Dropped collection: ${col.name}`);
  }
  console.log("");

  // 1. Create Users
  console.log("Creating users...");
  const users = await User.insertMany(USERS_DATA);
  console.log(`  Created ${users.length} users`);

  // 2. Create Profiles
  console.log("Creating profiles...");
  const profileDocs = PROFILES_DATA.map((p) => ({
    userId: users[p.idx]._id,
    fullName: p.fullName,
    dateOfBirth: `${2026 - p.age}-03-15`,
    age: p.age,
    height: p.height,
    motherTongue: p.motherTongue,
    community: p.community,
    maritalStatus: p.maritalStatus,
    hasChildren: false,
    religion: "Hindu",
    star: p.star,
    rashi: p.rashi,
    hasDosham: null,
    familyType: p.familyType,
    familyStatus: p.familyStatus,
    fatherOccupation: p.fatherOccupation,
    motherOccupation: p.motherOccupation,
    highestDegree: p.highestDegree,
    institution: p.institution,
    occupation: p.occupation,
    employer: p.employer,
    annualIncome: p.annualIncome,
    workLocation: p.workLocation,
    diet: p.diet,
    smoking: "no",
    drinking: "no",
    hobbies: p.hobbies,
    aboutMe: p.aboutMe,
    lookingFor: p.lookingFor,
    photos: [],
    verificationStatus: p.verificationStatus,
    isOnline: p.isOnline,
    lastActive: new Date(),
    profileViews: p.profileViews,
  }));
  const profiles = await Profile.insertMany(profileDocs);
  console.log(`  Created ${profiles.length} profiles`);

  // 3. Partner Preferences (for first 10 users)
  console.log("Creating partner preferences...");
  const prefsDocs = users.slice(0, 10).map((u: any, i: number) => ({
    userId: u._id,
    ageRange: u.gender === "female" ? [26, 35] : [22, 30],
    heightRange: u.gender === "female" ? ["5'6\"", "6'2\""] : ["5'0\"", "5'6\""],
    education: ["B.E./B.Tech", "MBBS", "MBA", "CA"],
    occupation: [],
    communities: [PROFILES_DATA[i].community],
    locations: [PROFILES_DATA[i].workLocation],
    starCompatibility: "preferred",
    dosham: "doesnt_matter",
    diet: "doesnt_matter",
    maritalStatus: ["never_married"],
  }));
  await PartnerPreferences.insertMany(prefsDocs);
  console.log(`  Created ${prefsDocs.length} partner preferences`);

  // 4. Interests
  console.log("Creating interests...");
  const interestDocs = [
    { fromUserId: users[1]._id, toUserId: users[0]._id, status: "pending", note: "Hi, I found your profile interesting. Our families seem to share similar values." },
    { fromUserId: users[9]._id, toUserId: users[0]._id, status: "pending", note: "Your profile and horoscope details match really well. Would love to connect!" },
    { fromUserId: users[0]._id, toUserId: users[2]._id, status: "pending", note: "Hi! I noticed we are from similar backgrounds." },
    { fromUserId: users[0]._id, toUserId: users[4]._id, status: "pending" },
    { fromUserId: users[6]._id, toUserId: users[0]._id, status: "accepted", note: "We share the same community and our stars match perfectly!", respondedAt: new Date(Date.now() - 8 * 86400000) },
    { fromUserId: users[0]._id, toUserId: users[14]._id, status: "accepted", respondedAt: new Date(Date.now() - 12 * 86400000) },
    { fromUserId: users[7]._id, toUserId: users[2]._id, status: "pending", note: "Namaskaram! Our family values match well." },
    { fromUserId: users[9]._id, toUserId: users[4]._id, status: "accepted", respondedAt: new Date(Date.now() - 5 * 86400000) },
    { fromUserId: users[11]._id, toUserId: users[16]._id, status: "pending", note: "Your profile impressed us. Would love to discuss further." },
    { fromUserId: users[19]._id, toUserId: users[14]._id, status: "declined" },
  ];
  await Interest.insertMany(interestDocs);
  console.log(`  Created ${interestDocs.length} interests`);

  // 5. Conversations & Messages
  console.log("Creating conversations and messages...");
  const conv1 = await Conversation.create({
    participants: [users[0]._id, users[6]._id],
    lastMessage: "Thank you! When would be a good time to talk?",
    lastMessageAt: new Date(),
  });
  const conv2 = await Conversation.create({
    participants: [users[0]._id, users[4]._id],
    lastMessage: "Sure, let me check with my family and get back to you.",
    lastMessageAt: new Date(Date.now() - 3600000),
  });
  const conv3 = await Conversation.create({
    participants: [users[0]._id, users[2]._id],
    lastMessage: "Hi! I noticed we have matching stars. Shall we discuss?",
    lastMessageAt: new Date(Date.now() - 3 * 86400000),
  });

  const chatMessages = [
    { conversationId: conv1._id, senderId: users[6]._id, content: "Hi! I came across your profile and really liked it. Our horoscopes seem compatible too!", isRead: true, status: "read" },
    { conversationId: conv1._id, senderId: users[0]._id, content: "Hello! Thank you for reaching out. I noticed we are from the same community.", isRead: true, status: "read" },
    { conversationId: conv1._id, senderId: users[6]._id, content: "Yes! My family is originally from Thanjavur. What about yours?", isRead: true, status: "read" },
    { conversationId: conv1._id, senderId: users[0]._id, content: "We are from Kumbakonam. It's nice to connect with someone from a similar background.", isRead: true, status: "read" },
    { conversationId: conv1._id, senderId: users[6]._id, content: "I checked the porutham and 8 out of 10 match! My parents are very happy about it.", isRead: true, status: "read" },
    { conversationId: conv1._id, senderId: users[0]._id, content: "That's great to hear! Would your family be open to a video call first?", isRead: true, status: "delivered" },
    { conversationId: conv1._id, senderId: users[6]._id, content: "Absolutely! My parents would love to talk to your family. When would be a good time?", isRead: false, status: "delivered" },
    { conversationId: conv1._id, senderId: users[6]._id, content: "Thank you! When would be a good time to talk?", isRead: false, status: "delivered" },
    { conversationId: conv2._id, senderId: users[4]._id, content: "Sure, let me check with my family and get back to you.", isRead: true, status: "read" },
    { conversationId: conv3._id, senderId: users[2]._id, content: "Hi! I noticed we have matching stars. Shall we discuss?", isRead: true, status: "read" },
  ];
  await Message.insertMany(chatMessages);
  console.log(`  Created 3 conversations, ${chatMessages.length} messages`);

  // 6. Shortlists
  console.log("Creating shortlists...");
  const shortlistDocs = [
    { userId: users[0]._id, shortlistedUserId: users[1]._id },
    { userId: users[0]._id, shortlistedUserId: users[2]._id },
    { userId: users[0]._id, shortlistedUserId: users[4]._id },
    { userId: users[0]._id, shortlistedUserId: users[9]._id },
    { userId: users[0]._id, shortlistedUserId: users[14]._id },
    { userId: users[2]._id, shortlistedUserId: users[0]._id },
    { userId: users[4]._id, shortlistedUserId: users[0]._id },
    { userId: users[9]._id, shortlistedUserId: users[0]._id },
  ];
  await Shortlist.insertMany(shortlistDocs);
  console.log(`  Created ${shortlistDocs.length} shortlists`);

  // 7. Profile Views
  console.log("Creating profile views...");
  const viewDocs = [
    { viewerId: users[1]._id, viewedUserId: users[0]._id },
    { viewerId: users[9]._id, viewedUserId: users[0]._id },
    { viewerId: users[2]._id, viewedUserId: users[0]._id },
    { viewerId: users[11]._id, viewedUserId: users[0]._id },
    { viewerId: users[7]._id, viewedUserId: users[0]._id },
    { viewerId: users[19]._id, viewedUserId: users[0]._id },
    { viewerId: users[0]._id, viewedUserId: users[2]._id },
    { viewerId: users[0]._id, viewedUserId: users[4]._id },
    { viewerId: users[0]._id, viewedUserId: users[16]._id },
  ];
  await ProfileView.insertMany(viewDocs);
  console.log(`  Created ${viewDocs.length} profile views`);

  // 8. Verification Requests
  console.log("Creating verification requests...");
  const verDocs = [
    { userId: users[1]._id, userName: "Karthik Rajan", documentType: "aadhaar", documentUrl: "/mock/doc-aadhaar.jpg", selfieUrl: "/mock/selfie-karthik.jpg", status: "pending" },
    { userId: users[7]._id, userName: "Senthil Murugan", documentType: "driving_license", documentUrl: "/mock/doc-dl.jpg", selfieUrl: "/mock/selfie-senthil.jpg", status: "pending" },
    { userId: users[0]._id, userName: "Priya Subramanian", documentType: "passport", documentUrl: "/mock/doc-passport.jpg", selfieUrl: "/mock/selfie-priya.jpg", status: "approved", reviewedAt: new Date("2025-12-12"), reviewedBy: "Admin" },
    { userId: users[5]._id, userName: "Rajesh Iyer", documentType: "voter_id", documentUrl: "/mock/doc-voter.jpg", selfieUrl: "/mock/selfie-rajesh.jpg", status: "rejected", reviewedAt: new Date("2025-12-22"), reviewedBy: "Admin", rejectionReason: "Document image is blurry and unreadable" },
  ];
  await VerificationRequest.insertMany(verDocs);
  console.log(`  Created ${verDocs.length} verification requests`);

  // 9. Reports
  console.log("Creating reports...");
  const reportDocs = [
    { reportedUserId: users[3]._id, reportedUserName: "Arun Kumar", reportedByUserId: users[0]._id, reportedByUserName: "Priya Subramanian", reason: "harassment", description: "Sent multiple inappropriate messages after declining interest", status: "open" },
    { reportedUserId: users[5]._id, reportedUserName: "Rajesh Iyer", reportedByUserId: users[2]._id, reportedByUserName: "Meenakshi Venkat", reason: "fake_profile", description: "Profile photos appear to be stolen from another person", status: "open" },
    { reportedUserId: users[3]._id, reportedUserName: "Arun Kumar", reportedByUserId: users[4]._id, reportedByUserName: "Divya Krishnan", reason: "spam", description: "Sending mass copy-paste messages to all female users", status: "open" },
    { reportedUserId: users[5]._id, reportedUserName: "Rajesh Iyer", reportedByUserId: users[6]._id, reportedByUserName: "Lakshmi Narayanan", reason: "inappropriate_photos", description: "Uploaded inappropriate content as profile photos", status: "resolved", resolvedAt: new Date("2026-02-22"), resolution: "User banned after review" },
  ];
  await Report.insertMany(reportDocs);
  console.log(`  Created ${reportDocs.length} reports`);

  // 10. Subscriptions
  console.log("Creating subscriptions...");
  const subDocs = [
    { userId: users[0]._id, userName: "Priya Subramanian", plan: "premium_6", amount: 4494, startDate: new Date("2025-12-01"), endDate: new Date("2026-06-01"), status: "active", paymentMethod: "UPI" },
    { userId: users[2]._id, userName: "Meenakshi Venkat", plan: "premium_3", amount: 2697, startDate: new Date("2026-01-15"), endDate: new Date("2026-04-15"), status: "active", paymentMethod: "Card" },
    { userId: users[4]._id, userName: "Divya Krishnan", plan: "premium_12", amount: 7188, startDate: new Date("2025-09-01"), endDate: new Date("2026-09-01"), status: "active", paymentMethod: "Net Banking" },
    { userId: users[6]._id, userName: "Lakshmi Narayanan", plan: "premium_6", amount: 4494, startDate: new Date("2025-11-01"), endDate: new Date("2026-05-01"), status: "active", paymentMethod: "UPI" },
    { userId: users[9]._id, userName: "Vijay Shankar", plan: "premium_3", amount: 2697, startDate: new Date("2026-01-01"), endDate: new Date("2026-04-01"), status: "active", paymentMethod: "Card" },
    { userId: users[11]._id, userName: "Ramesh Sundaram", plan: "premium_6", amount: 4494, startDate: new Date("2025-10-15"), endDate: new Date("2026-04-15"), status: "active", paymentMethod: "UPI" },
    { userId: users[14]._id, userName: "Sangeetha Ravi", plan: "premium_3", amount: 2697, startDate: new Date("2025-12-01"), endDate: new Date("2026-03-01"), status: "expired", paymentMethod: "Card" },
    { userId: users[16]._id, userName: "Nithya Ganesh", plan: "premium_12", amount: 7188, startDate: new Date("2025-09-15"), endDate: new Date("2026-09-15"), status: "active", paymentMethod: "Net Banking" },
    { userId: users[18]._id, userName: "Vani Krishnamurthy", plan: "premium_6", amount: 4494, startDate: new Date("2025-11-10"), endDate: new Date("2026-05-10"), status: "active", paymentMethod: "UPI" },
    { userId: users[21]._id, userName: "Balaji Natarajan", plan: "premium_3", amount: 2697, startDate: new Date("2026-01-20"), endDate: new Date("2026-04-20"), status: "active", paymentMethod: "Card" },
  ];
  await Subscription.insertMany(subDocs);
  console.log(`  Created ${subDocs.length} subscriptions`);

  // 11. Admin
  console.log("Creating admin user...");
  await Admin.create({
    name: "Admin User",
    email: "admin@thirumangalyam.com",
    password: "admin123",
    role: "super_admin",
    lastLogin: new Date(),
  });
  console.log("  Created 1 admin");

  // 12. Activity Log
  console.log("Creating activity log...");
  const logDocs = [
    { action: "user_registered", description: "New user registered", userId: users[7]._id, userName: "Senthil Murugan" },
    { action: "verification_submitted", description: "Verification request submitted", userId: users[7]._id, userName: "Senthil Murugan" },
    { action: "report_filed", description: "User reported for harassment", userId: users[3]._id, userName: "Arun Kumar" },
    { action: "subscription_purchased", description: "Premium 6-month plan purchased", userId: users[6]._id, userName: "Lakshmi Narayanan" },
    { action: "user_banned", description: "User banned after multiple reports", userId: users[5]._id, userName: "Rajesh Iyer" },
    { action: "premium_upgrade", description: "Upgraded to Premium 12M plan", userId: users[16]._id, userName: "Nithya Ganesh" },
    { action: "user_registered", description: "New user registered", userId: users[20]._id, userName: "Revathi Sundaresan" },
    { action: "verification_approved", description: "Identity verification approved", userId: users[21]._id, userName: "Balaji Natarajan" },
  ];
  await ActivityLog.insertMany(logDocs);
  console.log(`  Created ${logDocs.length} activity logs`);

  console.log("\n=== Seed complete! ===");
  console.log(`
Collections created:
  - users (${users.length})
  - profiles (${profiles.length})
  - partnerpreferences (${prefsDocs.length})
  - interests (${interestDocs.length})
  - conversations (3)
  - messages (${chatMessages.length})
  - shortlists (${shortlistDocs.length})
  - profileviews (${viewDocs.length})
  - verificationrequests (${verDocs.length})
  - reports (${reportDocs.length})
  - subscriptions (${subDocs.length})
  - admins (1)
  - activitylogs (${logDocs.length})
`);

  await mongoose.disconnect();
  console.log("Disconnected. Done!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
