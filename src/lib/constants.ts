/* ============================================================
   Thirumangalyam — App Constants & Dropdown Options
   ============================================================ */

export const APP_NAME = "Thirumangalyam";
export const APP_TAGLINE = "Find Your Life Partner the Traditional Way, Made Simple";

export const MOTHER_TONGUES = [
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Tulu",
  "Konkani",
] as const;

export const COMMUNITIES = [
  "Brahmin - Iyer",
  "Brahmin - Iyengar",
  "Mudaliar",
  "Nadar",
  "Gounder",
  "Chettiar",
  "Pillai",
  "Vanniyar",
  "Thevar",
  "Naidu",
  "Nair",
  "Ezhava",
  "Menon",
  "Reddy",
  "Kamma",
  "Kapu",
  "Lingayat",
  "Vokkaliga",
  "Bunts",
  "Goud Saraswat",
  "Other",
] as const;

export const SUB_COMMUNITIES: Record<string, string[]> = {
  "Brahmin - Iyer": ["Vadama", "Brahacharanam", "Ashtasahasram", "Vathima", "Gurukkal", "Other"],
  "Brahmin - Iyengar": ["Vadakalai", "Thenkalai", "Other"],
  "Mudaliar": ["Sengunthar Mudaliar", "Agamudayar Mudaliar", "Arcot Mudaliar", "Thuluva Vellalar", "Saiva Mudaliar", "Other"],
  "Nadar": ["Hindu Nadar", "Christian Nadar", "Gramani", "Other"],
  "Gounder": ["Kongu Vellala Gounder", "Vanniya Gounder", "Nattu Gounder", "Vettuva Gounder", "Urali Gounder", "Other"],
  "Chettiar": ["Nagarathar (Nattukotai)", "Arya Vysya", "Devanga Chettiar", "Kongu Chettiar", "Other"],
  "Pillai": ["Nair Pillai", "Saiva Pillai", "Vellalar Pillai", "Other"],
  "Vanniyar": ["Vanniya Kula Kshatriya", "Padayachi", "Gounder (Vanniyar)", "Other"],
  "Thevar": ["Maravar", "Kallar", "Agamudayar", "Mukkulathor", "Other"],
  "Naidu": ["Balija Naidu", "Kamma Naidu", "Gavara Naidu", "Telugu Naidu", "Other"],
  "Nair": ["Menon", "Kurup", "Pillai (Nair)", "Panicker", "Unnithan", "Other"],
  "Ezhava": ["Thiyya", "Billava", "Ezhava", "Other"],
  "Menon": ["Nair Menon", "Other"],
  "Reddy": ["Kapu Reddy", "Panta Reddy", "Motati Reddy", "Deshmukh Reddy", "Other"],
  "Kamma": ["Kamma Naidu", "Kamma Chowdary", "Other"],
  "Kapu": ["Balija", "Telaga", "Ontari", "Munnuru Kapu", "Other"],
  "Lingayat": ["Jangama", "Banajiga", "Sadar Lingayat", "Panchamasali", "Other"],
  "Vokkaliga": ["Gangadikar", "Morasu", "Namadhari", "Hallikar", "Other"],
  "Bunts": ["Nadava", "Jain Bunt", "Other"],
  "Goud Saraswat": ["Goud Saraswat Brahmin", "Chitrapur Saraswat", "Rajapur Saraswat", "Other"],
  "Other": ["Other"],
};

export const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
] as const;

export const EDUCATION_LEVELS = [
  { group: "Doctorate", options: ["Ph.D.", "M.D.", "M.Ch."] },
  { group: "Post Graduate", options: ["M.E./M.Tech", "MBA/PGDM", "M.Sc.", "MA", "MCA", "M.Com", "LLM"] },
  { group: "Under Graduate", options: ["B.E./B.Tech", "BBA/BBM", "B.Sc.", "BA", "BCA", "B.Com", "LLB", "MBBS", "BDS"] },
  { group: "Diploma", options: ["Diploma", "ITI"] },
  { group: "Other", options: ["HSC (12th)", "Other"] },
] as const;

export const OCCUPATIONS = [
  "Software Professional",
  "Doctor",
  "Engineer",
  "Business/Entrepreneur",
  "Government Employee",
  "Teacher/Professor",
  "Chartered Accountant",
  "Lawyer/Legal",
  "Banking Professional",
  "Scientist/Researcher",
  "Defence/Armed Forces",
  "Civil Services (IAS/IPS)",
  "Architect",
  "Pilot",
  "Others",
] as const;

export const INCOME_RANGES = [
  "Below 2 Lakhs",
  "2-4 Lakhs",
  "4-6 Lakhs",
  "6-8 Lakhs",
  "8-10 Lakhs",
  "10-15 Lakhs",
  "15-20 Lakhs",
  "20-30 Lakhs",
  "30-50 Lakhs",
  "50 Lakhs - 1 Crore",
  "Above 1 Crore",
  "Prefer not to say",
] as const;

export const HOBBIES = [
  "Music",
  "Dance",
  "Reading",
  "Travel",
  "Cooking",
  "Sports",
  "Yoga",
  "Photography",
  "Painting",
  "Movies",
  "Gaming",
  "Gardening",
  "Volunteering",
  "Writing",
] as const;

export const HEIGHT_OPTIONS = (() => {
  const heights: string[] = [];
  for (let ft = 4; ft <= 6; ft++) {
    for (let inch = 0; inch <= 11; inch++) {
      heights.push(`${ft}'${inch}"`);
      if (ft === 6 && inch === 6) break;
    }
  }
  return heights;
})();

/* ============================================================
   Location Data — States, Districts & Cities
   ============================================================ */
export const STATES = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Maharashtra",
  "Delhi",
  "Gujarat",
  "Rajasthan",
  "Uttar Pradesh",
  "West Bengal",
  "Punjab",
  "Haryana",
  "Madhya Pradesh",
  "Bihar",
  "Odisha",
  "Goa",
  "Pondicherry",
  "Abroad",
] as const;

export const STATE_CITIES: Record<string, string[]> = {
  "Tamil Nadu": [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Trichy (Tiruchirappalli)",
    "Salem",
    "Tirunelveli",
    "Erode",
    "Vellore",
    "Thoothukudi (Tuticorin)",
    "Dindigul",
    "Thanjavur",
    "Tiruppur",
    "Ranipet",
    "Sivakasi",
    "Karur",
    "Nagercoil",
    "Kanchipuram",
    "Kumbakonam",
    "Cuddalore",
    "Nagapattinam",
    "Pollachi",
    "Rajapalayam",
    "Hosur",
    "Ambur",
    "Namakkal",
    "Virudhunagar",
    "Krishnagiri",
    "Dharmapuri",
    "Theni",
    "Pudukkottai",
    "Ariyalur",
    "Perambalur",
    "Nilgiris (Ooty)",
    "Tiruvannamalai",
    "Villupuram",
    "Chidambaram",
    "Arakkonam",
  ],
  "Kerala": [
    "Thiruvananthapuram",
    "Kochi (Ernakulam)",
    "Kozhikode (Calicut)",
    "Thrissur",
    "Kollam",
    "Palakkad",
    "Alappuzha",
    "Kannur",
    "Kottayam",
    "Malappuram",
    "Idukki",
    "Pathanamthitta",
    "Wayanad",
    "Kasaragod",
  ],
  "Karnataka": [
    "Bangalore",
    "Mysore",
    "Mangalore",
    "Hubli-Dharwad",
    "Belgaum (Belagavi)",
    "Gulbarga (Kalaburagi)",
    "Davangere",
    "Shimoga",
    "Tumkur",
    "Bellary",
    "Udupi",
    "Hassan",
    "Mandya",
    "Raichur",
    "Chitradurga",
  ],
  "Andhra Pradesh": [
    "Visakhapatnam",
    "Vijayawada",
    "Guntur",
    "Nellore",
    "Kurnool",
    "Tirupati",
    "Rajahmundry",
    "Kakinada",
    "Anantapur",
    "Kadapa",
    "Eluru",
    "Ongole",
    "Chittoor",
    "Srikakulam",
    "Amaravati",
  ],
  "Telangana": [
    "Hyderabad",
    "Warangal",
    "Nizamabad",
    "Karimnagar",
    "Khammam",
    "Mahbubnagar",
    "Nalgonda",
    "Adilabad",
    "Medak",
    "Rangareddy",
    "Secunderabad",
  ],
  "Maharashtra": [
    "Mumbai",
    "Pune",
    "Nagpur",
    "Nashik",
    "Aurangabad",
    "Thane",
    "Solapur",
    "Kolhapur",
    "Navi Mumbai",
    "Sangli",
    "Amravati",
  ],
  "Delhi": [
    "New Delhi",
    "North Delhi",
    "South Delhi",
    "East Delhi",
    "West Delhi",
    "Central Delhi",
    "Dwarka",
    "Noida",
    "Gurgaon (Gurugram)",
    "Faridabad",
    "Ghaziabad",
  ],
  "Gujarat": [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Gandhinagar",
    "Bhavnagar",
    "Junagadh",
    "Jamnagar",
    "Anand",
  ],
  "Rajasthan": [
    "Jaipur",
    "Jodhpur",
    "Udaipur",
    "Kota",
    "Ajmer",
    "Bikaner",
    "Alwar",
    "Bhilwara",
  ],
  "Uttar Pradesh": [
    "Lucknow",
    "Kanpur",
    "Varanasi",
    "Agra",
    "Prayagraj (Allahabad)",
    "Meerut",
    "Bareilly",
    "Aligarh",
    "Gorakhpur",
  ],
  "West Bengal": [
    "Kolkata",
    "Howrah",
    "Durgapur",
    "Siliguri",
    "Asansol",
    "Kharagpur",
  ],
  "Punjab": [
    "Chandigarh",
    "Ludhiana",
    "Amritsar",
    "Jalandhar",
    "Patiala",
    "Bathinda",
  ],
  "Haryana": [
    "Gurgaon (Gurugram)",
    "Faridabad",
    "Panipat",
    "Ambala",
    "Karnal",
    "Hisar",
    "Rohtak",
  ],
  "Madhya Pradesh": [
    "Bhopal",
    "Indore",
    "Jabalpur",
    "Gwalior",
    "Ujjain",
    "Sagar",
  ],
  "Bihar": [
    "Patna",
    "Gaya",
    "Muzaffarpur",
    "Bhagalpur",
    "Darbhanga",
  ],
  "Odisha": [
    "Bhubaneswar",
    "Cuttack",
    "Rourkela",
    "Puri",
    "Berhampur",
  ],
  "Goa": [
    "Panaji",
    "Margao",
    "Vasco da Gama",
    "Mapusa",
  ],
  "Pondicherry": [
    "Pondicherry",
    "Karaikal",
    "Mahe",
    "Yanam",
  ],
  "Abroad": [
    "USA",
    "UK",
    "Canada",
    "Australia",
    "Singapore",
    "UAE (Dubai)",
    "Qatar",
    "Kuwait",
    "Saudi Arabia",
    "Germany",
    "New Zealand",
    "Malaysia",
    "Other Country",
  ],
};

export const ALL_CITIES = Object.values(STATE_CITIES).flat();

export const RASHIS = [
  "Mesha (Aries)",
  "Vrishabha (Taurus)",
  "Mithuna (Gemini)",
  "Karka (Cancer)",
  "Simha (Leo)",
  "Kanya (Virgo)",
  "Tula (Libra)",
  "Vrischika (Scorpio)",
  "Dhanu (Sagittarius)",
  "Makara (Capricorn)",
  "Kumbha (Aquarius)",
  "Meena (Pisces)",
] as const;

export const FAMILY_TYPE_OPTIONS = ["Joint Family", "Nuclear Family"] as const;

export const FAMILY_STATUS_OPTIONS = [
  "Middle Class",
  "Upper Middle Class",
  "Rich",
  "Affluent",
] as const;

export const MARITAL_STATUS_OPTIONS = [
  { value: "never_married", label: "Never Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "awaiting_divorce", label: "Awaiting Divorce" },
] as const;

export const DOSHAM_OPTIONS = [
  "No Dosham",
  "Chevvai Dosham",
  "Rahu-Ketu Dosham",
  "Don't Know",
] as const;

export const DIET_OPTIONS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "non_vegetarian", label: "Non-Vegetarian" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "vegan", label: "Vegan" },
] as const;

export const SMOKING_OPTIONS = [
  { value: "no", label: "No" },
  { value: "occasionally", label: "Occasionally" },
  { value: "yes", label: "Yes" },
] as const;

export const DRINKING_OPTIONS = [
  { value: "no", label: "No" },
  { value: "occasionally", label: "Occasionally" },
  { value: "yes", label: "Yes" },
] as const;

export const STAR_COMPATIBILITY_OPTIONS = [
  { value: "must", label: "Must Match" },
  { value: "preferred", label: "Preferred" },
  { value: "not_important", label: "Not Important" },
] as const;

export const DOSHAM_PREF_OPTIONS = [
  { value: "must_not", label: "Must Not Have Dosham" },
  { value: "doesnt_matter", label: "Doesn't Matter" },
] as const;

export const DIET_PREF_OPTIONS = [
  { value: "must_veg", label: "Must Be Vegetarian" },
  { value: "doesnt_matter", label: "Doesn't Matter" },
] as const;

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "any", label: "Doesn't Matter" },
  { value: "employed", label: "Employed (Private/MNC)" },
  { value: "business", label: "Business / Self-Employed" },
  { value: "government", label: "Government / PSU" },
  { value: "not_working_ok", label: "Not Working is OK" },
] as const;

export const CITIZENSHIP_OPTIONS = [
  { value: "any", label: "Doesn't Matter" },
  { value: "indian", label: "Indian Citizen (India Based)" },
  { value: "nri", label: "NRI / Abroad Settled" },
  { value: "open_to_relocate", label: "Open to Relocate Abroad" },
] as const;

export const CHILDREN_ACCEPTABLE_OPTIONS = [
  { value: "doesnt_matter", label: "Doesn't Matter" },
  { value: "no", label: "Should Not Have Children" },
  { value: "yes", label: "OK with Children" },
] as const;

export const SMOKING_PREF_OPTIONS = [
  { value: "no", label: "Must Not Smoke" },
  { value: "occasionally_ok", label: "Occasionally is OK" },
  { value: "doesnt_matter", label: "Doesn't Matter" },
] as const;

export const DRINKING_PREF_OPTIONS = [
  { value: "no", label: "Must Not Drink" },
  { value: "occasionally_ok", label: "Occasionally is OK" },
  { value: "doesnt_matter", label: "Doesn't Matter" },
] as const;

export const COMPLEXION_OPTIONS = [
  { value: "any", label: "Doesn't Matter" },
  { value: "very_fair", label: "Very Fair" },
  { value: "fair", label: "Fair" },
  { value: "wheatish", label: "Wheatish" },
  { value: "dark", label: "Dark" },
] as const;

export const PHYSICAL_DISABILITY_PREF_OPTIONS = [
  { value: "no_disability", label: "No Physical Disability" },
  { value: "doesnt_matter", label: "Doesn't Matter" },
] as const;

export const FAMILY_TYPE_PREF_OPTIONS = [
  { value: "any", label: "Doesn't Matter" },
  { value: "nuclear", label: "Nuclear Family" },
  { value: "joint", label: "Joint Family" },
] as const;

export const PORUTHAMS = [
  { name: "Dina Porutham", tamilName: "தின பொருத்தம்" },
  { name: "Gana Porutham", tamilName: "கண பொருத்தம்" },
  { name: "Mahendra Porutham", tamilName: "மகேந்திர பொருத்தம்" },
  { name: "Stree Deergha", tamilName: "ஸ்திரீ தீர்க்கம்" },
  { name: "Yoni Porutham", tamilName: "யோனி பொருத்தம்" },
  { name: "Rasi Porutham", tamilName: "ராசி பொருத்தம்" },
  { name: "Rasiyathipathi", tamilName: "ராசியாதிபதி" },
  { name: "Vasya Porutham", tamilName: "வசிய பொருத்தம்" },
  { name: "Rajju Porutham", tamilName: "ரஜ்ஜு பொருத்தம்" },
  { name: "Vedha Porutham", tamilName: "வேதை பொருத்தம்" },
] as const;

export const PREMIUM_PLANS = [
  {
    id: "premium_3" as const,
    label: "3 Months",
    months: 3,
    totalPrice: 2999,
    monthlyPrice: 999,
    isPopular: false,
  },
  {
    id: "premium_6" as const,
    label: "6 Months",
    months: 6,
    totalPrice: 4999,
    monthlyPrice: 833,
    savings: "Save 17%",
    isPopular: true,
  },
  {
    id: "premium_12" as const,
    label: "12 Months",
    months: 12,
    totalPrice: 7999,
    monthlyPrice: 666,
    savings: "Save 33%",
    isPopular: false,
  },
] as const;

export const WIZARD_STEPS = [
  { step: 1, label: "Basic Info", description: "Tell us about yourself" },
  { step: 2, label: "Religion & Family", description: "Family background details" },
  { step: 3, label: "Career", description: "Education & professional details" },
  { step: 4, label: "About & Life", description: "Lifestyle and personality" },
  { step: 5, label: "Photos", description: "Add photos and verification" },
  { step: 6, label: "Partner Prefs", description: "What you're looking for" },
] as const;
